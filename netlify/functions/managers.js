// GET /api/managers -> { managers: [...names] }
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
      range: "Managers!A2:C",
    });
    const managers = (data.values || [])
      .filter((r) => (r[2] || "").toString().toLowerCase() === "true")
      .map((r) => r[0])
      .filter(Boolean);
    return new Response(JSON.stringify({ managers }), { headers: { "content-type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ managers: [] }), { status: 200, headers: { "content-type": "application/json" }});
  }
}