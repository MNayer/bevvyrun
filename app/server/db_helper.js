import { initDB, getDB } from './db.js';

const sql = process.argv[2];

(async () => {
    await initDB();
    const db = getDB();
    try {
        await db.run(sql);
        console.log('SQL executed');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
