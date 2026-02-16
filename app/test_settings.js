import { initDB, getDB } from './server/db.js';

async function testSettings() {
    await initDB();
    const db = getDB();

    console.log("--- Testing Settings ---");

    // 1. Clean
    await db.run("DELETE FROM settings WHERE key = 'email_template'");

    // 2. Insert
    const key = 'email_template';
    const value = 'Test Template ' + Date.now();
    console.log(`Inserting: ${value}`);
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', [key, value, value]);

    // 3. Read
    const row = await db.get('SELECT value FROM settings WHERE key = ?', key);
    console.log(`Read back: ${row ? row.value : 'NULL'}`);

    if (row && row.value === value) {
        console.log("SUCCESS: Settings saved and read.");
    } else {
        console.log("FAILURE: Settings mismatch.");
    }

    // 4. Update
    const newValue = 'Updated Template ' + Date.now();
    console.log(`Updating to: ${newValue}`);
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', [key, newValue, newValue]);

    const row2 = await db.get('SELECT value FROM settings WHERE key = ?', key);
    console.log(`Read back updated: ${row2 ? row2.value : 'NULL'}`);

    if (row2 && row2.value === newValue) {
        console.log("SUCCESS: Settings updated.");
    } else {
        console.log("FAILURE: Update mismatch.");
    }
}

testSettings().catch(console.error);
