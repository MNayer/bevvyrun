import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initDB, getDB } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { sendPaymentEmail, checkEmails } from './email.js';
import fs from 'fs';

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

// Serve uploads
const dataDir = process.env.DATA_DIR || './data';
app.use('/uploads', express.static(path.join(dataDir, 'uploads')));

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
// Update Order Item (Edit)
app.patch('/api/orders/:id/items/:itemId', async (req, res) => {
    try {
        const db = getDB();
        const { itemId } = req.params;
        const { itemName, price } = req.body;

        // Auth Check
        const item = await db.get('SELECT userOrderId, sessionId FROM order_items WHERE id = ?', itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const session = await db.get('SELECT hostId FROM sessions WHERE id = ?', item.sessionId);
        const adminToken = req.headers['authorization'];
        const hostIdHeader = req.headers['x-host-id'];

        if (adminToken !== process.env.HOST_PASSWORD && (!session || session.hostId !== hostIdHeader)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await db.run('UPDATE order_items SET itemName = ?, price = ? WHERE id = ?', [itemName, price, itemId]);

        // Recalculate User Order Total
        const items = await db.all('SELECT price FROM order_items WHERE userOrderId = ?', item.userOrderId);
        const newTotal = items.reduce((sum, i) => sum + i.price, 0);
        await db.run('UPDATE user_orders SET totalAmount = ? WHERE id = ?', [newTotal, item.userOrderId]);

        io.to(item.sessionId).emit('session_updated'); // Force refresh

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Order Item
// Delete Order Item
app.delete('/api/orders/:id/items/:itemId', async (req, res) => {
    try {
        const db = getDB();
        const { itemId } = req.params;

        // Auth Check
        const item = await db.get('SELECT userOrderId, sessionId FROM order_items WHERE id = ?', itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const session = await db.get('SELECT hostId FROM sessions WHERE id = ?', item.sessionId);
        const adminToken = req.headers['authorization'];
        const hostIdHeader = req.headers['x-host-id'];

        if (adminToken !== process.env.HOST_PASSWORD && (!session || session.hostId !== hostIdHeader)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await db.run('DELETE FROM order_items WHERE id = ?', itemId);

        // Recalculate
        const items = await db.all('SELECT price FROM order_items WHERE userOrderId = ?', item.userOrderId);
        const newTotal = items.reduce((sum, i) => sum + i.price, 0);
        await db.run('UPDATE user_orders SET totalAmount = ? WHERE id = ?', [newTotal, item.userOrderId]);

        io.to(item.sessionId).emit('session_updated');

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Mark Order as Paid (Host Manual Update)
// Mark Order as Paid (Host Manual Update)
app.post('/api/orders/:id/mark-paid', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { isPaid } = req.body; // true/false

        // Auth Check
        const order = await db.get('SELECT sessionId FROM user_orders WHERE id = ?', id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const session = await db.get('SELECT hostId FROM sessions WHERE id = ?', order.sessionId);
        const adminToken = req.headers['authorization'];
        const hostIdHeader = req.headers['x-host-id'];

        if (adminToken !== process.env.HOST_PASSWORD && (!session || session.hostId !== hostIdHeader)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await db.run('UPDATE user_orders SET isPaid = ? WHERE id = ?', [isPaid ? 1 : 0, id]);
        io.to(order.sessionId).emit('session_updated');

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Settings
app.get('/api/settings/:key', async (req, res) => {
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
app.get('/api/users', async (req, res) => {
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
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const order = await db.get('SELECT sessionId FROM user_orders WHERE id = ?', id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const session = await db.get('SELECT hostId FROM sessions WHERE id = ?', order.sessionId);
        const adminToken = req.headers['authorization'];
        const hostIdHeader = req.headers['x-host-id'];

        if (adminToken !== process.env.HOST_PASSWORD && (!session || session.hostId !== hostIdHeader)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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

// Send Reminder Emails
app.post('/api/users/:email/remind', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { email } = req.params;

        // Find unpaid orders for this user
        const orders = await db.all('SELECT * FROM user_orders WHERE userEmail = ? AND isPaid = 0', email);

        if (orders.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        let count = 0;
        for (const order of orders) {
            // Get Session Template if locked, or Global Default
            const session = await db.get('SELECT emailTemplate, status FROM sessions WHERE id = ?', order.sessionId);
            let template = session ? session.emailTemplate : null;

            if (!template) {
                const setting = await db.get('SELECT value FROM settings WHERE key = "email_template"');
                template = setting ? setting.value : "Please pay {ORDER_AMOUNT} for your order {ORDER_ID}.";
            }

            if (template) {
                sendPaymentEmail(email, order.id, order.totalAmount - (order.paidAmount || 0), template, "Reminder: Payment Request - BevvyRun");
                count++;
            }
        }

        res.json({ success: true, count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Session (Limit to Host)
app.delete('/api/sessions/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const session = await db.get('SELECT hostId FROM sessions WHERE id = ?', id);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const adminToken = req.headers['authorization'];
        const hostIdHeader = req.headers['x-host-id'];

        if (adminToken !== process.env.HOST_PASSWORD && session.hostId !== hostIdHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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

// --- PURCHASES ---
app.get('/api/purchases', async (req, res) => {
    try {
        const db = getDB();
        const purchases = await db.all('SELECT * FROM purchases ORDER BY createdAt DESC');
        res.json(purchases);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/purchases', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { name, amount, type, image } = req.body;
        const id = uuidv4();
        const createdAt = Date.now();
        let imageFilename = null;

        if (image && image.startsWith('data:image')) {
            const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                imageFilename = `${id}.${ext}`;
                const uploadPath = path.join(dataDir, 'uploads', imageFilename);
                fs.writeFileSync(uploadPath, buffer);
            }
        }

        await db.run(
            'INSERT INTO purchases (id, name, amount, type, imageFilename, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, amount, type || 'OTHER', imageFilename, createdAt]
        );

        res.status(201).json({ success: true, id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch('/api/purchases/:id', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { name, amount, type, image } = req.body;
        
        const purchase = await db.get('SELECT imageFilename FROM purchases WHERE id = ?', id);
        if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

        let imageFilename = purchase.imageFilename;

        if (image && image.startsWith('data:image')) {
            const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                imageFilename = `${id}.${ext}`;
                const uploadPath = path.join(dataDir, 'uploads', imageFilename);
                fs.writeFileSync(uploadPath, buffer);
            }
        } else if (image === null && purchase.imageFilename) {
            // Remove image if image is explicitly passed as null
            const oldPath = path.join(dataDir, 'uploads', purchase.imageFilename);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
            imageFilename = null;
        }

        await db.run(
            'UPDATE purchases SET name = ?, amount = ?, type = ?, imageFilename = ? WHERE id = ?',
            [name, amount, type, imageFilename, id]
        );

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/purchases/:id', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const purchase = await db.get('SELECT imageFilename FROM purchases WHERE id = ?', id);
        if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

        if (purchase.imageFilename) {
            const imagePath = path.join(dataDir, 'uploads', purchase.imageFilename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await db.run('DELETE FROM purchases WHERE id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- WITHDRAWALS ---
app.get('/api/withdrawals', async (req, res) => {
    try {
        const db = getDB();
        const withdrawals = await db.all('SELECT * FROM withdrawals ORDER BY createdAt DESC');
        res.json(withdrawals);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/withdrawals', requireAuth, async (req, res) => {
    try {
        const db = getDB();
        const { amount } = req.body;
        const id = uuidv4();
        const createdAt = Date.now();

        await db.run(
            'INSERT INTO withdrawals (id, amount, createdAt) VALUES (?, ?, ?)',
            [id, amount, createdAt]
        );

        res.status(201).json({ success: true, id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- ACCOUNTING ---
app.get('/api/accounting', async (req, res) => {
    try {
        const db = getDB();
        const view = req.query.view || 'general'; // 'general' or 'coffee'

        // Get Credits
        const credits = await db.all('SELECT balance FROM user_credits');
        const totalCreditBalance = credits.reduce((sum, c) => sum + c.balance, 0);

        // Get Orders
        let ordersQuery = 'SELECT uo.*, s.name as sessionName FROM user_orders uo JOIN sessions s ON uo.sessionId = s.id';
        let ordersParams = [];

        if (view === 'coffee') {
            ordersQuery += ' WHERE LOWER(s.name) LIKE ?';
            ordersParams.push('%coffee%');
        }

        const orders = await db.all(ordersQuery, ordersParams);

        let totalOrdersValue = 0;
        let totalUserDebt = 0;

        for (const o of orders) {
            totalOrdersValue += o.totalAmount;
            if (o.isPaid === 0) {
                totalUserDebt += (o.totalAmount - (o.paidAmount || 0));
            }
        }

        // Get Purchases
        let purchasesQuery = 'SELECT * FROM purchases';
        let purchasesParams = [];

        if (view === 'coffee') {
            purchasesQuery += ' WHERE type = ?';
            purchasesParams.push('COFFEE');
        }

        const purchases = await db.all(purchasesQuery, purchasesParams);
        const totalPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);

        // Get Withdrawals
        const withdrawals = await db.all('SELECT * FROM withdrawals');
        // Withdrawals are always counted, or maybe we don't subtract them in "coffee" view to see strictly coffee profit?
        // Let's only apply withdrawals to general view to show exact register cash.
        // Wait, if it's a "coffee" view, do we show register cash?
        // "coffee view that only includes coffee runs and coffee bean purchases."
        // We'll calculate a "coffee balance" = Coffee Orders - Coffee Purchases.
        // But let's return totalWithdrawals regardless.
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

        // Calculate Register Cash
        // Formula: Sum(orders) - Sum(debt) + Sum(credits) - Sum(purchases) - Sum(withdrawals)
        // Wait, if view=coffee, credits and withdrawals aren't easily partitioned.
        // So the frontend can display whatever it wants.
        const moneyCollectedFromOrders = totalOrdersValue - totalUserDebt;
        let registerBalance = moneyCollectedFromOrders + totalCreditBalance - totalPurchases - totalWithdrawals;

        res.json({
            totalOrdersValue,
            totalUserDebt,
            totalCreditBalance,
            totalPurchases,
            totalWithdrawals,
            registerBalance,
            moneyCollectedFromOrders,
            purchases,
            withdrawals
        });
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
