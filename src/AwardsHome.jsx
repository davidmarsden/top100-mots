import React from "react";
import { Award, ExternalLink, History, Vote } from "lucide-react";

const votingUrl = "/vote";
const resultsUrl = "https://vote.smtop100.blog/";
const historyUrl = "/history";

export default function AwardsHome() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 text-white">
      <section className="rounded-2xl border border-white/15 bg-gradient-to-br from-blue-950/80 to-slate-900/80 p-5 md:p-7 shadow-2xl">
        <p className="uppercase tracking-[0.25em] text-xs font-bold text-green-300">Top 100</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">Manager Awards</h1>
        <p className="mt-3 max-w-3xl text-gray-300">
          Vote using your verified Top 100 manager account, then explore published results, Hall of Fame records and manager award history.
        </p>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <a href={votingUrl} className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition">
          <Vote className="text-green-300" />
          <h2 className="mt-4 text-2xl font-bold">Vote</h2>
          <p className="mt-2 text-gray-300">Cast your Awards ballot with your verified Top 100 manager account.</p>
        </a>

        <a href={resultsUrl} className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition">
          <Award className="text-yellow-400" />
          <h2 className="mt-4 text-2xl font-bold">Published results</h2>
          <p className="mt-2 text-gray-300">See published Manager Awards results and other Top 100 manager votes.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-green-300">Open results <ExternalLink size={15} /></span>
        </a>

        <a href={historyUrl} className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition">
          <History className="text-blue-300" />
          <h2 className="mt-4 text-2xl font-bold">Hall of Fame & history</h2>
          <p className="mt-2 text-gray-300">Explore past winners, podiums, manager cabinets and Awards records.</p>
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
