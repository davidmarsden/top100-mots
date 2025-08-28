// /netlify/functions/managers.js
const { google } = require("googleapis");

exports.handler = async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const tabName = process.env.MANAGERS_TAB || "Managers"; // assumes headers: Club | Manager | Active

    // Read whole sheet (first row = header)
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A1:C`,
      majorDimension: "ROWS",
    });

    const rows = data.values || [];
    if (rows.length < 2) {
      return {
        statusCode: 200,
        body: JSON.stringify({ managers: [] }),
      };
    }

    // header mapping (robust against column order)
    const header = rows[0].map((h) => `${h}`.trim().toLowerCase());
    const clubIdx = header.findIndex((h) => h === "club");
    const nameIdx = header.findIndex((h) => h === "manager" || h === "name");
    const activeIdx = header.findIndex((h) => h === "active");

    const managers = rows.slice(1)
      .map((r) => ({
        club: (r[clubIdx] || "").toString().trim(),
        name: (r[nameIdx] || "").toString().trim(),
        active: String(r[activeIdx] || "").toString().trim().toLowerCase() === "true",
      }))
      .filter((m) => m.name) // must have a manager name
      .filter((m) => m.active) // active only
      .map((m) => ({
        // normalise tricky quotes/spaces/casing
        club: m.club.replace(/\s+/g, " ").trim(),
        name: m.name.replace(/\s+/g, " ").trim(),
        active: true,
      }));

    // De-duplicate case-insensitively on (name|club)
    const seen = new Set();
    const deduped = managers.filter((m) => {
      const key = `${m.name.toLowerCase()}|${(m.club || "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ managers: deduped }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    console.error("Managers function error:", err);
    return { statusCode: 500, body: "Managers function failed" };
  }
};