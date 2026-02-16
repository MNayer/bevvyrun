// Native fetch in Node 20

const BASE_URL = 'http://localhost:3000';

async function testFeatures() {
    console.log(`Testing Features at ${BASE_URL}`);

    // 1. Create Session
    const sessionRes = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: "Feature Test Session" })
    });
    const session = await sessionRes.json();
    console.log(`Created Session: ${session.id}, HostID: ${session.hostId}`);

    // 2. Submit Order (Simulate Quantity = 2 -> 2 items)
    // Payload simulates frontend expansion
    const items = [
        { itemName: "Beer", price: 5 },
        { itemName: "Beer", price: 5 } // 2x Beer
    ];

    const orderRes = await fetch(`${BASE_URL}/api/sessions/${session.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: "Quantity User",
            userEmail: "qty@test.com",
            items: items
        })
    });
    const order = await orderRes.json();
    console.log(`Created Order: ${order.id} with ${order.items.length} items`);

    if (order.items.length === 2) {
        console.log("SUCCESS: Quantity (multiple items) submitted.");
    } else {
        console.log("FAILURE: Quantity mismatch.");
    }

    const itemIdToDelete = order.items[0].id;

    // 3. Delete Item using X-Host-ID (No Auth Token)
    console.log("--- Deleting Item as Session Host ---");
    const delItemRes = await fetch(`${BASE_URL}/api/orders/${order.id}/items/${itemIdToDelete}`, {
        method: 'DELETE',
        headers: {
            'X-Host-ID': session.hostId
        }
    });

    if (delItemRes.ok) {
        console.log("SUCCESS: Item deleted by Session Host.");
    } else {
        console.log("FAILURE: Delete Item status", delItemRes.status);
    }

    // 4. Delete Session using X-Host-ID
    console.log("--- Deleting Session as Session Host ---");
    const delSessionRes = await fetch(`${BASE_URL}/api/sessions/${session.id}`, {
        method: 'DELETE',
        headers: {
            'X-Host-ID': session.hostId
        }
    });

    if (delSessionRes.ok) {
        console.log("SUCCESS: Session deleted by Session Host.");
    } else {
        console.log("FAILURE: Delete Session status", delSessionRes.status);
    }
}

testFeatures().catch(console.error);
