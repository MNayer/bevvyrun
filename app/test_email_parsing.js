import { simpleParser } from 'mailparser';

const rawEmail = `Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: quoted-printable

<html dir=3D"ltr" lang=3D"de">=0A=0A  <head>=0A    <meta http-equiv=3D"Cont=
ent-Type" content=3D"text/html; charset=3Dutf-8">=0A  </head>=0A  <body>=0A=
    <p>Felix Weissberg, Du hast 0,01 =E2=82=AC EUR erhalten</p>=0A    <p>*Erhaltener Be=
trag* 	0,01 =E2=82=AC EUR</p>=0A    <p>*Mitteilung von Felix Wei=C3=9Fberg* 	4c355bc4-e8f6-=
47b1-bc39-94b2fbb9619d</p>=0A  </body>=0A</html>`;

// Simulated raw structure as if from IMAP (simplified)
// The user provided "The email has the following content" which looks like the DECODED text but heavily formatted?
// Wait, the user said "The email has the following content:" and pasted the PLAIN text (mostly).
// BUT the error log said: "[EMAIL DEBUG] Processing message body: <html dir=3D"ltr" ..."
// So the Body IS Quoted-Printable HTML.

// I will try to reconstruct a QP encoded string that likely matches the user's log.
// The snippet above is a guess.

async function testConfig() {
    try {
        const parsed = await simpleParser(rawEmail);
        console.log("--- PARSED TEXT ---");
        console.log(parsed.text);
        console.log("-------------------");

        const bodyContent = parsed.text;

        // Regex for Amount (European format: 18,80)
        // Note: The user's text had tabs and newlines. Mailparser might normalize.
        const amountRegex = /\*Erhaltener Betrag\*\s+([\d.,]+)\s+€/i;
        const matchAmount = bodyContent.match(amountRegex);

        // Regex for Order ID (UUID)
        const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
        const matchId = bodyContent.match(uuidRegex);

        console.log("Match Amount:", matchAmount ? matchAmount[1] : "NO MATCH");
        console.log("Match ID:", matchId ? matchId[0] : "NO MATCH");

    } catch (e) {
        console.error(e);
    }
}

testConfig();
