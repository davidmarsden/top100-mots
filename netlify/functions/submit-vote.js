// POST { manager, category, nomineeId, nomineeName, season } -> { ok:true } or { ok:false, reason }
import { google } from "googleapis";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const { manager, category, nomineeId, nomineeName, season } = await req.json();

    if (!manager || !category || !nomineeId || !season) {
      return new Response(JSON.stringify({ ok: false, reason: "missing_fields" }), { status: 400 });
    }
    if (process.env.ALLOWED_SEASON && season !== process.env.ALLOWED_SEASON) {
      return new Response(JSON.stringify({ ok: false, reason: "bad_season" }), { status: 400 });
    }

    // Google Sheets auth
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // One ballot per manager per category (server-side)
    const read = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Votes_S25!A:E", // Timestamp | Manager | Category | NomineeId | NomineeName
    });
    const rows = read.data.values || [];
    const already = rows.some((r) => (r[1] || "").toLowerCase() === manager.toLowerCase()
                                  && (r[2] || "") === category);
    if (already) {
      return new Response(JSON.stringify({ ok: false, reason: "duplicate" }), { status: 409 });
    }

    // Append vote
    const row = [
      new Date().toISOString(),
      manager,
      category,
      nomineeId,
      nomineeName || "",
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Votes_S25!A:E",
      valueInputOption: "RAW",
      requestBody: { values: [row] }
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" }});
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, reason: "server_error" }), { status: 500 });
  }
}