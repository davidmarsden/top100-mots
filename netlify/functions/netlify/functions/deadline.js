// netlify/functions/deadline.js
import { google } from "googleapis";

const SHEET_NAME = "Config";
const KEY = "VOTING_DEADLINE_UTC"; // stored in Config!A:B

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function readDeadlineFromSheet(sheets, spreadsheetId) {
  // read all key/value rows
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:B`,
  });

  const rows = data.values || [];
  for (const row of rows.slice(1)) {
    const k = (row[0] || "").toString().trim();
    const v = (row[1] || "").toString().trim();
    if (k === KEY) return v || null;
  }
  return null;
}

async function writeDeadlineToSheet(sheets, spreadsheetId, newDeadline) {
  // We’ll write KEY + value into A2/B2 (simple, deterministic)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:B2`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[KEY, newDeadline]],
    },
  });
}

export default async (req) => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) return json(500, { ok: false, error: "Missing GOOGLE_SHEET_ID" });
    if (!process.env.GOOGLE_SERVICE_ACCOUNT)
      return json(500, { ok: false, error: "Missing GOOGLE_SERVICE_ACCOUNT" });

    const sheets = await getSheetsClient();

    // GET = read
    if (req.method === "GET") {
      const deadline = await readDeadlineFromSheet(sheets, spreadsheetId);
      return json(200, { ok: true, deadline });
    }

    // POST = admin update (requires token)
    if (req.method === "POST") {
      const adminToken = process.env.ADMIN_RESET_TOKEN || ""; // reuse your existing secret
      const provided =
        req.headers.get("x-admin-token") ||
        req.headers.get("X-Admin-Token") ||
        "";

      if (!adminToken || provided !== adminToken) {
        return json(401, { ok: false, error: "Unauthorized" });
      }

      const body = await req.json().catch(() => null);
      const newDeadline = (body?.deadline || "").toString().trim();

      // must be UTC ISO ending in Z
      if (!newDeadline || !newDeadline.endsWith("Z") || Number.isNaN(Date.parse(newDeadline))) {
        return json(400, { ok: false, error: "Invalid UTC ISO date" });
      }

      await writeDeadlineToSheet(sheets, spreadsheetId, newDeadline);
      return json(200, { ok: true, deadline: newDeadline });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (e) {
    return json(500, { ok: false, error: "server_error" });
  }
};