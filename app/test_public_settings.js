// Native fetch in Node 20

const BASE_URL = 'http://localhost:3000';

async function testPublic() {
    console.log(`Testing Public API at ${BASE_URL}`);

    // Read Settings WITHOUT Token
    console.log("\n--- Read Settings (Public GET) ---");
    const readRes = await fetch(`${BASE_URL}/api/settings/email_template`); // No headers

    if (readRes.ok) {
        const data = await readRes.json();
        console.log("Read Data:", data);
        console.log("SUCCESS: Public read worked.");
    } else {
        console.log("Read Failed:", readRes.status, await readRes.text());
        console.log("FAILURE: Public read failed (maybe still requires auth?)");
    }
}

testPublic().catch(console.error);
