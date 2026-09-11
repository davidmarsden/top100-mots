import React from "react";
import { History, Vote } from "lucide-react";

const votingUrl = "/vote";
const historyUrl = "/history";

export default function AwardsHome() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 text-white">
      <section className="rounded-2xl border border-white/15 bg-gradient-to-br from-blue-950/80 to-slate-900/80 p-5 md:p-7 shadow-2xl">
        <p className="uppercase tracking-[0.25em] text-xs font-bold text-green-300">Top 100</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">Manager Awards</h1>
        <p className="mt-3 max-w-3xl text-gray-300">
          Vote in the end-of-season Manager Awards, then explore the Hall of Fame, past winners, manager cabinets and records.
        </p>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <a href={votingUrl} className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition">
          <Vote className="text-green-300" />
          <h2 className="mt-4 text-2xl font-bold">Vote in the Awards</h2>
          <p className="mt-2 text-gray-300">Cast your end-of-season Manager Awards ballot with your verified Top 100 manager account.</p>
        </a>

        <a href={historyUrl} className="md:col-span-2 rounded-2xl border border-yellow-300/30 bg-gradient-to-br from-yellow-400/10 to-white/5 p-5 md:p-6 hover:bg-yellow-400/15 transition">
          <History className="text-yellow-300" />
          <p className="mt-4 uppercase tracking-[0.2em] text-xs font-bold text-yellow-300">Manager Awards archive</p>
          <h2 className="mt-2 text-3xl font-bold">Hall of Fame &amp; history</h2>
          <p className="mt-2 max-w-2xl text-gray-300">Explore every season of Manager of the Season voting: past winners, podiums, manager cabinets and Awards records.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-yellow-200">Explore Awards history →</span>
        </a>
      </div>

      <section className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 md:p-6">
        <h2 className="text-xl font-bold">How the Awards work</h2>
        <p className="mt-2 text-gray-300">
          Current Top 100 managers can vote when the Awards are open. Results are published after voting closes, and every season is added to the Hall of Fame.
        </p>
      </section>
    </div>
  );
}
