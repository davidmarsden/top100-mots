// Netlify Functions v2 (ESM). Returns { managers: [{club,name,active:true}, ...] } from sheet "Managers".
import { google } from "googleapis";

export default async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || "{}"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const tabName = process.env.MANAGERS_TAB || "Managers";

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A1:C`,
      majorDimension: "ROWS",
    });

    const rows = data.values || [];
    if (rows.length < 2) {
      return new Response(JSON.stringify({ managers: [] }), {
        headers: { "content-type": "application/json" },
      });
    }

    const header = rows[0].map((h) => `${h}`.trim().toLowerCase());
    const clubIdx = header.findIndex((h) => h === "club");
    const nameIdx = header.findIndex((h) => h === "manager" || h === "name");
    const activeIdx = header.findIndex((h) => h === "active");

    const managersRaw = rows.slice(1).map((r) => ({
      club: (r[clubIdx] || "").toString().trim(),
      name: (r[nameIdx] || "").toString().trim(),
      active: String(r[activeIdx] || "").toLowerCase() === "true",
    }));

    const seen = new Set();
    const managers = managersRaw
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

    return new Response(JSON.stringify({ managers }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("managers error", err);
    return new Response("Managers function failed", { status: 500 });
  }
};