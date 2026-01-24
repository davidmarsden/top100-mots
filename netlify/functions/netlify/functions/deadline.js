// netlify/functions/deadline.js
import { google } from "googleapis";

const CONFIG_SHEET = "Config"; // create this tab
const KEY = "VOTING_DEADLINE_UTC"; // stored in Config!A:B

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function readDeadline(sheets, spreadsheetId) {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${CONFIG_SHEET}!A:B`,
  });

  const rows = data.values || [];
  for (const r of rows.slice(1)) {
    const k = (r[0] || "").toString().trim();
    const v = (r[1] || "").toString().trim();
    if (k === KEY) return v || null;
  }
  return null;
}

async function writeDeadline(sheets, spreadsheetId, deadlineUtcIso) {
  // deterministic location: A2/B2
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${CONFIG_SHEET}!A2:B2`,
    valueInputOption: "RAW",
    requestBody: { values: [[KEY, deadlineUtcIso]] },
  });
}

export default async (req) => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) return json({ ok: false, error: "Missing GOOGLE_SHEET_ID" }, 500);
    if (!process.env.GOOGLE_SERVICE_ACCOUNT)
      return json({ ok: false, error: "Missing GOOGLE_SERVICE_ACCOUNT" }, 500);

    const sheets = await getSheets();

    // GET
    if (req.method === "GET") {
      const deadline = await readDeadline(sheets, spreadsheetId);
      return json({ ok: true, deadline });
    }

    // POST (admin only)
    if (req.method === "POST") {
      // simple protection using your existing secret
      const adminToken = process.env.ADMIN_RESET_TOKEN || "";
      const provided =
        req.headers.get("x-admin-token") ||
        req.headers.get("X-Admin-Token") ||
        "";

      if (!adminToken || provided !== adminToken) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }

      const body = await req.json().catch(() => null);
      const newDeadline = (body?.deadline || "").toString().trim();

      if (!newDeadline.endsWith("Z") || Number.isNaN(Date.parse(newDeadline))) {
        return json({ ok: false, error: "Invalid UTC ISO date" }, 400);
      }

      await writeDeadline(sheets, spreadsheetId, newDeadline);
      return json({ ok: true, deadline: newDeadline });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (e) {
    return json({ ok: false, error: "server_error" }, 500);
  }
};