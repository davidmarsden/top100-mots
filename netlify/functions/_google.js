const { google } = require("googleapis");

function getAuth() {
  // Expect GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY envs
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "";

  // If key is stored with literal "\n", fix it:
  privateKey = privateKey.replace(/\\n/g, "\n");

  const jwt = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  return google.sheets({ version: "v4", auth: jwt });
}

module.exports = { getAuth };