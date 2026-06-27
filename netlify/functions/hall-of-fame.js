import { google } from "googleapis";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

const SEASONS = [
  { season: "S27", tab: "Votes_S27", archived: false },
  { season: "S26", tab: "Archive_S26", archived: true },
  { season: "S25", tab: "Archive_S25", archived: true },
];

const CATEGORY_LABELS = {
  overall: "Overall Manager of the Season",
  division1: "Division 1 Manager of the Season",
  division2: "Division 2 Manager of the Season",
  division3: "Division 3 Manager of the Season",
  division4: "Division 4 Manager of the Season",
  division5: "Division 5 Manager of the Season",
};

export default async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const hallOfFame = {};
    const managerAwards = {};
    const records = {
      mostWins: {},
      mostPodiums: {},
      highestWinningPercentage: null,
      closestWinningMargin: null,
    };

    for (const seasonInfo of SEASONS) {
      const { season, tab, archived } = seasonInfo;

      let rows = [];

      try {
        const { data } = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${tab}!A:E`,
        });

        rows = data.values || [];
      } catch {
        continue;
      }

      const tallies = {};

      for (const r of rows.slice(1)) {
        const category = r[2];
        const nomineeId = r[3];
        const nomineeName = r[4] || r[3];

        if (!category || !nomineeId) continue;

        tallies[category] ??= {};
        tallies[category][nomineeId] ??= {
          id: nomineeId,
          name: nomineeName,
          votes: 0,
        };

        tallies[category][nomineeId].votes += 1;
      }

      for (const [category, nomineeMap] of Object.entries(tallies)) {
        const sorted = Object.values(nomineeMap).sort((a, b) => b.votes - a.votes);
        const totalVotes = sorted.reduce((sum, n) => sum + n.votes, 0);

        const podium = sorted.slice(0, 3).map((n, index) => ({
          season,
          tab,
          archived,
          category,
          categoryLabel: CATEGORY_LABELS[category] || category,
          rank: index + 1,
          id: n.id,
          name: n.name,
          votes: n.votes,
          percentage:
            totalVotes > 0
              ? Number(((n.votes / totalVotes) * 100).toFixed(1))
              : 0,
        }));

        hallOfFame[category] ??= [];
        hallOfFame[category].push({
          season,
          tab,
          archived,
          category,
          categoryLabel: CATEGORY_LABELS[category] || category,
          totalVotes,
          podium,
        });

        podium.forEach((award) => {
          managerAwards[award.name] ??= [];
          managerAwards[award.name].push(award);

          records.mostPodiums[award.name] =
            (records.mostPodiums[award.name] || 0) + 1;

          if (award.rank === 1) {
            records.mostWins[award.name] =
              (records.mostWins[award.name] || 0) + 1;
          }
        });

        const winner = podium[0];
        const runnerUp = podium[1];

        if (winner) {
          if (
            !records.highestWinningPercentage ||
            winner.percentage > records.highestWinningPercentage.percentage
          ) {
            records.highestWinningPercentage = winner;
          }
        }

        if (winner && runnerUp) {
          const margin = winner.votes - runnerUp.votes;

          if (
            !records.closestWinningMargin ||
            margin < records.closestWinningMargin.margin
          ) {
            records.closestWinningMargin = {
              season,
              category,
              categoryLabel: CATEGORY_LABELS[category] || category,
              winner,
              runnerUp,
              margin,
            };
          }
        }
      }
    }

    return json({
      ok: true,
      seasons: SEASONS,
      hallOfFame,
      managerAwards,
      records,
    });
  } catch (e) {
    return json({ ok: false, reason: "server_error" }, 500);
  }
};