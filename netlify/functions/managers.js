const { getAuth } = require("./_google");

exports.handler = async () => {
  try {
    const sheets = getAuth();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Managers sheet with columns in this exact order: club, name, active
    const range = "Managers!A2:C";
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = data.values || [];
    const managers = rows
      .map((r) => {
        const club = (r[0] || "").toString().trim();
        const name = (r[1] || "").toString().trim();
        const activeRaw = (r[2] || "").toString().trim().toLowerCase();
        const active = activeRaw === "true" || activeRaw === "yes" || activeRaw === "1";
        return { club, name, active };
      })
      .filter((r) => r.name) // require name
      .filter((r) => r.active); // only active

    return {
      statusCode: 200,
      body: JSON.stringify({ managers }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    console.error("managers error", err);
    return { statusCode: 500, body: "Failed to load managers" };
  }
};