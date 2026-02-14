import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initDB, getDB } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { sendPaymentEmail, checkEmails } from './email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});

app.use(cors());
app.use(express.json());

// Content Security Policy
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "media-src 'self' data: https:; " +
        "connect-src 'self' wss: https: http:; " +
        "font-src 'self' data: https: https://fonts.gstatic.com;"
    );
    next();
});

// Serve static files from the React app
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Initialize DB
initDB().then(() => {
    console.log('Database initialized');
    // Start Email Polling
    setInterval(() => {
        checkEmails(io);
    }, 60000); // Check every minute
}).catch(err => {
    console.error('Failed to initialize database', err);
});

// Auth Middleware
const requireAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token === process.env.HOST_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// API Endpoints

// Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.HOST_PASSWORD) {
        res.json({ token: password }); // Simple token logic for now
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Update Order Item (Edit)
app.patch('/api/orders/:id/items/:itemId', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { itemId } = req.params;
        const { itemName, price } = req.body;

        await db.run('UPDATE order_items SET itemName = ?, price = ? WHERE id = ?', [itemName, price, itemId]);

        // Recalculate User Order Total ??
        // Complex: Updating item price changes totalAmount of user_order.
        // We should recalculate based on all items.
        // Get userOrderId
        const item = await db.get('SELECT userOrderId, sessionId FROM order_items WHERE id = ?', itemId);
        if (item) {
            const items = await db.all('SELECT price FROM order_items WHERE userOrderId = ?', item.userOrderId);
            const newTotal = items.reduce((sum, i) => sum + i.price, 0);
            await db.run('UPDATE user_orders SET totalAmount = ? WHERE id = ?', [newTotal, item.userOrderId]);

            io.to(item.sessionId).emit('session_updated'); // Force refresh
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Order Item
app.delete('/api/orders/:id/items/:itemId', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { itemId } = req.params;

        const item = await db.get('SELECT userOrderId, sessionId FROM order_items WHERE id = ?', itemId);
        if (item) {
            await db.run('DELETE FROM order_items WHERE id = ?', itemId);

            // Recalculate
            const items = await db.all('SELECT price FROM order_items WHERE userOrderId = ?', item.userOrderId);
            const newTotal = items.reduce((sum, i) => sum + i.price, 0);
            await db.run('UPDATE user_orders SET totalAmount = ? WHERE id = ?', [newTotal, item.userOrderId]);

            io.to(item.sessionId).emit('session_updated');
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Mark Order as Paid (Host Manual Update)
app.post('/api/orders/:id/mark-paid', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { isPaid } = req.body; // true/false

        await db.run('UPDATE user_orders SET isPaid = ? WHERE id = ?', [isPaid ? 1 : 0, id]);

        const order = await db.get('SELECT sessionId FROM user_orders WHERE id = ?', id);
        if (order) {
            io.to(order.sessionId).emit('session_updated');
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Settings
app.get('/api/settings/:key', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { key } = req.params;
        const row = await db.get('SELECT value FROM settings WHERE key = ?', key);
        res.json({ value: row ? row.value : null });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Settings
app.post('/api/settings', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { key, value } = req.body;
        await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', [key, value, value]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create new session
app.post('/api/sessions', async (req, res) => {
    try {
        const db = getDB();
        const { name } = req.body;
        const id = uuidv4();
        const hostId = uuidv4();
        const createdAt = Date.now();

        await db.run(
            'INSERT INTO sessions (id, name, hostId, createdAt) VALUES (?, ?, ?, ?)',
            [id, name, hostId, createdAt]
        );

        res.status(201).json({ id, hostId, name, createdAt, status: 'ACTIVE' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// List all sessions (Overview)
app.get('/api/sessions', async (req, res) => {
    try {
        const db = getDB();
        const sessions = await db.all(`
            SELECT s.*, 
                   COUNT(oi.id) as totalItems,
                   SUM(CASE WHEN uo.isPaid = 1 THEN 1 ELSE 0 END) as paidItems
            FROM sessions s
            LEFT JOIN user_orders uo ON s.id = uo.sessionId
            LEFT JOIN order_items oi ON uo.id = oi.userOrderId
            GROUP BY s.id
            ORDER BY s.createdAt DESC
        `);
        // Note: paidItems logic above is approx, counting paid orders vs items. 
        // Better: Count items where parent order is paid.
        res.json(sessions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get specific session details
app.get('/api/sessions/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const session = await db.get('SELECT * FROM sessions WHERE id = ?', id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Get User Orders with their items
        const userOrders = await db.all('SELECT * FROM user_orders WHERE sessionId = ? ORDER BY createdAt DESC', id);

        // Enrich with items
        for (let order of userOrders) {
            order.items = await db.all('SELECT * FROM order_items WHERE userOrderId = ?', order.id);
        }

        res.json({ ...session, userOrders });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Submit User Order (Cart Submission)
app.post('/api/sessions/:id/submit', async (req, res) => {
    try {
        const db = getDB();
        const { id: sessionId } = req.params;
        const { userName, userEmail, items } = req.body; // items: [{itemName, price}]

        const userOrderId = uuidv4();
        const createdAt = Date.now();
        const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
        let finalAmount = totalAmount;
        let creditsUsed = 0;

        // Check for credits
        const creditEntry = await db.get('SELECT balance FROM user_credits WHERE email = ?', userEmail);
        if (creditEntry && creditEntry.balance > 0) {
            if (creditEntry.balance >= totalAmount) {
                creditsUsed = totalAmount;
                finalAmount = 0;
                // Update credit balance
                await db.run('UPDATE user_credits SET balance = balance - ? WHERE email = ?', [creditsUsed, userEmail]);
            } else {
                creditsUsed = creditEntry.balance;
                finalAmount = totalAmount - creditsUsed;
                // Zero out credit balance
                await db.run('UPDATE user_credits SET balance = 0 WHERE email = ?', userEmail);
            }
        }

        await db.run(
            'INSERT INTO user_orders (id, sessionId, userName, userEmail, totalAmount, paidAmount, isPaid, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userOrderId, sessionId, userName, userEmail, totalAmount, creditsUsed > 0 ? creditsUsed : 0, finalAmount === 0 ? 1 : 0, createdAt]
        );

        const newItems = [];
        for (const item of items) {
            const itemId = uuidv4();
            await db.run(
                'INSERT INTO order_items (id, sessionId, userOrderId, userName, itemName, price, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [itemId, sessionId, userOrderId, userName, item.itemName, item.price, createdAt]
            );
            newItems.push({ id: itemId, itemName: item.itemName, price: item.price });
        }

        const newOrder = {
            id: userOrderId,
            sessionId,
            userName,
            userEmail,
            totalAmount,
            paidAmount: creditsUsed,
            isPaid: finalAmount === 0 ? 1 : 0,
            items: newItems,
            createdAt
        };
        io.to(sessionId).emit('order_added', newOrder);
        res.status(201).json(newOrder);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Lock Session & Send Emails
app.post('/api/sessions/:id/lock', async (req, res) => {
    try {
        const db = getDB();
        const { id: sessionId } = req.params;
        const { template } = req.body; // Email template
        const hostIdHeader = req.headers['x-host-id'];

        // Verify Host
        const session = await db.get('SELECT hostId FROM sessions WHERE id = ?', sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (session.hostId !== hostIdHeader) return res.status(403).json({ error: 'Unauthorized' });

        // Update Session Status and Save Template
        await db.run('UPDATE sessions SET status = "LOCKED", emailTemplate = ? WHERE id = ?', [template, sessionId]);

        // Save as Default Setting (Upsert)
        await db.run('INSERT INTO settings (key, value) VALUES ("email_template", ?) ON CONFLICT(key) DO UPDATE SET value = ?', [template, template]);

        // Get all unpaid user orders
        const orders = await db.all('SELECT * FROM user_orders WHERE sessionId = ? AND isPaid = 0', sessionId);

        // Send Emails
        for (const order of orders) {
            if (order.userEmail) {
                sendPaymentEmail(order.userEmail, order.id, order.totalAmount, template);
            }
        }

        io.to(sessionId).emit('session_locked');
        res.json({ success: true, count: orders.length });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// Socket.io
io.on('connection', (socket) => {
    socket.on('join_session', (sessionId) => {
        socket.join(sessionId);
    });
});

// User Balance APIs
app.get('/api/users', requireAuth, async (req, res) => {
    try {
        const db = getDB();

        // 1. Get all credits
        const credits = await db.all('SELECT email, balance FROM user_credits');
        const creditMap = {};
        credits.forEach(c => creditMap[c.email] = c.balance);

        // 2. Get all unpaid orders (debt)
        const unpaidOrders = await db.all('SELECT userEmail, totalAmount, paidAmount FROM user_orders WHERE isPaid = 0');
        const debtMap = {};

        unpaidOrders.forEach(o => {
            if (!o.userEmail) return;
            const debt = o.totalAmount - (o.paidAmount || 0);
            if (debt > 0.001) {
                debtMap[o.userEmail] = (debtMap[o.userEmail] || 0) + debt;
            }
        });

        // 3. Merge lists
        const allEmails = new Set([...Object.keys(creditMap), ...Object.keys(debtMap)]);
        const result = [];

        allEmails.forEach(email => {
            result.push({
                email,
                credit: creditMap[email] || 0,
                debt: debtMap[email] || 0
            });
        });

        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users/credit', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { email, credit } = req.body;

        if (!email || credit === undefined) {
            return res.status(400).json({ error: 'Missing email or credit' });
        }

        await db.run(`
            INSERT INTO user_credits (email, balance) 
            VALUES (?, ?) 
            ON CONFLICT(email) DO UPDATE SET balance = ?
        `, [email, credit, credit]);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Order (Entire Order)
app.delete('/api/orders/:id', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const order = await db.get('SELECT sessionId FROM user_orders WHERE id = ?', id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Delete items first
        await db.run('DELETE FROM order_items WHERE userOrderId = ?', id);
        // Delete order
        await db.run('DELETE FROM user_orders WHERE id = ?', id);

        io.to(order.sessionId).emit('session_updated');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete User (Clear Credit/Account)
app.delete('/api/users/:email', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { email } = req.params;

        await db.run('DELETE FROM user_credits WHERE email = ?', email);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Session (Limit to Host)
app.delete('/api/sessions/:id', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        // Delete dependencies
        const orders = await db.all('SELECT id FROM user_orders WHERE sessionId = ?', id);
        for (const order of orders) {
            await db.run('DELETE FROM order_items WHERE userOrderId = ?', order.id);
        }
        await db.run('DELETE FROM user_orders WHERE sessionId = ?', id);
        await db.run('DELETE FROM sessions WHERE id = ?', id);

        io.emit('session_deleted', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Serve React App
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on ${process.env.HOST_URL || `http://localhost:${PORT}`}`);
});
