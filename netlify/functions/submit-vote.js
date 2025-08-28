// POST { manager, category, nomineeId, nomineeName, season } -> { ok:true }
import { google } from "googleapis";
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.json();
  if (body.season !== process.env.ALLOWED_SEASON) return new Response("Bad season", { status: 400 });
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const row = [
    new Date().toISOString(),
    body.manager, body.category, body.nomineeId, body.nomineeName
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Votes_S25!A:E",
    valueInputOption: "RAW",
    requestBody: { values: [row] }
  });
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" }});
}