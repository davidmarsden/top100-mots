import React, { useEffect, useMemo, useState } from "react";
import { Award, Crown, Medal, Trophy, Users } from "lucide-react";

const CATEGORY_ORDER = ["overall", "division1", "division2", "division3", "division4", "division5"];

export default function AwardsHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("hall");
  const [selectedManager, setSelectedManager] = useState("");

  useEffect(() => {
    fetch("/api/hall-of-fame")
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json?.ok) throw new Error("Could not load Awards history.");
        setData(json);
      })
      .catch((err) => setError(err.message || "Could not load Awards history."))
      .finally(() => setLoading(false));
  }, []);

  const managerNames = useMemo(
    () => Object.keys(data?.managerAwards || {}).sort((a, b) => a.localeCompare(b)),
    [data]
  );

  const wins = useMemo(
    () => Object.entries(data?.records?.mostWins || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    [data]
  );

  const podiums = useMemo(
    () => Object.entries(data?.records?.mostPodiums || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    [data]
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 text-white">
      <section className="rounded-2xl border border-white/15 bg-gradient-to-br from-blue-950/80 to-slate-900/80 p-5 md:p-7 shadow-2xl">
        <p className="uppercase tracking-[0.25em] text-xs font-bold text-green-300">Read-only archive</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">Manager Awards History</h1>
        <p className="mt-2 text-gray-300">Past winners, podiums, manager cabinets and records from every completed Manager Awards season.</p>
        <a className="mt-4 inline-block rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-400" href="/vote">Vote in the current Awards</a>
      </section>

      <nav className="my-5 flex flex-wrap gap-2" aria-label="Awards history views">
        {[['hall', 'Hall of Fame'], ['cabinets', 'Manager cabinets'], ['records', 'Records']].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === id ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>{label}</button>
        ))}
      </nav>

      {loading && <div className="rounded-xl border border-white/15 bg-white/5 p-5">Loading Awards history…</div>}
      {error && <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-5">{error}</div>}

      {!loading && !error && data && view === 'hall' && (
        <div className="space-y-6">
          {CATEGORY_ORDER.map((category) => {
            const seasons = data.hallOfFame?.[category] || [];
            if (!seasons.length) return null;
            return (
              <section key={category} className="rounded-2xl border border-white/15 bg-white/5 p-5">
                <div className="flex items-center gap-3"><Trophy className="text-yellow-400" /><h2 className="text-2xl font-bold">{seasons[0]?.categoryLabel || category}</h2></div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {seasons.map((season) => (
                    <article key={`${category}-${season.season}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-bold text-green-300">{season.season}</div>
                      <div className="mt-3 space-y-2">
                        {(season.podium || []).map((entry) => (
                          <div key={`${entry.name}-${entry.rank}`} className="flex items-center justify-between gap-3">
                            <span>{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'} {entry.name}</span>
                            <span className="text-sm text-gray-400">{entry.votes} · {entry.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!loading && !error && data && view === 'cabinets' && (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <div className="flex items-center gap-3"><Users className="text-green-300" /><h2 className="text-2xl font-bold">Manager cabinets</h2></div>
          <select className="mt-4 w-full max-w-md rounded-lg border border-white/20 bg-slate-900 px-3 py-2" value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)}>
            <option value="">Choose a manager…</option>
            {managerNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          {selectedManager && (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(data.managerAwards?.[selectedManager] || []).map((award, index) => (
                <article key={`${award.season}-${award.category}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">{award.rank === 1 ? <Crown className="text-yellow-400" size={18} /> : <Medal className="text-gray-300" size={18} />}<strong>{award.season}</strong></div>
                  <p className="mt-2">{award.categoryLabel}</p>
                  <p className="mt-1 text-sm text-gray-400">{award.rank === 1 ? 'Winner' : award.rank === 2 ? 'Runner-up' : 'Third'} · {award.votes} votes · {award.percentage}%</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && !error && data && view === 'records' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/15 bg-white/5 p-5"><div className="flex items-center gap-3"><Award className="text-yellow-400" /><h2 className="text-xl font-bold">Most wins</h2></div><ol className="mt-4 space-y-2">{wins.map(([name, count]) => <li key={name} className="flex justify-between gap-4"><span>{name}</span><strong>{count}</strong></li>)}</ol></section>
          <section className="rounded-2xl border border-white/15 bg-white/5 p-5"><div className="flex items-center gap-3"><Medal className="text-gray-300" /><h2 className="text-xl font-bold">Most podiums</h2></div><ol className="mt-4 space-y-2">{podiums.map(([name, count]) => <li key={name} className="flex justify-between gap-4"><span>{name}</span><strong>{count}</strong></li>)}</ol></section>
          {data.records?.highestWinningPercentage && <section className="rounded-2xl border border-white/15 bg-white/5 p-5"><h2 className="text-xl font-bold">Highest winning percentage</h2><p className="mt-3 text-lg">{data.records.highestWinningPercentage.name} — {data.records.highestWinningPercentage.percentage}%</p><p className="text-sm text-gray-400">{data.records.highestWinningPercentage.season} · {data.records.highestWinningPercentage.categoryLabel}</p></section>}
          {data.records?.closestWinningMargin && <section className="rounded-2xl border border-white/15 bg-white/5 p-5"><h2 className="text-xl font-bold">Closest winning margin</h2><p className="mt-3 text-lg">{data.records.closestWinningMargin.winner?.name} by {data.records.closestWinningMargin.margin} vote{data.records.closestWinningMargin.margin === 1 ? '' : 's'}</p><p className="text-sm text-gray-400">{data.records.closestWinningMargin.season} · {data.records.closestWinningMargin.categoryLabel}</p></section>}
        </div>
      )}
    </div>
  );
}
