// Native fetch in Node 20

const BASE_URL = 'http://localhost:3000';
const HOST_PASSWORD = 'secret'; // Hardcoded for test

async function testApi() {
    console.log(`Testing API at ${BASE_URL} with password: ${HOST_PASSWORD}`);

    // 1. Login
    console.log("--- Login ---");
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: HOST_PASSWORD })
    });

    if (!loginRes.ok) {
        console.log("Login Failed:", loginRes.status, await loginRes.text());
        return;
    }
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Login Success. Token:", token);

    // 2. Save Settings
    console.log("\n--- Save Settings (POST) ---");
    const saveRes = await fetch(`${BASE_URL}/api/settings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({ key: 'email_template', value: 'API Test Template' })
    });

    if (saveRes.ok) {
        console.log("Save Success");
    } else {
        console.log("Save Failed:", saveRes.status, await saveRes.text());
    }

    // 3. Read Settings
    console.log("\n--- Read Settings (GET) ---");
    const readRes = await fetch(`${BASE_URL}/api/settings/email_template`, {
        headers: { 'Authorization': token }
    });

    if (readRes.ok) {
        const data = await readRes.json();
        console.log("Read Data:", data);
        if (data.value === 'API Test Template') {
            console.log("SUCCESS: Value matches.");
        } else {
            console.log("FAILURE: Value mismatch.");
        }
    } else {
        console.log("Read Failed:", readRes.status, await readRes.text());
    }
}

testApi().catch(console.error);
