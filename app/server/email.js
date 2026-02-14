import 'dotenv/config';
import nodemailer from 'nodemailer';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { getDB } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.web.de';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // string to boolean
const IMAP_HOST = process.env.IMAP_HOST || 'imap.web.de';
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993');
const IMAP_TLS = process.env.IMAP_TLS === 'true' || true; // Default true
const DEBUG_EMAIL = process.env.DEBUG_EMAIL === 'true';

function logDebug(...args) {
    if (DEBUG_EMAIL) {
        console.log('[EMAIL DEBUG]', ...args);
    }
}

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

export async function sendPaymentEmail(to, orderId, amount, template) {
    const text = template
        .replace(/{ORDER_ID}/g, orderId)
        .replace(/{ORDER_AMOUNT}/g, amount.toFixed(2));

    try {
        logDebug(`Sending email to ${to} for order ${orderId}`);
        await transporter.sendMail({
            from: `"BevvyRun" <${EMAIL_USER}>`,
            to,
            subject: 'Payment Request - BevvyRun',
            text,
        });
        console.log(`Email sent to ${to} for order ${orderId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        logDebug('Send Error Details:', error);
    }
}

export async function checkEmails(io) {
    const config = {
        imap: {
            user: EMAIL_USER,
            password: EMAIL_PASS,
            host: IMAP_HOST,
            port: IMAP_PORT,
            tls: IMAP_TLS,
            authTimeout: 3000,
        },
    };

    try {
        logDebug('Connecting to IMAP...');
        const connection = await imaps.connect(config);
        logDebug('IMAP Connected. Opening INBOX...');
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: [''], // Fetch full message source
            markSeen: true,
        };

        logDebug('Searching for UNSEEN messages...');
        const messages = await connection.search(searchCriteria, fetchOptions);
        logDebug(`Found ${messages.length} messages.`);

        for (const item of messages) {
            const all = item.parts.find(p => p.which === '');
            if (all) {
                const rawSource = all.body;

                // Parse the full raw email
                const parsed = await simpleParser(rawSource);
                const bodyContent = parsed.text; // Normalized plain text

                if (!bodyContent) {
                    logDebug('No text content found in email.');
                    continue;
                }

                // Log FULL body for debugging as requested
                logDebug('--- FULL PARSED BODY START ---');
                logDebug(bodyContent);
                logDebug('--- FULL PARSED BODY END ---');

                // Format: *Erhaltener Betrag* 18,80 € EUR
                // *Mitteilung von <user>* <order-id>

                // Regex for Amount (European format: 18,80)
                // Looks for "Erhaltener Betrag (value) €"
                const amountRegex = /Erhaltener Betrag\s+([\d.,]+)\s+€/i;
                const matchAmount = bodyContent.match(amountRegex);

                // Regex for Order ID (UUID)
                // Anchored to "Mitteilung von" to avoid matching UUIDs in URLs/Links
                // Matches "Mitteilung von <Name> <UUID>"
                // We use [\s\S]*? to lazily match the name until the UUID
                const uuidRegex = /Mitteilung von[\s\S]*?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
                const matchId = bodyContent.match(uuidRegex);

                if (matchAmount && matchId) {
                    const amountStr = matchAmount[1].replace('.', '').replace(',', '.'); // Convert 1.234,56 -> 1234.56 or 18,80 -> 18.80
                    const receivedAmount = parseFloat(amountStr);
                    const orderId = matchId[1]; // Capture group 1 is the UUID now

                    console.log(`Found Payment: ${receivedAmount} for Order ID: ${orderId}`);
                    logDebug(`Parsed Amount: ${receivedAmount}, OrderID: ${orderId}`);

                    const db = getDB();
                    const order = await db.get('SELECT * FROM user_orders WHERE id = ?', orderId);

                    if (order && order.isPaid === 0) {
                        const paidSoFar = order.paidAmount || 0;
                        const totalPaid = paidSoFar + receivedAmount;
                        const due = order.totalAmount;

                        if (totalPaid >= due - 0.01) { // Tolerance for float math
                            // Full Payment or Overpayment
                            const excess = totalPaid - due;
                            await db.run('UPDATE user_orders SET isPaid = 1, paidAmount = ? WHERE id = ?', [totalPaid, orderId]);

                            if (excess > 0.01) {
                                // Add credit
                                const existingCredit = await db.get('SELECT balance FROM user_credits WHERE email = ?', order.userEmail);
                                const newBalance = (existingCredit ? existingCredit.balance : 0) + excess;

                                await db.run(`INSERT INTO user_credits (email, balance) VALUES (?, ?) 
                                              ON CONFLICT(email) DO UPDATE SET balance = ?`,
                                    [order.userEmail, newBalance, newBalance]);

                                console.log(`Credited ${excess} to ${order.userEmail}`);
                            }
                            io.to(order.sessionId).emit('order_paid', { orderId });

                        } else {
                            // Partial Payment
                            const remaining = due - totalPaid;

                            const newRefId = uuidv4();

                            // Transaction
                            await db.run('BEGIN TRANSACTION');
                            try {
                                await db.run('UPDATE order_items SET userOrderId = ? WHERE userOrderId = ?', [newRefId, orderId]);
                                await db.run('UPDATE user_orders SET id = ?, paidAmount = ? WHERE id = ?', [newRefId, totalPaid, orderId]);
                                await db.run('COMMIT');

                                // Send email
                                const template = "Payment Received: {RECEIVED}. Remaining: {REMAINING}. Please pay using new Ref: {ORDER_ID}";
                                const text = template
                                    .replace(/{RECEIVED}/g, receivedAmount.toFixed(2))
                                    .replace(/{REMAINING}/g, remaining.toFixed(2))
                                    .replace(/{ORDER_ID}/g, newRefId);

                                await transporter.sendMail({
                                    from: `"BevvyRun" <${EMAIL_USER}>`,
                                    to: order.userEmail,
                                    subject: 'Partial Payment Received - BevvyRun',
                                    text,
                                });

                                // Notify Frontend
                                io.to(order.sessionId).emit('session_updated'); // Force reload?
                                console.log(`Partial payment processed. New Ref: ${newRefId}`);

                            } catch (err) {
                                await db.run('ROLLBACK');
                                console.error("Failed to process partial payment", err);
                                logDebug('Partial Payment Error:', err);
                            }
                        }
                    } else {
                        logDebug('Order not found or already paid:', orderId);
                    }
                } else {
                    logDebug('Failed to match amount or order ID in message.');
                }
            }
        }

        connection.end();
    } catch (error) {
        console.error('Error checking emails:', error);
        logDebug('IMAP Error:', error);
    }
}
