// Netlify Functions v2 (ESM)
// Returns: { managers: [{ club, name, active: true }, ... ] } from "Managers" tab
import { google } from "googleapis";

function buildCredentialsFromEnv() {
  // Preferred: single JSON blob
  const json = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (json) {
    try {
      const creds = JSON.parse(json);
      // Some dashboards escape newlines in the private_key; normalize just in case
      if (creds.private_key) {
        creds.private_key = creds.private_key.replace(/\\n/g, "\n");
      }
      return creds;
    } catch (e) {
      // fall through to pair mode
    }
  }

  // Fallback: email + key in separate env vars
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GCP_SA_EMAIL;
  let key =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GCP_SA_KEY;

  if (email && key) {
    key = key.replace(/\\n/g, "\n");
    return {
      client_email: email,
      private_key: key,
    };
  }

  return null;
}

export default async () => {
  try {
    const creds = buildCredentialsFromEnv();
    if (!creds) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing_credentials" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing_GOOGLE_SHEET_ID" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const tabName = process.env.MANAGERS_TAB || "Managers";

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Read first 3 columns: Club | Manager | Active (header row included)
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A1:C`,
      majorDimension: "ROWS",
    });

    const rows = data.values || [];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, managers: [] }), {
        headers: { "content-type": "application/json" },
      });
    }

    // header-insensitive (club,name/manager,active)
    const header = rows[0].map((h) => `${h}`.trim().toLowerCase());
    const clubIdx = header.findIndex((h) => h === "club");
    const nameIdx = header.findIndex((h) => h === "manager" || h === "name");
    const activeIdx = header.findIndex((h) => h === "active");

    if (clubIdx === -1 || nameIdx === -1 || activeIdx === -1) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "bad_header",
          header,
          expected: ["Club", "Manager (or Name)", "Active"],
        }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const seen = new Set();
    const managers = rows.slice(1)
      .map((r) => ({
        club: (r[clubIdx] || "").toString().trim(),
        name: (r[nameIdx] || "").toString().trim(),
        active: String(r[activeIdx] || "").toLowerCase() === "true",
      }))
      .filter((m) => m.name && m.active)
      .map((m) => ({
        name: m.name.replace(/\s+/g, " ").trim(),
        club: (m.club || "").replace(/\s+/g, " ").trim(),
        active: true,
      }))
      .filter((m) => {
        const key = `${m.name.toLowerCase()}|${m.club.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return new Response(JSON.stringify({ ok: true, managers }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    // Log details on server; return safe error to client
    console.error("managers.js error", err);
    return new Response(
      JSON.stringify({ ok: false, error: "server_error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};