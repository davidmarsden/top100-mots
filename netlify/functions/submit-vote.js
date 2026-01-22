// netlify/functions/submit-vote.js
import { google } from "googleapis";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { season, manager, category, nomineeId, nomineeName } = await req.json();

    if (!season || !manager || !category || !nomineeId) {
      return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Auth
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!raw || !sheetId) {
      return new Response(JSON.stringify({ ok: false, error: "missing_credentials" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const credentials = JSON.parse(raw);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Decide sheet name from season, e.g. Votes_S26
    const tab = `Votes_${season}`;

    // Read all existing rows to find an existing one for (manager, category)
    const getResp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tab}!A:E`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const rows = getResp.data.values || [];
    // Ensure headers exist (A1:E1)
    if (rows.length === 0) {
      // write headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${tab}!A1:E1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [["Timestamp", "Manager", "Category", "NomineeId", "NomineeName"]],
        },
      });
    }

    // locate an existing row matching (manager, category)
    let existingRowIndex = -1; // 0-based in 'rows' array
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const mgr = (r[1] || "").toString().trim().toLowerCase();
      const cat = (r[2] || "").toString().trim().toLowerCase();
      if (mgr === manager.toLowerCase() && cat === category.toLowerCase()) {
        existingRowIndex = i;
        break;
      }
    }

    const nowIso = new Date().toISOString();
    const record = [nowIso, manager, category, nomineeId, nomineeName || nomineeId];

    if (existingRowIndex >= 1) {
      // Update that row (convert to 1-based sheet row number)
      const rowNumber = existingRowIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${tab}!A${rowNumber}:E${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [record] },
      });
    } else {
      // Append as new
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${tab}!A:E`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [record] },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "server_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};