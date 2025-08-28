// /netlify/functions/submit-vote.js
const { google } = require("googleapis");

async function ensureSheetExists(sheets, spreadsheetId, sheetTitle) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === sheetTitle);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        { addSheet: { properties: { title: sheetTitle } } },
        {
          updateCells: {
            range: { sheetId: null },
            rows: [
              {
                values: [
                  { userEnteredValue: { stringValue: "timestamp" } },
                  { userEnteredValue: { stringValue: "season" } },
                  { userEnteredValue: { stringValue: "managerName" } },
                  { userEnteredValue: { stringValue: "managerClub" } },
                  { userEnteredValue: { stringValue: "category" } },
                  { userEnteredValue: { stringValue: "nomineeId" } },
                  { userEnteredValue: { stringValue: "nomineeName" } },
                ],
              },
            ],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const {
      season,
      category,
      nomineeId,
      nomineeName,
      manager,      // canonical manager name
      managerClub,  // optional (for disambiguation)
    } = payload;

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const seasonCode = (season || process.env.ALLOWED_SEASON || "S25").replace(/\s+/g, "");
    const sheetTitle = `Votes_${seasonCode}`;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await ensureSheetExists(sheets, spreadsheetId, sheetTitle);

    const nowIso = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:G`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [nowIso, seasonCode, manager || "", managerClub || "", category || "", nomineeId || "", nomineeName || ""],
        ],
      },
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("submit-vote error:", err);
    return { statusCode: 500, body: "submit-vote failed" };
  }
};