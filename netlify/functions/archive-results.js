// POST /api/archive-results
import { google } from "googleapis";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const creds = process.env.GOOGLE_SERVICE_ACCOUNT;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const season = process.env.ALLOWED_SEASON || "S25";

    if (!creds || !sheetId) {
      return new Response(JSON.stringify({ ok: false, error: "missing_credentials" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(creds),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // 1) Read raw votes from Votes_<season>
    const votesRange = `Votes_${season}!A:E`; // Timestamp | Manager | Category | NomineeId | NomineeName
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: votesRange,
    });
    const rows = data.values || [];
    const body = rows.slice(1); // skip header

    // 2) Build tallies
    const tallies = {};
    for (const r of body) {
      const category = r[2];
      const nomineeId = r[3];
      const nomineeName = r[4] || nomineeId;
      if (!category || !nomineeId) continue;
      tallies[category] ??= {};
      tallies[category][nomineeId] ??= { name: nomineeName, votes: 0 };
      tallies[category][nomineeId].votes += 1;
    }

    // 3) Ensure Archive sheet exists
    const archiveTitle = "Archive";
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const haveArchive = (meta.data.sheets || []).some(
      (s) => s.properties?.title === archiveTitle
    );
    if (!haveArchive) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: archiveTitle } } }],
        },
      });
    }

    // 4) Append snapshot rows
    const ts = new Date().toISOString();
    const outRows = [["Timestamp", "Season", "Category", "NomineeId", "NomineeName", "Votes"]];
    for (const [cat, byId] of Object.entries(tallies)) {
      for (const [nid, obj] of Object.entries(byId)) {
        outRows.push([ts, season, cat, nid, obj.name, obj.votes]);
      }
    }

    // If the sheet is empty, write header + rows; otherwise append without header
    const archiveData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${archiveTitle}!A1:F1`,
    });
    const hasHeader = !!(archiveData.data.values && archiveData.data.values.length);

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${archiveTitle}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: hasHeader ? outRows.slice(1) : outRows, // avoid duplicate header
      },
    });

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