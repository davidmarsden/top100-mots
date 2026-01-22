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

// ---- Helper: date formatting ----
const fmtDate = (iso) => new Date(iso).toLocaleString();

// Admins
const ADMIN_USERS = ["David Marsden", "Regan Thompson"];

// Fallback active manager *names* (when /api/managers is unavailable)
// These are treated as active=true and club="" as a fallback only.
const FALLBACK_ACTIVE_MANAGER_NAMES = [
  "ANMOL SATAM",
  "Adam",
  "Alessandro Ioli",
  "Alessio Tonato",
  "Andrew Kelly",
  "André Guerra",
  "Anthony Guardiola",
  "Ash L",
  "Attilio Bonnici",
  "Bharath Raj",
  "Bojan H",
  "Bruno Neto^^",
  "Carl Martin",
  "Carlos Azevedo",
  "Carlos Miranda",
  "Chris Baggio",
  "Chris East",
  "Chris Meida",
  "Chris Taylor",
  "Chris Union",
  "D. J.",
  "Armando Pierone",
  "Daniel N.Ferreira",
  "Dario Saviano",
  "Dave Oz Osborne",
  "David Inglis",
  "David Marsden",
  "Davy Vandendriessche",
  "Bozz Fordy",
  "Everton Luiz",
  "Frank Hirst",
  "Fredrik Johansson",
  "Gav Harmer",
  "Gianluca Ghio",
  "Glen Mullan",
  "Golden Bear",
  "Gregg Robinson",
  "Gursimran Brar",
  "Heath Brown",
  "Hugo Costa",
  "Ignazio Barraco",
  "James Mckenzie",
  "Jamie Alldridge",
  "Jay Jones",
  "Jerod Ramnarine",
  "Jibriil Mohamed",
  "Josh McMillan",
  "João Rocha",
  "Luís André Libras-Boas",
  "Marc Ques",
  "Marco G",
  "Marian Moise",
  "Melvin Udall",
  "Kevin Trapp",
  "Mister TRX",
  "Mohammed Ajmal",
  "Neil Frankland",
  "Noisy Steve",
  "Nuno Marques",
  "Pane Trifunov",
  "Paolo Everland",
  "Mark McKinlay",
  "Paul Masters",
  "Paul Rimmer",
  "Paulo Lopes",
  "Pedro Vilar",
  "RJ Alston",
  "Regan Thompson",
  "Ricardo Alexandre",
  "Ricardo Ferreira",
  `Richard "Skippy' Spurr`,
  "Rob Ryan",
  "Salvatore Zerbo",
  "Saverio Cordiano",
  "Scott Mckenzie",
  "Shashi P",
  "Sheene Ralspunsky",
  "Sir Stephen Beddows (God)",
  "Steven Allington",
  "Stuart Monteith",
  "Tonian McGoogan",
  "The Godfather",
  "The Special Gyan",
  "gerrit vogeleer",
  "Walter Gogh",
  "Wayne Bullough",
  "Zé Quim",
  "feargal Hickey",
  "jay jones",
  "kevin mcgregor",
  "Mark Deadman",
  "rOsS fAlCOn3r",
  "rob cast",
  "simon thomas",
  "yamil Mc02",
  "⍟Greg Bilboaツ",
  "The FM",
  "Landucci",
  "Francesco Senesi",
  "",
];

export default function VotingApp() {
  // ---- State ----
  const [selectedSeason] = useState("S26");

  const [currentManager, setCurrentManager] = useState("");
  const [currentClub, setCurrentClub] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // UI state (local per-session)
  const [votes, setVotes] = useState({}); // { category: nomineeId }
  const [votingComplete, setVotingComplete] = useState({}); // { category: true }
  const [results, setResults] = useState(false);
  const [activeCategory, setActiveCategory] = useState("overall");
  const [verificationError, setVerificationError] = useState("");

  // Remote tallies (from Google Sheets via /api/results)
  const [remoteTallies, setRemoteTallies] = useState(null);
  const [talliesLoading, setTalliesLoading] = useState(false);

  // Voting deadline
  const [votingDeadline, setVotingDeadline] = useState(() => {
    // Default: a few days ahead in London time (store in ISO)
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 5);
    return d.toISOString().slice(0, 19);
  });
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  // Persist deadline locally
  useEffect(() => {
    const saved = localStorage.getItem("votingDeadline");
    if (saved) setVotingDeadline(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("votingDeadline", votingDeadline);
  }, [votingDeadline]);

  // Client-side “closed” flag
  const votingClosed = useMemo(
    () => new Date() > new Date(votingDeadline),
    [votingDeadline]
  );

  // In-memory aggregate (local quick feedback)
  const [allVotes, setAllVotes] = useState({});
  const [voterNames, setVoterNames] = useState({});

  // ---- Valid Managers (club, name, active) ----
  const fallbackManagers = useMemo(
    () =>
      FALLBACK_ACTIVE_MANAGER_NAMES.map((n) => ({
        club: "",
        name: n,
        active: true,
      })),
    []
  );
  const [validManagers, setValidManagers] = useState(fallbackManagers);

  // Try to hydrate from Google Sheet via Netlify Function
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/managers");
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok || !Array.isArray(data?.managers)) return;

        // Clean + dedupe by (name, club)
        const seen = new Set();
        const clean = data.managers
          .map((m) => ({
            club: (m.club || "").toString().trim(),
            name: (m.name || "").toString().trim(),
            active: !!m.active,
          }))
          .filter((m) => m.name)
          .filter((m) => {
            const key = `${m.name.toLowerCase()}|${m.club.toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .filter((m) => m.active); // only active

        if (!cancelled && clean.length) {
          setValidManagers(clean);
        }
      } catch {
        // leave fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackManagers]);

  // ---- Club-aware matching helpers ----
  const findMatchesByName = (name) =>
    validManagers.filter(
      (m) =>
        m.name &&
        m.name.trim().toLowerCase() === (name || "").trim().toLowerCase()
    );

  const findCanonicalManager = (name, clubOptional) => {
    const matches = findMatchesByName(name);
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    if (!clubOptional) return "AMBIGUOUS";
    const byClub = matches.find(
      (m) =>
        (m.club || "").trim().toLowerCase() ===
        (clubOptional || "").trim().toLowerCase()
    );
    return byClub || null;
  };

  // Login form inputs
  const [nameInput, setNameInput] = useState("");
  const [clubInput, setClubInput] = useState("");
  const [needsClub, setNeedsClub] = useState(false);

  // ---- Tallies (Sheets) ----
  const refreshTallies = async () => {
    try {
      setTalliesLoading(true);
      const r = await fetch("/api/results");
      const j = await r.json();
      if (j?.ok && j?.tallies) setRemoteTallies(j.tallies);
    } catch {
      // ignore
    } finally {
      setTalliesLoading(false);
    }
  };

  // Load tallies when results visible or once closed (and refresh periodically)
  useEffect(() => {
    if (!(results || votingClosed)) return;
    refreshTallies();
    const id = setInterval(refreshTallies, 15000);
    return () => clearInterval(id);
  }, [results, votingClosed]);

  // ---- Categories ----
  const categories = useMemo(
    () => ({
      overall: {
        title: "Overall Manager of the Season",
        icon: Trophy,
        nominees: [
          {
            id: "andre_guerra",
            name: "André Guerra",
            club: "FC Porto",
            achievement:
              "Double Winner (D1 + SMFA Shield)",
            description: "First D1 title at the 26th attempt! Best statistical performance in D1.",
          },
          {
            id: "fredrik_johansson",
            name: "Fredrik Johansson",
            club: "Sporting CP",
            achievement:
              "D2 Champion",
            description: "Won the division in his first season at the club.",
          },
          {
            id: "glen_mullan",
            name: "Glen Mullan",
            club: "4CD Espanyol",
            achievement: "Youth Cup Winners + D2 Playoff Finalists.",
            description: "First Youth Cup Final win after five losses.",
          },
          {
            id: "jibriil_mohamed",
            name: "Jibriil Mohamed",
            club: "VfL Wolfsburg",
            achievement: "D3 Champion",
            description: "Best statistical performance in Top 100.",
          },
          {
            id: "the_fm",
            name: "The FM",
            club: "FC Basel",
            achievement: "D4 Champion",
            description: "Won the division in his first season in Top 100. 2nd best statistical performance in the game world.",
          },
        ],
      },
      division1: {
        title: "Division 1 Manager of the Season",
        icon: Star,
        nominees: [
          {
            id: "andre_guerra_d1",
            name: "André Guerra",
            club: "FC Porto",
            achievement:
              "Double Winner (D1 + SMFA Shield)",
            description: "First D1 title at the 26th attempt! Best statistical performance in D1.",
          },
          {
            id: "simon_thomas_d1",
            name: "simon thomas",
            club: "AC Milan",
            achievement: "3rd best statistical performance. Charity Shield Winner.",
            description: "Predicted to be relegated, finished 9th.",
          },
          {
            id: "doug_earle_d1",
            name: "Doug Earle",
            club: "Leicester City",
            achievement: "World Club Cup Winner.",
            description: "2nd in D1. 2nd best statistical performance.",
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
        ],
      },
    }),
    []
  );

// ---- Login / Logout / Reset ----
  const handleResetAllVotes = async () => {
    if (!isAdmin) return;
    if (!confirm("This will clear ALL local votes (UI only). Proceed?")) return;
    setAllVotes({});
    setVoterNames({});
    setVotes({});
    setVotingComplete({});
    // (Optional) call a /api/reset-votes if you later create one for Sheets.
    try { await fetch("/api/reset-votes", { method: "POST" }); } catch {}
  };

  const login = (rawName, rawClub) => {
    setVerificationError("");

    const name = (rawName || "").trim();
    const club = (rawClub || "").trim();

    if (!name) {
      setVerificationError("Please enter a manager name");
      return;
    }

    if (votingClosed && !ADMIN_USERS.includes(name)) {
      const d = new Date(votingDeadline);
      setVerificationError(
        `Voting closed on ${d.toLocaleDateString()}. Contact admin if you need assistance.`
      );
      return;
    }

    const match = findCanonicalManager(name, club || undefined);
    if (match === "AMBIGUOUS") {
      setNeedsClub(true);
      setVerificationError(
        "Multiple managers share this name — please pick the correct club."
      );
      return;
    }
    if (!match) {
      setVerificationError(
        `"${name}" is not found in the active Top 100 manager database.`
      );
      return;
    }

    setCurrentManager(match.name);
    setCurrentClub(match.club || "");
    setIsLoggedIn(true);
    setIsAdmin(ADMIN_USERS.includes(match.name));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentManager("");
    setCurrentClub("");
    setIsAdmin(false);
    setVotes({});
    setVotingComplete({});
    setResults(false);
    setVerificationError("");
    setNameInput("");
    setClubInput("");
    setNeedsClub(false);
  };

  // ---- Voting ----
  const submitVote = (category, nomineeId) => {
    if (!isLoggedIn || !currentManager) return;

    // Local UI state (allow re-vote by same manager: overwrite)
    setVotes((prev) => ({ ...prev, [category]: nomineeId }));
    setVotingComplete((prev) => ({ ...prev, [category]: true }));

    setAllVotes((prev) => ({
      ...prev,
      [currentManager]: { ...(prev[currentManager] || {}), [category]: nomineeId },
    }));

    // Track voter names per nominee (update lists for the *current* choice in UI)
    setVoterNames((prev) => {
      const next = { ...prev };
      // Remove my previous selection in this category, if any
      const prevChoice = votes[category];
      if (prevChoice) {
        const kOld = `${category}_${prevChoice}`;
        next[kOld] = (next[kOld] || []).filter((v) => v.name !== currentManager);
      }
      // Add to new choice
      const kNew = `${category}_${nomineeId}`;
      next[kNew] = [
        ...(next[kNew] || []),
        { name: currentManager, timestamp: new Date().toISOString() },
      ];
      return next;
    });

    // Persist to backend (Sheets)
    try {
      const nomineeObj = categories[category]?.nominees?.find((n) => n.id === nomineeId);
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
    } catch {}
  };

  const removeVote = (category, nomineeId, voterName) => {
    if (!isAdmin) return;

    setVoterNames((prev) => ({
      ...prev,
      [`${category}_${nomineeId}`]: (prev[`${category}_${nomineeId}`] || []).filter(
        (v) => v.name !== voterName
      ),
    }));

    setAllVotes((prev) => {
      const next = { ...prev };
      if (next[voterName]?.[category]) {
        delete next[voterName][category];
        if (Object.keys(next[voterName]).length === 0) delete next[voterName];
      }
      return next;
    });

    // (Optional) call backend to revoke a vote if you add that later.
  };

  // ---- Counts (prefer Sheets tallies; fallback to local) ----
  const getVoteCount = (category, nomineeId) => {
    const rt = remoteTallies?.[category]?.[nomineeId]?.votes;
    if (typeof rt === "number") return rt;
    // Fallback local
    let count = 0;
    Object.values(allVotes).forEach((mv) => {
      if (mv[category] === nomineeId) count++;
    });
    return count;
  };

  const getTotalVotes = (category) => {
    if (remoteTallies?.[category]) {
      return Object.values(remoteTallies[category]).reduce(
        (sum, v) => sum + (v?.votes || 0),
        0
      );
    }
    return Object.values(allVotes).filter((mv) => mv[category]).length;
  };

  // ---- Export (JSON dump of current view) ----
  const exportResults = () => {
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
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSeason}-voting-results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Time remaining ----
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

  // ---- UI ----
  if (!isLoggedIn) {
    // ---------- LOGIN VIEW ----------
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">{selectedSeason}</h1>
            <h2 className="text-lg text-gray-200">Manager of the Season Voting</h2>

            <div className="mt-2 text-sm text-yellow-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 inline" />
              {getTimeRemaining()}
              {isAdmin && (
                !isEditingDeadline ? (
                  <button
                    onClick={() => setIsEditingDeadline(true)}
                    className="ml-2 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                    title="Edit voting deadline"
                  >
                    Edit deadline
                  </button>
                ) : (
                  <>
                    <input
                      type="datetime-local"
                      className="ml-2 bg-black/30 border border-white/20 rounded px-2 py-1 text-white"
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
                )
              )}
            </div>
          </div>

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
                  placeholder="e.g., AS Monaco"
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

            <div className="mt-6 text-xs text-gray-300 text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Enter your active Top 100 manager name
              </div>
              <div>One vote per verified manager per category</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

// ---------- LOGGED-IN VIEW ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Season 26 Manager Awards</h1>
                <p className="text-sm text-gray-300">
                  Voting as: {currentManager}
                  {currentClub ? ` (${currentClub})` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Deadline / edit (admin) */}
              <div className="text-sm text-yellow-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 inline" />
                {getTimeRemaining()}
                {isAdmin && !isEditingDeadline && (
                  <button
                    onClick={() => setIsEditingDeadline(true)}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                    title="Edit voting deadline"
                  >
                    Edit
                  </button>
                )}
                {isAdmin && isEditingDeadline && (
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
              </div>

              {/* Results toggle or closed banner */}
              {!votingClosed ? (
                <button
                  onClick={() => setResults((s) => !s)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {results ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {results ? "Hide Results" : "Show Results"}
                </button>
              ) : (
                <span className="text-sm text-green-300 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Voting closed — results visible to all
                </span>
              )}

              {(results || votingClosed) && (
                <span className="text-xs text-gray-300">
                  {talliesLoading ? "Syncing…" : "From Google Sheets"}
                </span>
              )}

              <div className="text-sm text-gray-300">
                <Users className="w-4 h-4 inline mr-1" />
                {Object.keys(allVotes).length} managers voted
              </div>

              {isAdmin && (
                <>
                  <button
                    onClick={exportResults}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>

                  <button
                    onClick={handleResetAllVotes}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                    title="Reset local UI votes (does not clear Google Sheet)"
                  >
                    Reset
                  </button>

                  <div className="text-xs text-orange-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </div>
                </>
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
                {isComplete && <CheckCircle className="w-4 h-4 text-green-400" />}
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

                const disabled = votingClosed; // still let admins toggle results separately

                return (
                  <div
                    key={nominee.id}
                    className={`bg-white/5 border rounded-lg p-4 transition-all ${
                      isVoted
                        ? "border-green-400 bg-green-500/20"
                        : "border-white/20 hover:border-white/40"
                    } ${disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer hover:bg-white/10"}`}
                    onClick={() =>
                      !disabled && submitVote(activeCategory, nominee.id)
                    }
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{nominee.name}</h3>
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

                    {(results || votingClosed) && (
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
                              {(voterNames[`${activeCategory}_${nominee.id}`] || []).map((v) => (
                                <div
                                  key={`${v.name}-${v.timestamp}`}
                                  className="flex items-center justify-between gap-2 bg-white/5 px-2 py-1 rounded"
                                >
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