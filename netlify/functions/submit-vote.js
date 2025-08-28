// netlify/functions/submit-vote.js
//
// Appends a vote to Google Sheets.
//
// POST body JSON:
// {
//   "manager": "David Marsden",          // required
//   "club": "Hamburger SV",              // optional but recommended if duplicates (e.g., Jay Jones)
//   "category": "overall",               // required
//   "nomineeId": "andre_libras",         // required
//   "nomineeName": "Luís André Libras-Boas", // optional (will still record if missing)
//   "season": "S25"                      // required
// }
//
// Response: { ok: true } or { ok: false, error: "..." }
//
// ENV VARS required:
//   GOOGLE_SHEET_ID         -> Spreadsheet ID
//   GOOGLE_SERVICE_ACCOUNT  -> JSON string of service account credentials
// Optional:
//   SHEET_VOTES             -> Votes tab name (default "Votes_S25")
//   SHEET_MANAGERS          -> Managers tab name (default "Managers")
//   REQUIRE_ACTIVE_MANAGER  -> "true" to require manager in Managers sheet with Active = true
//
// Make sure your spreadsheet is shared with the service account email.

const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_VOTES = process.env.SHEET_VOTES || "Votes_S25";
const SHEET_MANAGERS = process.env.SHEET_MANAGERS || "Managers";
const REQUIRE_ACTIVE_MANAGER = String(process.env.REQUIRE_ACTIVE_MANAGER || "true").toLowerCase() === "true";

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
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

function toBool(v) {
  if (v === true || v === false) return !!v;
  const s = String(v || "").trim().toLowerCase();
  return ["true", "t", "yes", "y", "1"].includes(s);
}

function norm(s) {
  return String(s || "").trim();
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
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  try {
    if (!SPREADSHEET_ID) {
      throw new Error("Missing GOOGLE_SHEET_ID env var");
    }

    const body = JSON.parse(event.body || "{}");
    const manager = norm(body.manager);
    const club = norm(body.club);
    const category = norm(body.category);
    const nomineeId = norm(body.nomineeId);
    const nomineeName = norm(body.nomineeName);
    const season = norm(body.season);

    // Basic validation
    if (!manager) throw new Error("Missing 'manager'");
    if (!category) throw new Error("Missing 'category'");
    if (!nomineeId) throw new Error("Missing 'nomineeId'");
    if (!season) throw new Error("Missing 'season'");

    const auth = getAuth();
    await auth.authorize();
    const sheets = google.sheets({ version: "v4", auth });

    // Optional validation against Managers sheet
    if (REQUIRE_ACTIVE_MANAGER) {
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MANAGERS}!A1:Z10000`,
      });

      const rows = data.values || [];
      if (rows.length > 0) {
        const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
        const idxClub = header.findIndex((h) => ["club", "team"].includes(h));
        const idxName = header.findIndex((h) => ["manager", "name"].includes(h));
        const idxActive = header.findIndex((h) => ["active", "isactive"].includes(h));

        const clubCol = idxClub >= 0 ? idxClub : 0;
        const nameCol = idxName >= 0 ? idxName : 1;
        const activeCol = idxActive >= 0 ? idxActive : 2;

        // Build list of active managers
        const managers = rows.slice(1).map((r) => ({
          club: norm(r[clubCol]),
          name: norm(r[nameCol]),
          active: toBool(r[activeCol]),
        }));

        const nameMatches = managers.filter(
          (m) => m.name.toLowerCase() === manager.toLowerCase()
        );

        if (nameMatches.length === 0) {
          throw new Error(
            `Manager '${manager}' not found in Managers sheet`
          );
        }

        // If multiple same names, require a matching club
        let chosen = nameMatches[0];
        if (nameMatches.length > 1) {
          if (!club) {
            throw new Error(
              `Multiple managers named '${manager}'. Please include 'club' in the request body.`
            );
          }
          chosen =
            nameMatches.find(
              (m) => m.club.toLowerCase() === club.toLowerCase()
            ) || null;

          if (!chosen) {
            throw new Error(
              `No active manager match for '${manager}' at club '${club}'.`
            );
          }
        }

        if (!chosen.active) {
          throw new Error(
            `Manager '${manager}'${club ? ` (${club})` : ""} is not active.`
          );
        }
      }
    }

    // Prepare row to append
    const timestamp = new Date().toISOString();
    const ua = event.headers["user-agent"] || "";
    const ip =
      event.headers["x-forwarded-for"] ||
      event.headers["client-ip"] ||
      event.headers["x-nf-client-connection-ip"] ||
      "";

    // Suggested header layout on Votes_S25:
    // Timestamp | Season | Manager | Club | Category | NomineeId | NomineeName | UserAgent | IP
    const row = [
      timestamp,
      season,
      manager,
      club,
      category,
      nomineeId,
      nomineeName,
      ua,
      ip,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_VOTES}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("submit-vote error:", err);
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: false, error: err.message || "Bad Request" }),
    };
  }
};