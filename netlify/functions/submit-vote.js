const { getAuth } = require("./_google");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const {
      manager,      // display name (canonical from UI)
      category,
      nomineeId,
      nomineeName,
      season,       // e.g., "S25"
    } = payload;

    if (!manager || !category || !nomineeId || !season) {
      return { statusCode: 400, body: "Missing fields" };
    }

    const sheets = getAuth();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Try to lookup the manager's club from Managers sheet so we can log it
    let club = "";
    try {
      const m = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Managers!A2:C",
      });
      const rows = m.data.values || [];
      const match = rows.find((r) => (r[1] || "").toString().trim().toLowerCase() === manager.toLowerCase());
      if (match) club = (match[0] || "").toString().trim();
    } catch (_) {}

    // Append to Votes_S25 (change sheet/tab name here if needed)
    const voteRow = [
      new Date().toISOString(), // timestamp
      season,
      manager,
      club,
      category,
      nomineeId,
      nomineeName || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Votes_S25!A:G",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [voteRow] },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    console.error("submit-vote error", err);
    return { statusCode: 500, body: "Failed to submit vote" };
  }
};