// Append a vote to Google Sheets "Votes_S25"
// Expects environment:
// - GOOGLE_SHEET_ID  (Spreadsheet ID)
// - GOOGLE_SERVICE_ACCOUNT  (JSON for service account credentials)
//
// The sheet tab is hardcoded to "Votes_S25" below (change SHEET_VOTES if needed)

const { google } = require("googleapis");

const SHEET_VOTES = process.env.SHEET_VOTES || "Votes_S25";
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
  }
  const creds = JSON.parse(raw);

  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
  const jwt = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    scopes
  );
  return jwt;
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    if (!SPREADSHEET_ID) {
      throw new Error("Missing GOOGLE_SHEET_ID env var");
    }

    const payload = JSON.parse(event.body || "{}");
    const {
      timestamp,
      season,
      manager,
      club,
      category,
      nomineeId,
      nomineeName,
    } = payload;

    if (!manager || !category || !nomineeId) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const auth = getAuth();
    await auth.authorize();
    const sheets = google.sheets({ version: "v4", auth });

    // Prepare row: Timestamp, Season, Manager, Club, Category, NomineeID, NomineeName
    const row = [
      timestamp || new Date().toISOString(),
      season || "",
      manager || "",
      club || "",
      category || "",
      nomineeId || "",
      nomineeName || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_VOTES}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message || "Internal error" }),
    };
  }
};