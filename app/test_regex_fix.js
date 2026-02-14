const bodyContent = `
[EMAIL DEBUG] FELIX WEISSBERG, DU HAST 0,01 € EUR ERHALTEN

Hallo Felix Weissberg!

PayPal
[https://www.paypalobjects.com/digitalassets/c/system-triggered-email/n/layout/images/ppe/pp-logo_x2.png]

Felix Weißberg hat dir 0,01 € EUR gesendet

Transaktionsdetails

Transaktionscode
66R54798P9952314F
[https://www.paypal.com/myaccount/activities/details/66R54798P9952314F?source=p2p_email_goto_paypal...]
Transaktionsdatum
14. Februar 2026

--------------------------------------------------------------------------------

Erhaltener Betrag 0,01 € EUR

Mitteilung von Felix Weißberg 8850e25f-c291-4cef-a51b-70e799ce5c77

--------------------------------------------------------------------------------
`;

// Old Regex (Failed)
const oldAmountRegex = /\*Erhaltener Betrag\*\s+([\d.,]+)\s+€/i;

// New Regex (Proposed) - Remove asterisks, allow optional ':' maybe? The text doesn't have it.
const newAmountRegex = /Erhaltener Betrag\s+([\d.,]+)\s+€/i;

const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;

console.log("--- TEST OLD ---");
console.log("Amount:", bodyContent.match(oldAmountRegex));

console.log("\n--- TEST NEW ---");
const matchNew = bodyContent.match(newAmountRegex);
console.log("Amount:", matchNew);

console.log("\n--- TEST UUID ---");
console.log("UUID:", bodyContent.match(uuidRegex));

if (matchNew && bodyContent.match(uuidRegex)) {
    console.log("\nSUCCESS: Both matched.");
} else {
    console.log("\nFAILURE: One or both failed.");
}
