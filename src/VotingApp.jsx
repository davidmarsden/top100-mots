import React, { useEffect, useMemo, useState } from 'react'; import { Trophy, Star, Award, Users, CheckCircle, Lock, User, Calendar, Shield, Eye, EyeOff, Download, Trash2 } from 'lucide-react';

// ---- Helper: date formatting ---- const fmtDate = (iso) => new Date(iso).toLocaleString();

export default function VotingApp() { const [currentManager, setCurrentManager] = useState(''); const [isLoggedIn, setIsLoggedIn] = useState(false); const [isAdmin, setIsAdmin] = useState(false); const [votes, setVotes] = useState({}); const [votingComplete, setVotingComplete] = useState({}); const [activeCategory, setActiveCategory] = useState('overall'); const [results, setResults] = useState(false); const [verificationError, setVerificationError] = useState(''); const [selectedSeason] = useState('S25'); const [votingDeadline, setVotingDeadline] = useState('2025-09-15T23:59:59');

// Simulated vote storage, manager database, and historical data const [allVotes, setAllVotes] = useState({}); // { ManagerName: { overall: 'id', division1: 'id', ... } } const [voterNames, setVoterNames] = useState({}); // { ${cat}_${id}: [ { name, timestamp } ] }

// Admin accounts const adminUsers = useMemo(() => ['David Marsden', 'Mister TRX', 'Heath Brown'], []);

// Default (fallback) manager database — can be replaced/augmented by a Google Sheet via /api/managers const defaultManagers = useMemo(() => ([ 'Scott Mckenzie', 'James Mckenzie', 'Heath Brown', 'Andrew Kelly', 'André Libras-Boas', 'André Guerra', 'Mister TRX', 'ruts66', 'Mike Scallotti', 'Sir Stephen Beddows (God)', 'Doug Earle', 'Gursimran Brar', 'Rob Ryan', 'Gav Harmer', 'Davy Vandendriessche', 'paddy d', 'David Inglis', 'Jamie ᚺ', 'Frank Hirst', 'Golden Bear', 'Josh McMillan', 'Neil Frankland', 'RJ Alston', 'Dan Wallace', 'Gregg Robinson', 'Walter Gogh', 'Dario Saviano', 'Bojan H', 'Noisy Steve', 'feargal Hickey', 'Jay Jones', 'Ignazio Barraco', 'Alessandro Ioli', 'Adam', 'kevin mcgregor', 'Jamie Alldridge', 'João Alves', 'David Marsden', 'rOsS fAlCOn3r', 'simon thomas', 'Regan Thompson', 'Chris Baggio', 'Wayne Bullough', 'Norman Little', 'Nick Wheels', 'Salvatore Zerbo', '⍟Greg Bilboaţu', 'Glen Mullan', 'Hugo Costa', 'Ash L', 'Paul Masters', 'João Rocha', 'Marco G', 'The Special Gyan', 'Gianluca Ghio', 'Stuart Monteith', 'The Godfather', 'Carl Martin', 'Steven Allington', 'Chris East', 'Paul Rimmer', 'Chris Union', 'Master T', 'Ricardo Ferreira', 'Attilio Bonnici', 'Pedro Vilar', 'Dave Oz Osborne', 'rob cast', 'Chris Meida', 'Landucci', 'Nuno Marques', 'Marc Ques', 'Marian Moise', 'Bruno Neto^^', 'Fredrik Johansson' ]), []);

const [validManagers, setValidManagers] = useState(defaultManagers);

// Try to hydrate manager list from Google Sheet via Netlify Function (optional) useEffect(() => { let cancelled = false; (async () => { try { const res = await fetch('/api/managers'); // should return { managers: [ 'Name 1', 'Name 2', ... ] } if (!res.ok) return; const data = await res.json(); if (!cancelled && Array.isArray(data?.managers) && data.managers.length) { // Merge with defaults to be safe, keep unique names const merged = Array.from(new Set([...data.managers, ...defaultManagers])); setValidManagers(merged); } } catch (_) { // silently ignore; stay on default list } })(); return () => { cancelled = true; }; }, [defaultManagers]);

// Close voting client-side when deadline passes (visual/UX; server should enforce too) const votingClosed = useMemo(() => new Date() > new Date(votingDeadline), [votingDeadline]);

// ---- Categories (added D2–D5 from your nominations) ---- const categories = useMemo(() => ({ overall: { title: 'Overall Manager of the Season', icon: Trophy, nominees: [ { id: 'andre_libras', name: 'André Libras-Boas', club: 'Hellas Verona', achievement: 'Treble Winner (D1 + SMFA Champions Cup + Charity Shield)', description: 'Only manager to win multiple major trophies in S25' }, { id: 'david_marsden', name: 'David Marsden', club: 'Hamburger SV', achievement: 'Greatest Transformation (+16 VA - Highest in all divisions)', description: 'D2 Champion: 17th prediction → Champions' }, { id: 'scott_mckenzie', name: 'Scott Mckenzie', club: 'São Paulo FC', achievement: "GOAT's Masterclass (+11 VA in Division 1)", description: '#1 all-time manager: 15th → 4th place' }, { id: 'simon_thomas', name: 'simon thomas', club: 'AC Milan', achievement: 'Cup Champion + Great Escape (+8 VA)', description: 'Top 100 Cup Winner: 20th prediction → 12th finish' }, { id: 'adam', name: 'Adam', club: 'Barcelona', achievement: 'Multi-Generational Master', description: 'World Club Cup + Youth Cup Winner' } ] }, division1: { title: 'Division 1 Manager of the Season', icon: Star, nominees: [ { id: 'andre_libras_d1', name: 'André Libras-Boas', club: 'Hellas Verona', achievement: 'D1 Champion + SMFA Champions Cup + Charity Shield', description: 'Successfully defended title, only multiple trophy winner' }, { id: 'scott_mckenzie_d1', name: 'Scott Mckenzie', club: 'São Paulo FC', achievement: 'Top Statistical Performer (+11 VA, +3 PVA)', description: 'Predicted 15th → finished 4th, incredible transformation' }, { id: 'adam_d1', name: 'Adam', club: 'Barcelona', achievement: 'World Club Cup + Youth Cup Winner', description: '2nd place finish, multi-competition excellence' }, { id: 'bojan_d1', name: 'Bojan H', club: 'Bayern München', achievement: 'SMFA Shield Winner + 3rd place', description: 'Strong overperformance (predicted 6th, +8 VA)' } ] }, division2: { title: 'Division 2 Manager of the Season', icon: Award, nominees: [ { id: 'david_marsden_d2', name: 'David Marsden', club: 'Hamburger SV', achievement: 'Division 2 Champion', description: 'Extraordinary turnaround: predicted 17th → title (+16 VA)' }, { id: 'greg_bilboatu_d2', name: '⍟Greg Bilboaţu', club: 'Dinamo Zagreb', achievement: '3rd place; top statistical performance', description: 'Predicted 16th → 3rd (+13 VA); narrowly missed auto-promo' }, { id: 'dave_oz_d2', name: 'Dave Oz Osborne', club: 'Málaga CF', achievement: 'Play-off Winner (promotion secured)', description: 'Clutch playoff performance to seal promotion' } ] }, division3: { title: 'Division 3 Manager of the Season', icon: Award, nominees: [ { id: 'chris_meida_d3', name: 'Chris Meida', club: 'CSKA Moskva', achievement: 'D3 Champion + Youth Shield Winner', description: 'Pred 9th → title (+8 VA, +9 PVA); youth success too' }, { id: 'mike_scallotti_d3', name: 'Mike Scallotti', club: 'Everton', achievement: 'Play-off Winner (promotion secured)', description: 'Comeback from bottom into promotion—underdog story' }, { id: 'jamie_rune_d3', name: 'Jamie ᚺ', club: 'FC Augsburg', achievement: '3rd place; exceptional stats', description: 'Pred 13th → 3rd (+10 VA); outstanding tactical management' } ] }, division4: { title: 'Division 4 Manager of the Season', icon: Award, nominees: [ { id: 'stuart_monteith_d4', name: 'Stuart Monteith', club: 'Montpellier HSC', achievement: '2nd place + Automatic Promotion', description: 'Pred 14th → 2nd; huge overperformance to auto-promo' }, { id: 'chris_union_d4', name: 'Chris Union', club: 'Boca Juniors', achievement: 'Division 4 Champion', description: 'Won title from 3rd prediction; 96.0 attack rating' }, { id: 'fredrik_johansson_d4', name: 'Fredrik Johansson', club: 'VfL Wolfsburg', achievement: 'Play-off Winner (promotion secured)', description: 'Delivered in the clutch to go up via playoffs' }, { id: 'ruts66_d4', name: 'ruts66', club: 'Feyenoord', achievement: 'Top statistical performer', description: 'Pred 17th → top VA (+13) despite playoff exit' } ] }, division5: { title: 'Division 5 Manager of the Season', icon: Award, nominees: [ { id: 'marc_ques_d5', name: 'Marc Ques', club: 'FK Partizan', achievement: 'Division 5 Champion', description: 'Pred 9th → clear title (+8 VA) and best stats' }, { id: 'bruno_neto_d5', name: 'Bruno Neto^^', club: 'Olympique Lyonnais', achievement: 'Runner-up; exceptional stats', description: 'Pred 15th → 2nd (+13 VA); narrow miss for title' }, { id: 'marian_moise_d5', name: 'Marian Moise', club: 'Newcastle United', achievement: 'Play-off Winner (promotion secured)', description: 'Pred 11th → promoted via playoffs (+6 VA)' }, { id: 'wayne_bullough_d5', name: 'Wayne Bullough', club: 'Athletic Club', achievement: 'Highest individual overperformance', description: 'Pred 20th → massive +14 VA; long-term build paying off' } ] }, cups: { title: 'Cup Competition Excellence', icon: Trophy, nominees: [ { id: 'andre_libras_cups', name: 'André Libras-Boas', club: 'Hellas Verona', achievement: 'SMFA Champions Cup Winner', description: 'Won elite European competition alongside league success' }, { id: 'adam_cups', name: 'Adam', club: 'Barcelona', achievement: 'World Club Cup + Youth Cup Winner', description: 'Double cup success across senior and youth competitions' }, { id: 'simon_thomas_cup', name: 'simon thomas', club: 'AC Milan', achievement: 'Top 100 Cup Winner', description: 'Won the premier knockout competition' }, { id: 'andre_guerra_cup', name: 'André Guerra', club: 'FC Porto', achievement: 'Top 100 Shield Winner', description: 'Won the premier shield competition' }, { id: 'james_mckenzie_cup', name: 'James Mckenzie', club: 'Chelsea', achievement: 'SMFA Super Cup Winner', description: 'Prestigious European super cup triumph' } ] } }), []);

// ---- Login ---- const login = (rawName) => { const trimmedName = (rawName || '').trim(); setVerificationError('');

if (!trimmedName) {
  setVerificationError('Please enter a manager name');
  return;
}

// Deadline check (client-side; enforce on server too if using functions)
if (votingClosed && !adminUsers.includes(trimmedName)) {
  const d = new Date(votingDeadline);
  setVerificationError(`Voting closed on ${d.toLocaleDateString()}. Contact admin if you need assistance.`);
  return;
}

// Verify against manager database (case-insensitive)
const isValidManager = validManagers.some((validName) => validName.toLowerCase() === trimmedName.toLowerCase());
if (!isValidManager) {
  setVerificationError(`"${trimmedName}" is not found in the Top 100 manager database. Please check spelling or contact admin.`);
  return;
}

// One ballot per manager (client-side)
if (allVotes[trimmedName] && !adminUsers.includes(trimmedName)) {
  setVerificationError(`"${trimmedName}" has already cast votes. Each manager can only vote once.`);
  return;
}

setCurrentManager(trimmedName);
setIsLoggedIn(true);
setIsAdmin(adminUsers.includes(trimmedName));

};

// ---- Voting ----
const submitVote = (category, nomineeId) => {
  if (!isLoggedIn || votingClosed) return;

  setVotes((prev) => ({ ...prev, [category]: nomineeId }));
  setVotingComplete((prev) => ({ ...prev, [category]: true }));

  // Save into in-memory results
  setAllVotes((prev) => ({
    ...prev,
    [currentManager]: { ...(prev[currentManager] || {}), [category]: nomineeId },
  }));

  setVoterNames((prev) => ({
    ...prev,
    [`${category}_${nomineeId}`]: [
      ...(prev[`${category}_${nomineeId}`] || []),
      { name: currentManager, timestamp: new Date().toISOString() },
    ],
  }));

  // Persist to backend (optional)
  try {
    const nomineeObj = categories[category].nominees.find((n) => n.id === nomineeId);
    const nomineeName = nomineeObj ? nomineeObj.name : nomineeId;

    fetch("/api/submit-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manager: currentManager,
        category,
        nomineeId,
        nomineeName,
        season: selectedSeason,
      }),
    }).catch(() => {});
  } catch (_) {
    // no-op
  }
}; // <-- closes submitVote (exactly one closing brace + semicolon)

const removeVote = (category, nomineeId, voterName) => { if (!isAdmin) return;

setVoterNames((prev) => ({
  ...prev,
  [`${category}_${nomineeId}`]: (prev[`${category}_${nomineeId}`] || []).filter((v) => v.name !== voterName)
}));

setAllVotes((prev) => {
  const next = { ...prev };
  if (next[voterName]?.[category]) {
    delete next[voterName][category];
    if (Object.keys(next[voterName]).length === 0) delete next[voterName];
  }
  return next;
});

// Also call backend to revoke if wired
// fetch('/api/remove-vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ manager: voterName, category, nomineeId, season: selectedSeason }) });

};

const exportResults = () => { if (!isAdmin) return;

const out = {};
Object.keys(categories).forEach((category) => {
  out[category] = {};
  categories[category].nominees.forEach((nominee) => {
    const voteCount = getVoteCount(category, nominee.id);
    const voters = voterNames[`${category}_${nominee.id}`] || [];
    out[category][nominee.name] = { votes: voteCount, voters };
  });
});

const dataStr = JSON.stringify(out, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = `${selectedSeason}-voting-results.json`;
link.click();
URL.revokeObjectURL(url);

};

const getVoteCount = (category, nomineeId) => { let count = 0; Object.values(allVotes).forEach((managerVotes) => { if (managerVotes[category] === nomineeId) count++; }); return count; };

const getTotalVotes = (category) => Object.values(allVotes).filter((mv) => mv[category]).length;

const getTimeRemaining = () => { const now = new Date(); const deadline = new Date(votingDeadline); const diff = deadline.getTime() - now.getTime(); if (diff <= 0) return 'Voting Closed'; const DAYS = 1000 * 60 * 60 * 24; const HOURS = 1000 * 60 * 60; const days = Math.floor(diff / DAYS); const hours = Math.floor((diff % DAYS) / HOURS); return ${days}d ${hours}h remaining; };

// ---- UI ---- if (!isLoggedIn) { return ( <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-4"> <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full border border-white/20"> <div className="text-center mb-6"> <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" /> <h1 className="text-2xl font-bold text-white mb-2">{selectedSeason}</h1> <h2 className="text-lg text-gray-200">Manager of the Season Voting</h2> <div className="mt-2 text-sm text-yellow-300"> <Calendar className="w-4 h-4 inline mr-1" /> {getTimeRemaining()} </div> </div>

<div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Enter Your Manager Name</label>
          <input
            type="text"
            placeholder="e.g., Scott Mckenzie"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                login(e.currentTarget.value);
              }
            }}
          />
          {verificationError && (
            <p className="mt-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{verificationError}</p>
          )}
        </div>
        <button
          onClick={() => {
            const input = document.querySelector('input');
            if (input) login(input.value);
          }}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <User className="w-4 h-4" />
          Verify & Start Voting
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-300 text-center space-y-1">
        <div className="flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Enter your Top 100 manager name
        </div>
        <div>One vote per verified manager per category</div>
      </div>
    </div>
  </div>
);

}

return ( <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900"> {/* Header */} <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10"> <div className="max-w-6xl mx-auto px-4 py-4"> <div className="flex items-center justify-between"> <div className="flex items-center gap-3"> <Trophy className="w-8 h-8 text-yellow-400" /> <div> <h1 className="text-xl font-bold text-white">Season 25 Manager Awards</h1> <p className="text-sm text-gray-300">Voting as: {currentManager}</p> </div> </div> <div className="flex items-center gap-4"> <div className="text-sm text-yellow-300"> <Calendar className="w-4 h-4 inline mr-1" /> {getTimeRemaining()} </div> <button onClick={() => setResults((s) => !s)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2" > {results ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {results ? 'Hide Results' : 'Show Results'} </button> <div className="text-sm text-gray-300"> <Users className="w-4 h-4 inline mr-1" /> {Object.keys(allVotes).length} managers voted </div> {isAdmin && ( <div className="flex items-center gap-2"> <button
onClick={exportResults}
className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
> <Download className="w-4 h-4" /> Export </button> <div className="text-xs text-orange-300 flex items-center gap-1"> <Shield className="w-3 h-3" /> Admin </div> </div> )} <button onClick={() => setIsLoggedIn(false)} className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition-colors" > Logout </button> </div> </div> </div> </div>

<div className="max-w-6xl mx-auto px-4 py-6">
    {/* Category Navigation */}
    <div className="flex flex-wrap gap-2 mb-6">
      {Object.entries(categories).map(([key, category]) => {
        const Icon = category.icon;
        const isComplete = !!votingComplete[key];
        return (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeCategory === key ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'
            } ${isComplete ? 'ring-2 ring-green-400' : ''}`}
          >
            <Icon className="w-4 h-4" />
            {category.title}
            {isComplete && <CheckCircle className="w-4 h-4 text-green-400" />}
          </button>
        );
      })}
    </div>

    {/* Current Category */}
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {React.createElement(categories[activeCategory].icon, { className: 'w-6 h-6 text-yellow-400' })}
          <h2 className="text-2xl font-bold text-white">{categories[activeCategory].title}</h2>
        </div>
        {votingComplete[activeCategory] && (
          <div className="mt-2 flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Vote submitted successfully!</span>
          </div>
        )}
      </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {categories[activeCategory].nominees.map((nominee) => {
                const isVoted = votes[activeCategory] === nominee.id;
                const voteCount = getVoteCount(activeCategory, nominee.id);
                const totalVotes = getTotalVotes(activeCategory);
                const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;

                return (
                  <div
                    key={nominee.id}
                    className={`bg-white/5 border rounded-lg p-4 transition-all cursor-pointer hover:bg-white/10 ${
                      isVoted ? 'border-green-400 bg-green-500/20' : 'border-white/20 hover:border-white/40'
                    } ${(votingComplete[activeCategory] || votingClosed) ? 'cursor-not-allowed opacity-75' : ''}`}
                    onClick={() => !votingComplete[activeCategory] && !votingClosed && submitVote(activeCategory, nominee.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{nominee.name}</h3>
                        <p className="text-yellow-400 font-medium">{nominee.club}</p>
                      </div>
                      {isVoted && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                    </div>

                    <div className="mb-3">
                      <p className="text-orange-300 font-medium text-sm mb-1">{nominee.achievement}</p>
                      <p className="text-gray-300 text-sm">{nominee.description}</p>
                    </div>

                    {results && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{voteCount} votes</span>
                          <span className="text-white font-medium">{percentage}%</span>
                        </div>
                        <div className="mt-1 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full h-2 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {isAdmin && voteCount > 0 && (
                          <details className="mt-3">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">Admin: View voters ({voteCount})</summary>
                            <div className="mt-2 text-xs text-gray-200 space-y-1 max-h-40 overflow-y-auto pr-1">
                              {(voterNames[`${activeCategory}_${nominee.id}`] || []).map((v) => (
                                <div key={`${v.name}-${v.timestamp}`} className="flex items-center justify-between gap-2 bg-white/5 px-2 py-1 rounded">
                                  <span className="truncate">{v.name}</span>
                                  <span className="opacity-70">{fmtDate(v.timestamp)}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeVote(activeCategory, nominee.id, v.name);
                                    }}
                                    className="ml-2 inline-flex items-center gap-1 text-red-300 hover:text-red-200"
                                  >
                                    <Trash2 className="w-3 h-3" /> Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}