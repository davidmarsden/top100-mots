// GET /api/results -> tallies by category + nominee
import { google } from "googleapis";

export default async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Votes_S26!A:E", // Timestamp | Manager | Category | NomineeId | NomineeName
    });
    const rows = data.values || [];

    const tallies = {};
    for (const r of rows.slice(1)) {
      const category = r[2]; // Category
      const nomineeId = r[3];
      const nomineeName = r[4] || r[3];
      if (!category || !nomineeId) continue;
      tallies[category] ??= {};
      tallies[category][nomineeId] ??= { name: nomineeName, votes: 0 };
      tallies[category][nomineeId].votes += 1;
    }

    return new Response(JSON.stringify({ ok: true, tallies }), { headers: { "content-type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, reason: "server_error" }), { status: 500 });
  }
}