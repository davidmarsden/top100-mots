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

// Small helper
const fmtDate = (iso) => new Date(iso).toLocaleString();

// Admins
const ADMIN_USERS = ["David Marsden", "Regan Thompson"];

export default function VotingApp() {
  // ---------------- State ----------------
  const [currentManager, setCurrentManager] = useState("");
  const [currentClub, setCurrentClub] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [votes, setVotes] = useState({});                // per-user (UI)
  const [votingComplete, setVotingComplete] = useState({});
  const [activeCategory, setActiveCategory] = useState("overall");
  const [results, setResults] = useState(false);

  const [verificationError, setVerificationError] = useState("");
  const [selectedSeason] = useState("S25");

  const [votingDeadline, setVotingDeadline] = useState(
    localStorage.getItem("votingDeadline") || "2025-09-15T23:59:59"
  );
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  // Login inputs (with duplicate-name disambiguation by club)
  const [nameInput, setNameInput] = useState("");
  const [clubInput, setClubInput] = useState("");
  const [needsClub, setNeedsClub] = useState(false);

  // aggregate store (in-memory)
  const [allVotes, setAllVotes] = useState({}); // { "Name|Club": { overall: 'id', ... } }
  const [voterNames, setVoterNames] = useState({}); // { `${cat}_${id}`: [ { name, timestamp } ] }

  // Persist deadline
  useEffect(() => {
    localStorage.setItem("votingDeadline", votingDeadline);
  }, [votingDeadline]);

  // ---------------- Managers list ----------------
  // Fallback active managers (name-only) – used if function not available
  const fallbackNames = useMemo(
    () => [
      "ANMOL SATAM", "Adam", "Alessandro Ioli", "Alessio Tonato", "Andrew Kelly",
      "André Guerra", "Anthony Guardiola", "Ash L", "Attilio Bonnici", "Bharath Raj",
      "Bojan H", "Bruno Neto^^", "Carl Martin", "Carlos Azevedo", "Carlos Miranda",
      "Chris Baggio", "Chris East", "Chris Meida", "Chris Taylor", "Chris Union",
      "D. J.", "Dan Wallace", "Daniel N.Ferreira", "Dario Saviano", "Dave Oz Osborne",
      "David Inglis", "David Marsden", "Davy Vandendriessche", "Doug Earle",
      "Everton Luiz", "Frank Hirst", "Fredrik Johansson", "Gav Harmer", "Gianluca Ghio",
      "Glen Mullan", "Golden Bear", "Gregg Robinson", "Gursimran Brar", "Heath Brown",
      "Hugo Costa", "Ignazio Barraco", "James Mckenzie", "Jamie Alldridge", "Jay Jones",
      "Jerod Ramnarine", "Jibriil Mohamed", "Josh McMillan", "João Rocha",
      "Luís André Libras-Boas", "Marc Ques", "Marco G", "Marian Moise", "Melvin Udall",
      "Mike Scallotti", "Mister TRX", "Mohammed Ajmal", "Neil Frankland", "Noisy Steve",
      "Nuno Marques", "Pane Trifunov", "Paolo Everland", "Patrik Breznický",
      "Paul Masters", "Paul Rimmer", "Paulo Lopes", "Pedro Vilar", "RJ Alston",
      "Regan Thompson", "Ricardo Alexandre", "Ricardo Ferreira", `"Richard "Skippy' Spurr"`,
      "Rob Ryan", "Salvatore Zerbo", "Saverio Cordiano", "Scott Mckenzie", "Shashi P",
      "Sheene Ralspunsky", "Sir Stephen Beddows (God)", "Steven Allington",
      "Stuart Monteith", "Tharanidharan", "The Godfather", "The Special Gyan",
      "Vincenzo Martorano", "Walter Gogh", "Wayne Bullough", "Zé Quim", "feargal Hickey",
      "jay jones", "kevin mcgregor", "paddy d", "rOsS fAlCOn3r", "rob cast",
      "simon thomas", "yamil Mc02", "⍟Greg Bilboaツ", "⚽ FM", "Landucci", "Murilo",
      "The ⭐⭐strongest⭐⭐",
    ],
    []
  );

  // shape: [{name, club, active:true}]
  const [validManagers, setValidManagers] = useState(
    fallbackNames.map((n) => ({ name: n, club: "", active: true }))
  );

  // Fetch managers from Netlify function (Managers sheet: Club | Manager | Active)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/managers");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const rows = Array.isArray(data?.managers) ? data.managers : [];
        // clean + dedupe by (name|club), only active === true
        const seen = new Set();
        const clean = rows
          .filter((r) => r && r.name)
          .map((r) => ({
            name: String(r.name).trim(),
            club: String(r.club || "").trim(),
            active: Boolean(r.active),
          }))
          .filter((r) => r.active)
          .filter((r) => {
            const key = (r.name + "|" + r.club).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        if (clean.length) setValidManagers(clean);
      } catch (_) {
        // stay on fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------- Derived ----------------
  const votingClosed = useMemo(
    () => new Date() > new Date(votingDeadline),
    [votingDeadline]
  );

  // Auto-show results for everyone after deadline
  useEffect(() => {
    if (votingClosed) setResults(true);
  }, [votingClosed]);

  // ---------------- Categories ----------------
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
            achievement: "Treble Winner (D1 + SMFA Champions Cup + Charity Shield)",
            description: "Only manager to win multiple major trophies in S25",
          },
          {
            id: "david_marsden",
            name: "David Marsden",
            club: "Hamburger SV",
            achievement: "Greatest Transformation (+16 VA - Highest in all divisions)",
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
            description: "Successfully defended title, only multiple trophy winner",
          },
          {
            id: "scott_mckenzie_d1",
            name: "Scott Mckenzie",
            club: "São Paulo FC",
            achievement: "Top Statistical Performer (+11 VA, +3 PVA)",
            description: "Predicted 15th → finished 4th, incredible transformation",
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
            description: "Extraordinary turnaround: predicted 17th → title (+16 VA)",
          },
          {
            id: "greg_bilboatu_d2",
            name: "⍟Greg Bilboaţu",
            club: "Dinamo Zagreb",
            achievement: "3rd place; top statistical performance",
            description: "Predicted 16th → 3rd (+13 VA); narrowly missed auto-promo",
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
            description: "Comeback from bottom into promotion—underdog story",
          },
          {
            id: "jamie_rune_d3",
            name: "Jamie ᚺ",
            club: "FC Augsburg",
            achievement: "3rd place; exceptional stats",
            description: "Pred 13th → 3rd (+10 VA); outstanding tactical management",
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
            description: "Pred 14th → 2nd; huge overperformance to auto-promo",
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
            description: "Pred 17th → top VA (+13) despite playoff exit",
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
            description: "Pred 9th → clear title (+8 VA) and best stats",
          },
          {
            id: "bruno_neto_d5",
            name: "Bruno Neto^^",
            club: "Olympique Lyonnais",
            achievement: "Runner-up; exceptional stats",
            description: "Pred 15th → 2nd (+13 VA); narrow miss for title",
          },
          {
            id: "marian_moise_d5",
            name: "Marian Moise",
            club: "Newcastle United",
            achievement: "Play-off Winner (promotion secured)",
            description: "Pred 11th → promoted via playoffs (+6 VA)",
          },
          {
            id: "wayne_bullough_d5",
            name: "Wayne Bullough",
            club: "Athletic Club",
            achievement: "Highest individual overperformance",
            description: "Pred 20th → massive +14 VA; long-term build paying off",
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
            description: "Won elite European competition alongside league success",
          },
          {
            id: "adam_cups",
            name: "Adam",
            club: "Barcelona",
            achievement: "World Club Cup + Youth Cup Winner",
            description: "Double cup success across senior and youth competitions",
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

  // ---------------- Utility for duplicates ----------------
  const findMatchesByName = (name) =>
    validManagers.filter(
      (m) => m.name && m.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const findCanonicalManager = (name, clubOptional) => {
    const matches = findMatchesByName(name);
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    if (!clubOptional) return "AMBIGUOUS";
    const byClub = matches.find(
      (m) => (m.club || "").trim().toLowerCase() === clubOptional.trim().toLowerCase()
    );
    return byClub || null;
  };

  const keyFor = (name, club) =>
    `${String(name).trim()}|${String(club || "").trim()}`.toLowerCase();

  // ---------------- Actions / Admin helpers ----------------
  const handleResetAllVotes = async () => {
    if (!isAdmin) return;
    if (!confirm("This will clear ALL votes. Proceed?")) return;

    setAllVotes({});
    setVoterNames({});
    setVotes({});
    setVotingComplete({});

    try {
      await fetch("/api/reset-votes", { method: "POST" }); // optional function
    } catch (_) {}
  };

  // Login / Logout
  const login = (rawName, rawClub) => {
    setVerificationError("");

    const name = (rawName || "").trim();
    const club = (rawClub || "").trim();

    if (!name) {
      setVerificationError("Please enter a manager name");
      return;
    }

    const match = findCanonicalManager(name, club || undefined);
    if (match === "AMBIGUOUS") {
      setNeedsClub(true);
      setVerificationError("Multiple managers share this name — please pick the correct club.");
      return;
    }
    if (!match) {
      setVerificationError(`"${name}" is not found in the active Top 100 manager database.`);
      return;
    }

    const isAdminName = ADMIN_USERS.some(
      (a) => a.toLowerCase() === match.name.toLowerCase()
    );
    if (votingClosed && !isAdminName) {
      const d = new Date(votingDeadline);
      setVerificationError(
        `Voting closed on ${d.toLocaleDateString()}. Contact admin if you need assistance.`
      );
      return;
    }

    setCurrentManager(match.name);
    setCurrentClub(match.club || "");
    setIsLoggedIn(true);
    setIsAdmin(isAdminName);
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

  // ---------------- Voting ----------------
  const submitVote = async (category, nomineeId) => {
    if (!currentManager || votingClosed) return;

    const managerKey = keyFor(currentManager, currentClub);

    // local UI update
    setVotes((p) => ({ ...p, [category]: nomineeId }));
    setVotingComplete((p) => ({ ...p, [category]: true }));

    // aggregate
    setAllVotes((prev) => ({
      ...prev,
      [managerKey]: { ...(prev[managerKey] || {}), [category]: nomineeId },
    }));
    setVoterNames((prev) => ({
      ...prev,
      [`${category}_${nomineeId}`]: [
        ...(prev[`${category}_${nomineeId}`] || []),
        { name: `${currentManager}${currentClub ? ` (${currentClub})` : ""}`, timestamp: new Date().toISOString() },
      ],
    }));

    // persist to backend
    try {
      const nomineeObj = categories[category]?.nominees?.find((n) => n.id === nomineeId);
      const nomineeName = nomineeObj ? nomineeObj.name : nomineeId;

      await fetch("/api/submit-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manager: currentManager,
          club: currentClub || "",
          category,
          nomineeId,
          nomineeName,
          season: selectedSeason,
        }),
      });
    } catch (_) {}
  };

  const removeVote = (category, nomineeId, displayName) => {
    if (!isAdmin) return;

    setVoterNames((prev) => ({
      ...prev,
      [`${category}_${nomineeId}`]: (prev[`${category}_${nomineeId}`] || []).filter(
        (v) => v.name !== displayName
      ),
    }));

    // remove from allVotes too (best-effort — displayName may include club)
    setAllVotes((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((mk) => {
        if (next[mk]?.[category] === nomineeId) {
          delete next[mk][category];
          if (Object.keys(next[mk]).length === 0) delete next[mk];
        }
      });
      return next;
    });
  };

  const getVoteCount = (category, nomineeId) => {
    let c = 0;
    Object.values(allVotes).forEach((mv) => {
      if (mv[category] === nomineeId) c++;
    });
    return c;
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

// ---------------- Render ----------------
  return isLoggedIn ? (
    // ---------- LOGGED-IN UI ----------
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Season 25 Manager Awards</h1>
                <p className="text-sm text-gray-300">
                  Voting as: {currentManager}
                  {currentClub ? ` (${currentClub})` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-yellow-300">
                <Calendar className="w-4 h-4 inline mr-1" />
                {getTimeRemaining()}
              </div>

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

              <div className="text-sm text-gray-300">
                <Users className="w-4 h-4 inline mr-1" />
                {Object.keys(allVotes).length} managers voted
              </div>

              {isAdmin && (
                <>
                  <button
                    onClick={async () => {
                      // simple JSON export of in-memory tallies
                      const data = {};
                      Object.keys(categories).forEach((cat) => {
                        data[cat] = {};
                        categories[cat].nominees.forEach((n) => {
                          const vc = getVoteCount(cat, n.id);
                          const voters = voterNames[`${cat}_${n.id}`] || [];
                          data[cat][n.name] = { votes: vc, voters };
                        });
                      });
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${selectedSeason}-voting-results.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>

                  <button
                    onClick={handleResetAllVotes}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    Reset All Votes
                  </button>

                  <span className="text-xs text-orange-300 flex items-center gap-1 px-2">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
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
        {/* Category Nav */}
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

                return (
                  <div
                    key={nominee.id}
                    className={`bg-white/5 border rounded-lg p-4 transition-all cursor-pointer hover:bg-white/10 ${
                      isVoted
                        ? "border-green-400 bg-green-500/20"
                        : "border-white/20 hover:border-white/40"
                    } ${
                      votingClosed ? "cursor-not-allowed opacity-75" : ""
                    }`}
                    onClick={() => !votingClosed && submitVote(activeCategory, nominee.id)}
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
  ) : (
    // ---------- LOGIN VIEW ----------
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{selectedSeason}</h1>
          <h2 className="text-lg text-gray-200">Manager of the Season Voting</h2>

<div className="text-sm text-yellow-300 flex items-center gap-2">
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