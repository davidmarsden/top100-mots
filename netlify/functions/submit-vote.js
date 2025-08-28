// Netlify Functions v2 (ESM). Appends rows to Votes_<season> with 5 columns:
// Timestamp | Manager | Category | NomineeId | NomineeName
import { google } from "googleapis";

async function ensureHeader(sheets, spreadsheetId, sheetTitle) {
  try {
    const meta = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A1:E1`,
    });
    const exists = (meta.data.values || []).length > 0;
    if (exists) return;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1:E1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["Timestamp", "Manager", "Category", "NomineeId", "NomineeName"]],
      },
    });
  } catch {
    // sheet may not exist yet -> create
    const fileMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const has = fileMeta.data.sheets?.some((s) => s.properties?.title === sheetTitle);
    if (!has) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: sheetTitle } } }] },
      });
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1:E1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["Timestamp", "Manager", "Category", "NomineeId", "NomineeName"]],
      },
    });
  }
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { season, category, nomineeId, nomineeName, manager } = await request.json();

    const seasonCode = (season || process.env.ALLOWED_SEASON || "S25").replace(/\s+/g, "");
    const sheetTitle = `Votes_${seasonCode}`;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || "{}"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await ensureHeader(sheets, spreadsheetId, sheetTitle);

    const nowIso = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:E`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[nowIso, manager || "", category || "", nomineeId || "", nomineeName || ""]],
      },
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("submit-vote error", err);
    return new Response("submit-vote failed", { status: 500 });
  }
};