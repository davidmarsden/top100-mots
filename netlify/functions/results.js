// GET /api/results?season=S27 -> tallies by category + nominee
import { google } from "googleapis";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

export default async (req) => {
  try {
    const url = new URL(req.url);
    const season =
      url.searchParams.get("season") ||
      process.env.ALLOWED_SEASON ||
      "S27";

    const safeSeason = season.replace(/[^A-Za-z0-9_-]/g, "");
    const tab = `Votes_${safeSeason}`;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tab}!A:E`,
    });

    const rows = data.values || [];
    const tallies = {};

    for (const r of rows.slice(1)) {
      const category = r[2];
      const nomineeId = r[3];
      const nomineeName = r[4] || r[3];

      if (!category || !nomineeId) continue;

      tallies[category] ??= {};
      tallies[category][nomineeId] ??= {
        name: nomineeName,
        votes: 0,
      };
      tallies[category][nomineeId].votes += 1;
    }

    return json({
      ok: true,
      season: safeSeason,
      tab,
      tallies,
    });
  } catch (e) {
    return json(
      {
        ok: false,
        reason: "server_error",
      },
      500
    );
  }
};