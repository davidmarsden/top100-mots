import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Star,
  Award,
  Users,
  CheckCircle,
  Lock,
  User,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  Download,
  Trash2,
} from "lucide-react";

// Helper: format ISO date/time to local string
const fmtDate = (iso) => new Date(iso).toLocaleString();

export default function VotingApp() {
  // ---------- Core state ----------
  const [currentManager, setCurrentManager] = useState(""); // display name e.g. "Jay Jones (Dinamo Zagreb)"
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votes, setVotes] = useState({}); // per-session UI selection
  const [votingComplete, setVotingComplete] = useState({}); // category → true
  const [activeCategory, setActiveCategory] = useState("overall");
  const [results, setResults] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [selectedSeason] = useState("S25");

  // Deadline (editable by admin)
  const [votingDeadline, setVotingDeadline] = useState("2025-09-15T23:59:59");
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  // Persist deadline locally
  useEffect(() => {
    const saved = localStorage.getItem("votingDeadline");
    if (saved) setVotingDeadline(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("votingDeadline", votingDeadline);
  }, [votingDeadline]);

  // In-memory vote store (simulated)
  // allVotes is keyed by canonical composite key "name|club"
  const [allVotes, setAllVotes] = useState({});
  // voterNames tracks display voters list per nominee
  const [voterNames, setVoterNames] = useState({}); // { `${cat}_${id}`: [ { name: display, timestamp } ] }

  // ---------- Admins ----------
  const adminUsers = useMemo(
    () => ["David Marsden", "Mister TRX", "Heath Brown"],
    []
  );

  // ---------- Valid managers (fallback defaults as objects) ----------
 // defaultManagers is your array of strings.
const [validManagers, setValidManagers] = useState(
  defaultManagers.map((n) => ({ name: n, club: "" }))
);

// ---------- Fetch managers from Netlify Function (Google Sheet) ----------
useEffect(() => {
  let cancelled = false;

  // truthiness for the "Active" column
  const truthy = (v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string")
      return ["true", "yes", "1", "y"].includes(v.trim().toLowerCase());
    return false;
  };

  const toPairKey = (name, club) =>
    `${(name || "").trim().toLowerCase()}|${(club || "").trim().toLowerCase()}`;

  const normalizeRows = (rows) => {
    if (!Array.isArray(rows)) return [];

    const out = [];
    const seen = new Set();

    for (const row of rows) {
      let name = "";
      let club = "";
      let active = true; // default true if absent

      if (typeof row === "string") {
        name = row.trim();
      } else if (Array.isArray(row)) {
        // Your sheet order: [club, name, active]
        club = (row[0] ?? "").toString().trim();
        name = (row[1] ?? "").toString().trim();
        active = truthy(row[2]);
      } else if (row && typeof row === "object") {
        // Accept various casings/keys
        const r = Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k.toLowerCase(), v])
        );
        name = (r.name ?? r.manager ?? "").toString().trim();
        club = (r.club ?? "").toString().trim();
        const a = r.active ?? row.Active ?? row.active;
        if (a !== undefined) active = truthy(a);
      }

      if (!name) continue;
      if (!active) continue;

      const key = toPairKey(name, club);
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({ name, club });
    }

    return out;
  };

  (async () => {
    try {
      const res = await fetch("/api/managers");
      if (!res.ok) return;
      const data = await res.json();
      if (cancelled) return;

      const rows = Array.isArray(data?.managers) ? data.managers : [];
      const normalized = normalizeRows(rows);

      // Fallback to defaults (as objects) if nothing valid came back
      setValidManagers(
        normalized.length
          ? normalized
          : defaultManagers.map((n) => ({ name: n, club: "" }))
      );
    } catch {
      setValidManagers(defaultManagers.map((n) => ({ name: n, club: "" })));
    }
  })();

  return () => {
    cancelled = true;
  };
}, [defaultManagers]);

  // ---------- Login inputs / ambiguity handling ----------
  const [nameInput, setNameInput] = useState("");
  const [clubInput, setClubInput] = useState("");
  const [needsClub, setNeedsClub] = useState(false);

  // ---------- Client-side closed flag ----------
  const votingClosed = useMemo(
    () => new Date() > new Date(votingDeadline),
    [votingDeadline]
  );

  // ---------- Categories ----------
  const categories = useMemo(
    () => ({
      overall: {
        title: "Overall Manager of the Season",
        icon: Trophy,
        nominees: [
          {
            id: "andre_libras",
            name: "André Libras-Boas",
            club: "Hellas Verona",
            achievement:
              "Treble Winner (D1 + SMFA Champions Cup + Charity Shield)",
            description: "Only manager to win multiple major trophies in S25",
          },
          {
            id: "david_marsden",
            name: "David Marsden",
            club: "Hamburger SV",
            achievement:
              "Greatest Transformation (+16 VA - Highest in all divisions)",
            description: "D2 Champion: 17th prediction → Champions",
          },
          {
            id: "scott_mckenzie",
            name: "Scott Mckenzie",
            club: "São Paulo FC",
            achievement: "GOAT's Masterclass (+11 VA in Division 1)",
            description: "#1 all-time manager: 15th → 4th place",
          },
          {
            id: "simon_thomas",
            name: "simon thomas",
            club: "AC Milan",
            achievement: "Cup Champion + Great Escape (+8 VA)",
            description: "Top 100 Cup Winner: 20th prediction → 12th finish",
          },
          {
            id: "adam",
            name: "Adam",
            club: "Barcelona",
            achievement: "Multi-Generational Master",
            description: "World Club Cup + Youth Cup Winner",
          },
        ],
      },
      division1: {
        title: "Division 1 Manager of the Season",
        icon: Star,
        nominees: [
          {
            id: "andre_libras_d1",
            name: "André Libras-Boas",
            club: "Hellas Verona",
            achievement: "D1 Champion + SMFA Champions Cup + Charity Shield",
            description:
              "Successfully defended title, only multiple trophy winner",
          },
          {
            id: "scott_mckenzie_d1",
            name: "Scott Mckenzie",
            club: "São Paulo FC",
            achievement: "Top Statistical Performer (+11 VA, +3 PVA)",
            description:
              "Predicted 15th → finished 4th, incredible transformation",
          },
          {
            id: "adam_d1",
            name: "Adam",
            club: "Barcelona",
            achievement: "World Club Cup + Youth Cup Winner",
            description: "2nd place finish, multi-competition excellence",
          },
          {
            id: "bojan_d1",
            name: "Bojan H",
            club: "Bayern München",
            achievement: "SMFA Shield Winner + 3rd place",
            description: "Strong overperformance (predicted 6th, +8 VA)",
          },
        ],
      },
      division2: {
        title: "Division 2 Manager of the Season",
        icon: Award,
        nominees: [
          {
            id: "david_marsden_d2",
            name: "David Marsden",
            club: "Hamburger SV",
            achievement: "Division 2 Champion",
            description:
              "Extraordinary turnaround: predicted 17th → title (+16 VA)",
          },
          {
            id: "greg_bilboatu_d2",
            name: "⍟Greg Bilboaţu",
            club: "Dinamo Zagreb",
            achievement: "3rd place; top statistical performance",
            description:
              "Predicted 16th → 3rd (+13 VA); narrowly missed auto-promo",
          },
          {
            id: "dave_oz_d2",
            name: "Dave Oz Osborne",
            club: "Málaga CF",
            achievement: "Play-off Winner (promotion secured)",
            description: "Clutch playoff performance to seal promotion",
          },
        ],
      },
      division3: {
        title: "Division 3 Manager of the Season",
        icon: Award,
        nominees: [
          {
            id: "chris_meida_d3",
            name: "Chris Meida",
            club: "CSKA Moskva",
            achievement: "D3 Champion + Youth Shield Winner",
            description: "Pred 9th → title (+8 VA, +9 PVA); youth success too",
          },
          {
            id: "mike_scallotti_d3",
            name: "Mike Scallotti",
            club: "Everton",
            achievement: "Play-off Winner (promotion secured)",
            description:
              "Comeback from bottom into promotion—underdog story",
          },
          {
            id: "jamie_rune_d3",
            name: "Jamie ᚺ",
            club: "FC Augsburg",
            achievement: "3rd place; exceptional stats",
            description:
              "Pred 13th → 3rd (+10 VA); outstanding tactical management",
          },
        ],
      },
      division4: {
        title: "Division 4 Manager of the Season",
        icon: Award,
        nominees: [
          {
            id: "stuart_monteith_d4",
            name: "Stuart Monteith",
            club: "Montpellier HSC",
            achievement: "2nd place + Automatic Promotion",
            description:
              "Pred 14th → 2nd; huge overperformance to auto-promo",
          },
          {
            id: "chris_union_d4",
            name: "Chris Union",
            club: "Boca Juniors",
            achievement: "Division 4 Champion",
            description: "Won title from 3rd prediction; 96.0 attack rating",
          },
          {
            id: "fredrik_johansson_d4",
            name: "Fredrik Johansson",
            club: "VfL Wolfsburg",
            achievement: "Play-off Winner (promotion secured)",
            description: "Delivered in the clutch to go up via playoffs",
          },
          {
            id: "ruts66_d4",
            name: "ruts66",
            club: "Feyenoord",
            achievement: "Top statistical performer",
            description:
              "Pred 17th → top VA (+13) despite playoff exit",
          },
        ],
      },
      division5: {
        title: "Division 5 Manager of the Season",
        icon: Award,
        nominees: [
          {
            id: "marc_ques_d5",
            name: "Marc Ques",
            club: "FK Partizan",
            achievement: "Division 5 Champion",
            description:
              "Pred 9th → clear title (+8 VA) and best stats",
          },
          {
            id: "bruno_neto_d5",
            name: "Bruno Neto^^",
            club: "Olympique Lyonnais",
            achievement: "Runner-up; exceptional stats",
            description:
              "Pred 15th → 2nd (+13 VA); narrow miss for title",
          },
          {
            id: "marian_moise_d5",
            name: "Marian Moise",
            club: "Newcastle United",
            achievement: "Play-off Winner (promotion secured)",
            description:
              "Pred 11th → promoted via playoffs (+6 VA)",
          },
          {
            id: "wayne_bullough_d5",
            name: "Wayne Bullough",
            club: "Athletic Club",
            achievement: "Highest individual overperformance",
            description:
              "Pred 20th → massive +14 VA; long-term build paying off",
          },
        ],
      },
      cups: {
        title: "Cup Competition Excellence",
        icon: Trophy,
        nominees: [
          {
            id: "andre_libras_cups",
            name: "André Libras-Boas",
            club: "Hellas Verona",
            achievement: "SMFA Champions Cup Winner",
            description:
              "Won elite European competition alongside league success",
          },
          {
            id: "adam_cups",
            name: "Adam",
            club: "Barcelona",
            achievement: "World Club Cup + Youth Cup Winner",
            description:
              "Double cup success across senior and youth competitions",
          },
          {
            id: "simon_thomas_cup",
            name: "simon thomas",
            club: "AC Milan",
            achievement: "Top 100 Cup Winner",
            description: "Won the premier knockout competition",
          },
          {
            id: "andre_guerra_cup",
            name: "André Guerra",
            club: "FC Porto",
            achievement: "Top 100 Shield Winner",
            description: "Won the premier shield competition",
          },
          {
            id: "james_mckenzie_cup",
            name: "James Mckenzie",
            club: "Chelsea",
            achievement: "SMFA Super Cup Winner",
            description: "Prestigious European super cup triumph",
          },
        ],
      },
    }),
    []
  );

  // ---------- Manager helpers ----------
  const canonicalKey = (name, club) =>
    `${name}`.trim().toLowerCase() + "|" + `${club || ""}`.trim().toLowerCase();

  const findMatchesByName = (name) =>
    validManagers.filter(
      (m) =>
        m.name && m.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const findCanonicalManager = (name, clubOptional) => {
    const matches = findMatchesByName(name);
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    if (!clubOptional) return "AMBIGUOUS"; // need club selection
    const byClub = matches.find(
      (m) =>
        (m.club || "").trim().toLowerCase() ===
        clubOptional.trim().toLowerCase()
    );
    return byClub || null;
  };

  // ---------- Login ----------
  const login = (rawName, rawClub) => {
    const trimmedName = (rawName || "").trim();
    const trimmedClub = (rawClub || "").trim();
    setVerificationError("");
    setNeedsClub(false);

    if (!trimmedName) {
      setVerificationError("Please enter a manager name");
      return;
    }

    // Deadline check (client-side)
    if (votingClosed && !adminUsers.includes(trimmedName)) {
      const d = new Date(votingDeadline);
      setVerificationError(
        `Voting closed on ${d.toLocaleDateString()}. Contact admin if you need assistance.`
      );
      return;
    }

    const match = findCanonicalManager(trimmedName, trimmedClub);

    if (match === "AMBIGUOUS") {
      setNeedsClub(true);
      setVerificationError(
        `Multiple managers named "${trimmedName}" found. Please select a club.`
      );
      return;
    }

    if (!match) {
      setVerificationError(
        `"${trimmedName}" is not in the Top 100 (or is inactive). Please check spelling or contact admin.`
      );
      return;
    }

    const key = canonicalKey(match.name, match.club);

    // One ballot per manager key (name+club)
    const hasVoted = Object.keys(allVotes).some(
      (k) => k.toLowerCase() === key.toLowerCase()
    );
    if (hasVoted && !adminUsers.includes(match.name)) {
      setVerificationError(
        `"${match.name}${match.club ? " (" + match.club + ")" : ""}" has already cast votes. One ballot per manager.`
      );
      return;
    }

    // Use display name like "Name (Club)" for clarity in UI
    setCurrentManager(`${match.name}${match.club ? " (" + match.club + ")" : ""}`);
    setIsLoggedIn(true);
    setIsAdmin(adminUsers.includes(match.name));
  };

  // ---------- Voting ----------
  const submitVote = (category, nomineeId) => {
    if (!isLoggedIn || votingClosed || !currentManager) return;

    // Derive name+club from the display string "Name (Club)" if present
    const m = currentManager.match(/^(.*?)(?:\s\((.*)\))?$/);
    const namePart = (m?.[1] || "").trim();
    const clubPart = (m?.[2] || "").trim();
    const key = canonicalKey(namePart, clubPart);

    setVotes((prev) => ({ ...prev, [category]: nomineeId }));
    setVotingComplete((prev) => ({ ...prev, [category]: true }));

    setAllVotes((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [category]: nomineeId },
    }));

    setVoterNames((prev) => ({
      ...prev,
      [`${category}_${nomineeId}`]: [
        ...(prev[`${category}_${nomineeId}`] || []),
        { name: currentManager, timestamp: new Date().toISOString() }, // display string
      ],
    }));

    // Optional: persist to backend
    try {
      const nomineeObj = categories[category]?.nominees?.find(
        (n) => n.id === nomineeId
      );
      const nomineeName = nomineeObj ? nomineeObj.name : nomineeId;
      fetch("/api/submit-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manager: currentManager, // display
          managerKey: key, // canonical key for backend if you want
          name: namePart,
          club: clubPart,
          category,
          nomineeId,
          nomineeName,
          season: selectedSeason,
        }),
      }).catch(() => {});
    } catch {
      // no-op
    }
  };

  const removeVote = (category, nomineeId, voterDisplay) => {
    if (!isAdmin) return;

    // voterDisplay is like "Name (Club)" (or just "Name")
    const m = (voterDisplay || "").match(/^(.*?)(?:\s\((.*)\))?$/);
    const namePart = (m?.[1] || "").trim();
    const clubPart = (m?.[2] || "").trim();
    const key = canonicalKey(namePart, clubPart);

    setVoterNames((prev) => ({
      ...prev,
      [`${category}_${nomineeId}`]: (prev[`${category}_${nomineeId}`] || []).filter(
        (v) => v.name !== voterDisplay
      ),
    }));

    setAllVotes((prev) => {
      const next = { ...prev };
      if (next[key]?.[category]) {
        delete next[key][category];
        if (Object.keys(next[key]).length === 0) delete next[key];
      }
      return next;
    });

    // Optional: backend revoke
    // fetch('/api/remove-vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ managerKey: key, category, nomineeId, season: selectedSeason }) });
  };

  const exportResults = () => {
    if (!isAdmin) return;
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
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedSeason}-voting-results.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getVoteCount = (category, nomineeId) => {
    let count = 0;
    Object.values(allVotes).forEach((mv) => {
      if (mv[category] === nomineeId) count++;
    });
    return count;
  };

  const getTotalVotes = (category) =>
    Object.values(allVotes).filter((mv) => mv[category]).length;

  const getTimeRemaining = () => {
    const now = new Date();
    const deadline = new Date(votingDeadline);
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return "Voting Closed";

    const MIN = 1000 * 60;
    const HOUR = MIN * 60;
    const DAY = HOUR * 24;

    const days = Math.floor(diff / DAY);
    const hours = Math.floor((diff % DAY) / HOUR);
    const minutes = Math.floor((diff % HOUR) / MIN);

    return `${days}d ${hours}h ${minutes}m remaining`;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentManager("");
    setIsAdmin(false);
    setVotes({});
    setVotingComplete({});
    setResults(false);
    setVerificationError("");
    setNameInput("");
    setClubInput("");
    setNeedsClub(false);
  };

  // ---------- UI ----------
  return isLoggedIn ? (
    // ===== LOGGED-IN APP =====
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Season 25 Manager Awards
                </h1>
                <p className="text-sm text-gray-300">
                  Voting as: {currentManager}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-yellow-300">
                <Calendar className="w-4 h-4 inline mr-1" />
                {getTimeRemaining()}
                {isAdmin && (
                  <span className="ml-3 inline-flex items-center gap-2">
                    {!isEditingDeadline ? (
                      <button
                        onClick={() => setIsEditingDeadline(true)}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                      >
                        Edit deadline
                      </button>
                    ) : (
                      <>
                        <input
                          type="datetime-local"
                          className="bg-black/30 border border-white/20 rounded px-2 py-1 text-white"
                          value={new Date(votingDeadline)
                            .toISOString()
                            .slice(0, 16)}
                          onChange={(e) => {
                            const v = e.target.value
                              ? new Date(e.target.value)
                                  .toISOString()
                                  .slice(0, 19)
                              : "";
                            if (v) setVotingDeadline(v);
                          }}
                        />
                        <button
                          onClick={() => setIsEditingDeadline(false)}
                          className="px-2 py-1 rounded bg-green-500/30 hover:bg-green-500/40 text-green-100"
                        >
                          Done
                        </button>
                      </>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={() => setResults((s) => !s)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {results ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {results ? "Hide Results" : "Show Results"}
              </button>
              <div className="text-sm text-gray-300">
                <Users className="w-4 h-4 inline mr-1" />
                {Object.keys(allVotes).length} managers voted
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportResults}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <div className="text-xs text-orange-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </div>
                </div>
              )}
              <button
                onClick={logout}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
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
                  activeCategory === key
                    ? "bg-yellow-500 text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                } ${isComplete ? "ring-2 ring-green-400" : ""}`}
              >
                <Icon className="w-4 h-4" />
                {category.title}
                {isComplete && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Current Category */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              {React.createElement(categories[activeCategory].icon, {
                className: "w-6 h-6 text-yellow-400",
              })}
              <h2 className="text-2xl font-bold text-white">
                {categories[activeCategory].title}
              </h2>
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
                const percentage =
                  totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;

                return (
                  <div
                    key={nominee.id}
                    className={`bg-white/5 border rounded-lg p-4 transition-all cursor-pointer hover:bg-white/10 ${
                      isVoted
                        ? "border-green-400 bg-green-500/20"
                        : "border-white/20 hover:border-white/40"
                    } ${
                      votingComplete[activeCategory] || votingClosed
                        ? "cursor-not-allowed opacity-75"
                        : ""
                    }`}
                    onClick={() =>
                      !votingComplete[activeCategory] &&
                      !votingClosed &&
                      submitVote(activeCategory, nominee.id)
                    }
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {nominee.name}
                        </h3>
                        <p className="text-yellow-400 font-medium">{nominee.club}</p>
                      </div>
                      {isVoted && (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-orange-300 font-medium text-sm mb-1">
                        {nominee.achievement}
                      </p>
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
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                              Admin: View voters ({voteCount})
                            </summary>
                            <div className="mt-2 text-xs text-gray-200 space-y-1 max-h-40 overflow-y-auto pr-1">
                              {(voterNames[`${activeCategory}_${nominee.id}`] || []).map(
                                (v) => (
                                  <div
                                    key={`${v.name}-${v.timestamp}`}
                                    className="flex items-center justify-between gap-2 bg-white/5 px-2 py-1 rounded"
                                  >
                                    <span className="truncate">{v.name}</span>
                                    <span className="opacity-70">
                                      {fmtDate(v.timestamp)}
                                    </span>
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
                                )
                              )}
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
  ) : (
    // ===== LOGIN VIEW =====
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{selectedSeason}</h1>
          <h2 className="text-lg text-gray-200">Manager of the Season Voting</h2>
          <div className="text-sm text-yellow-300 mt-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            {getTimeRemaining()}
            {isAdmin && (
              <span className="ml-3 inline-flex items-center gap-2">
                {!isEditingDeadline ? (
                  <button
                    onClick={() => setIsEditingDeadline(true)}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                  >
                    Edit deadline
                  </button>
                ) : (
                  <>
                    <input
                      type="datetime-local"
                      className="bg-black/30 border border-white/20 rounded px-2 py-1 text-white"
                      value={new Date(votingDeadline).toISOString().slice(0, 16)}
                      onChange={(e) => {
                        const v = e.target.value
                          ? new Date(e.target.value).toISOString().slice(0, 19)
                          : "";
                        if (v) setVotingDeadline(v);
                      }}
                    />
                    <button
                      onClick={() => setIsEditingDeadline(false)}
                      className="px-2 py-1 rounded bg-green-500/30 hover:bg-green-500/40 text-green-100"
                    >
                      Done
                    </button>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Enter Your Manager Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                const matches = findMatchesByName(e.target.value || "");
                setNeedsClub(matches.length > 1);
              }}
              placeholder="e.g., Jay Jones"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login(nameInput, clubInput);
                }
              }}
            />
          </div>

          {needsClub && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Select Your Club
              </label>
              <input
                list="clubs-for-name"
                value={clubInput}
                onChange={(e) => setClubInput(e.target.value)}
                placeholder="e.g., Dinamo Zagreb"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    login(nameInput, clubInput);
                  }
                }}
              />
              <datalist id="clubs-for-name">
                {findMatchesByName(nameInput || "").map((m) => (
                  <option key={`${m.name}-${m.club}`} value={m.club} />
                ))}
              </datalist>
              <p className="text-xs text-gray-300 mt-1">
                Multiple managers share this name — please pick the correct club.
              </p>
            </div>
          )}

          {verificationError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
              {verificationError}
            </p>
          )}

          <button
            onClick={() => login(nameInput, clubInput)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Verify & Start Voting
          </button>
        </div>

        {/* Small print */}
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