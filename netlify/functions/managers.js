// netlify/functions/managers.js
// Returns managers from Google Sheets as { managers: [{ club, name, active }, ...] }
//
// ENV VARS required:
//   GOOGLE_SHEET_ID         -> Spreadsheet ID
//   GOOGLE_SERVICE_ACCOUNT  -> JSON string of service account credentials
// Optional:
//   SHEET_MANAGERS          -> Tab name, defaults to "Managers"
//
// Share the sheet with the service account email from GOOGLE_SERVICE_ACCOUNT.

const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_MANAGERS = process.env.SHEET_MANAGERS || "Managers";

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
  const creds = JSON.parse(raw);

  const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const jwt = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    scopes
  );
  return jwt;
}

// Convert various truthy strings to boolean
function toBool(v) {
  if (v === true || v === false) return !!v;
  const s = String(v || "").trim().toLowerCase();
  return ["true", "t", "yes", "y", "1"].includes(s);
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
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

    const auth = getAuth();
    await auth.authorize();
    const sheets = google.sheets({ version: "v4", auth });

    // Read entire Managers sheet
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_MANAGERS}!A1:Z10000`, // generous range
    });

    const rows = data.values || [];
    if (rows.length === 0) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ managers: [] }),
      };
    }

    // Header-agnostic: find columns by name (case-insensitive)
    const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
    const idxClub = header.findIndex((h) => ["club", "team"].includes(h));
    const idxName = header.findIndex((h) =>
      ["manager", "name"].includes(h)
    );
    const idxActive = header.findIndex((h) => ["active", "isactive"].includes(h));

    // Fallback if headers are missing: assume order Club, Manager, Active
    const clubCol = idxClub >= 0 ? idxClub : 0;
    const nameCol = idxName >= 0 ? idxName : 1;
    const activeCol = idxActive >= 0 ? idxActive : 2;

    const managers = rows.slice(1) // skip header
      .map((r) => ({
        club: String((r[clubCol] ?? "")).trim(),
        name: String((r[nameCol] ?? "")).trim(),
        active: toBool(r[activeCol]),
      }))
      // Drop empty-name rows
      .filter((m) => m.name.length > 0)
      // Deduplicate by (name|club) case-insensitively
      .reduce((acc, m) => {
        const key = `${m.name.toLowerCase()}|${m.club.toLowerCase()}`;
        if (!acc._seen.has(key)) {
          acc._seen.add(key);
          acc.items.push(m);
        }
        return acc;
      }, { _seen: new Set(), items: [] }).items;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ managers }),
    };
  } catch (err) {
    console.error("Managers function error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message || "Internal error" }),
    };
  }
};