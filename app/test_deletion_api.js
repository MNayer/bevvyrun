// Native fetch in Node 20

const BASE_URL = 'http://localhost:3000';
const HOST_PASSWORD = 'secret'; // Hardcoded for test

async function testDeletion() {
    console.log(`Testing Deletion API at ${BASE_URL}`);

    // 1. Login
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: HOST_PASSWORD })
    });
    const token = (await loginRes.json()).token;
    console.log("Token:", token);

    // 2. Create Session
    const sessionRes = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: "Deletion Test Session" })
    });
    const session = await sessionRes.json();
    console.log("Created Session:", session.id);

    // 3. Add Order
    const orderRes = await fetch(`${BASE_URL}/api/sessions/${session.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: "Delete Me",
            userEmail: "delete@me.com",
            items: [{ itemName: "Item 1", price: 5 }]
        })
    });
    const order = await orderRes.json();
    console.log("Created Order:", order.id);
    const itemId = order.items[0].id;
    console.log("Created Item:", itemId);

    // 4. Delete Item
    console.log("--- Deleting Item ---");
    const delItemRes = await fetch(`${BASE_URL}/api/orders/${order.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });
    console.log("Delete Item Status:", delItemRes.status);

    // 5. Delete Order
    console.log("--- Deleting Order ---");
    const delOrderRes = await fetch(`${BASE_URL}/api/orders/${order.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });
    console.log("Delete Order Status:", delOrderRes.status);

    // 6. Delete Session
    console.log("--- Deleting Session ---");
    const delSessionRes = await fetch(`${BASE_URL}/api/sessions/${session.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });
    console.log("Delete Session Status:", delSessionRes.status);

    // Verify Session is gone
    const checkRes = await fetch(`${BASE_URL}/api/sessions/${session.id}`);
    if (checkRes.status === 404) {
        console.log("SUCCESS: Session deleted.");
    } else {
        console.log("FAILURE: Session still exists.");
    }
}

testDeletion().catch(console.error);
