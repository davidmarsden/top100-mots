// netlify/functions/reset-votes.js
import { google } from "googleapis";

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const supplied = req.headers.get("x-admin-reset") || "";
    const expected = process.env.ADMIN_RESET_TOKEN || "";
    if (!expected || supplied !== expected) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const season = body?.season || process.env.ALLOWED_SEASON || "S25";
    const sheetName = `Votes_${season}`;

    // Auth
    const credsRaw = process.env.GOOGLE_SERVICE_ACCOUNT;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!credsRaw || !sheetId) {
      return new Response(JSON.stringify({ ok: false, error: "missing_credentials" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    const credentials = JSON.parse(credsRaw);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Ensure the sheet exists (creates if missing)
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existing = meta.data.sheets?.map((s) => s.properties?.title) || [];
    if (!existing.includes(sheetName)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            { addSheet: { properties: { title: sheetName } } },
          ],
        },
      });
    }

    // Clear sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`,
    });

    // Re-write header row
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:E1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["Timestamp", "Manager", "Category", "NomineeId", "NomineeName"]],
      },
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("reset-votes error", e);
    return new Response(JSON.stringify({ ok: false, error: "server_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}