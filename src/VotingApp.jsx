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

// ---- Admins ----
const ADMIN_USERS = ["David Marsden", "Regan Thompson"];

/**
 * Build a canonical key (name|club) lowercase for exact matching
 */
const canonicalKey = (name, club) =>
  `${(name || "").trim().toLowerCase()}|${(club || "").trim().toLowerCase()}`;

/**
 * Deduplicate array of strings case-insensitively while preserving first-cased version
 */
const uniqCaseInsensitive = (arr) => {
  const seen = new Set();
  const out = [];
  for (const s of arr) {
    const v = (s || "").toString().trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
};

export default function VotingApp() {
  // ---- State ----
  const [currentManager, setCurrentManager] = useState("");
  const [currentClub, setCurrentClub] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [clubInput, setClubInput] = useState("");
  const [needsClub, setNeedsClub] = useState(false);

  const [votes, setVotes] = useState({}); // per-user selection in UI
  const [activeCategory, setActiveCategory] = useState("overall");
  const [results, setResults] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [selectedSeason] = useState("S25");

  // Default to a near-future ISO (UTC) – can be edited by admin
  const [votingDeadline, setVotingDeadline] = useState("2025-09-15T23:59:59");
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  // Persist deadline
  useEffect(() => {
    const saved = localStorage.getItem("votingDeadline");
    if (saved) setVotingDeadline(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("votingDeadline", votingDeadline);
  }, [votingDeadline]);

  // Simulated aggregate stores (also mirrored to Google Sheets via functions)
  const [allVotes, setAllVotes] = useState({}); // { 'name|club': { overall: 'id', ... } }
  const [voterNames, setVoterNames] = useState({}); // { `${cat}_${id}`: [ { name, club, timestamp } ] }

  // Client-side “closed” flag (still enforce server-side in functions)
  const votingClosed = useMemo(
    () => new Date() > new Date(votingDeadline),
    [votingDeadline]
  );

  // ---- Managers (fallback list) ----
  const fallbackManagers = useMemo(
    () =>
      uniqCaseInsensitive([
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
        "Dan Wallace",
        "Daniel N.Ferreira",
        "Dario Saviano",
        "Dave Oz Osborne",
        "David Inglis",
        "David Marsden",
        "Davy Vandendriessche",
        "Doug Earle",
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
        "Mike Scallotti",
        "Mister TRX",
        "Mohammed Ajmal",
        "Neil Frankland",
        "Noisy Steve",
        "Nuno Marques",
        "Pane Trifunov",
        "Paolo Everland",
        "Patrik Breznický",
        "Paul Masters",
        "Paul Rimmer",
        "Paulo Lopes",
        "Pedro Vilar",
        "RJ Alston",
        "Regan Thompson",
        "Ricardo Alexandre",
        "Ricardo Ferreira",
        `"Richard ""Skippy' Spurr"`,
        "Rob Ryan",
        "Salvatore Zerbo",
        "Saverio Cordiano",
        "Scott Mckenzie",
        "Shashi P",
        "Sheene Ralspunsky",
        "Sir Stephen Beddows (God)",
        "Steven Allington",
        "Stuart Monteith",
        "Tharanidharan",
        "The Godfather",
        "The Special Gyan",
        "Vincenzo Martorano",
        "Walter Gogh",
        "Wayne Bullough",
        "Zé Quim",
        "feargal Hickey",
        "jay jones",
        "kevin mcgregor",
        "paddy d",
        "rOsS fAlCOn3r",
        "rob cast",
        "simon thomas",
        "yamil Mc02",
        "⍟Greg Bilboaツ",
        "⚽ FM",
        "Landucci",
        "Murilo",
        "The ⭐⭐strongest⭐⭐",
      ]),
    []
  );

  // `validManagers` structure [{ name, club, active: true }]
  const [validManagers, setValidManagers] = useState(
    fallbackManagers.map((name) => ({ name, club: "", active: true }))
  );

  // Try to hydrate from Google Sheets (Managers sheet with columns: Club, Manager, Active)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/managers");
        if (!res.ok) return;
        const data = await res.json();
        // Expected: { managers: [ { club, name, active }, ... ] }
        if (!cancelled && Array.isArray(data?.managers) && data.managers.length) {
          const cleaned = data.managers
            .map((m) => ({
              name: (m?.name || "").toString().trim(),
              club: (m?.club || "").toString().trim(),
              active:
                String(m?.active || "")
                  .toLowerCase()
                  .trim() === "true",
            }))
            .filter((m) => m.name && m.active);
          setValidManagers(cleaned);
        }
      } catch {
        // keep fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackManagers]);

  // Helper: all entries for a given name (case-insensitive)
  const findMatchesByName = (name) =>
    validManagers.filter(
      (m) =>
        m.name &&
        m.name.trim().toLowerCase() === (name || "").trim().toLowerCase() &&
        m.active
    );

  // Helper: disambiguate by name + optional club
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

  // If an admin is typing their name on the login screen, allow editing there
  const adminTyping = ADMIN_USERS.some(
    (u) => u.toLowerCase() === (nameInput || "").trim().toLowerCase()
  );

  // ---- Categories ----
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

// ---- Login / Logout / Reset ----
  const handleResetAllVotes = async () => {
    if (!isAdmin) return;
    if (!confirm("This will clear ALL votes. Proceed?")) return;

    // Clear local UI state
    setAllVotes({});
    setVoterNames({});
    setVotes({});

    // Optional: clear the sheet via a function if you add one
    try {
      await fetch("/api/reset-votes", { method: "POST" });
    } catch (_) {}
  };

  const login = (rawName, rawClub) => {
    setVerificationError("");

    const name = (rawName || "").trim();
    const club = (rawClub || "").trim();

    if (!name) {
      setVerificationError("Please enter a manager name");
      return;
    }

    // Allow login even if closed (so they can still view results)
    // But you could block here if you prefer.
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
    setResults(false);
    setVerificationError("");
    setNameInput("");
    setClubInput("");
    setNeedsClub(false);
  };

  // ---- Voting ----
  const submitVote = (category, nomineeId) => {
    // allow overwriting votes until deadline (after deadline, block non-admins)
    if (!isLoggedIn) return;
    if (votingClosed && !isAdmin) return;

    const key = canonicalKey(currentManager, currentClub);

    // Update per-user category pick
    setVotes((prev) => ({ ...prev, [category]: nomineeId }));

    // Update aggregate store keyed by canonical manager key
    setAllVotes((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [category]: nomineeId },
    }));

    // Update voter list for this nominee
    setVoterNames((prev) => ({
      ...prev,
      [`${category}_${nomineeId}`]: [
        ...(prev[`${category}_${nomineeId}`] || []).filter(
          (v) => canonicalKey(v.name, v.club) !== key
        ),
        { name: currentManager, club: currentClub, timestamp: new Date().toISOString() },
      ],
    }));

    // Persist to backend (append to Google Sheet)
    try {
      const nomineeObj = categories[category]?.nominees?.find((n) => n.id === nomineeId);
      const nomineeName = nomineeObj ? nomineeObj.name : nomineeId;

      fetch("/api/submit-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manager: currentManager,
          club: currentClub,
          category,
          nomineeId,
          nomineeName,
          season: selectedSeason,
        }),
      }).catch(() => {});
    } catch (_) {
      // no-op
    }
  };

  const removeVote = (category, nomineeId, voterName, voterClub) => {
    if (!isAdmin) return;

    const key = canonicalKey(voterName, voterClub);

    setVoterNames((prev) => ({
      ...prev,
      [`${category}_${nomineeId}`]: (prev[`${category}_${nomineeId}`] || []).filter(
        (v) => canonicalKey(v.name, v.club) !== key
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
    // fetch("/api/remove-vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ manager: voterName, club: voterClub, category, nomineeId, season: selectedSeason }) });
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
    Object.values(allVotes).forEach((managerVotes) => {
      if (managerVotes[category] === nomineeId) count++;
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

  // When voting closes, auto-show results for everyone
  useEffect(() => {
    if (votingClosed) setResults(true);
  }, [votingClosed]);

// ---- UI ----
  if (isLoggedIn) {
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
                  <h1 className="text-xl font-bold text-white">Season 25 Manager Awards</h1>
                  <p className="text-sm text-gray-300">
                    Voting as: {currentManager}
                    {currentClub ? ` (${currentClub})` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-yellow-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 inline" />
                  {getTimeRemaining()}

                  {isAdmin &&
                    (!isEditingDeadline ? (
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
                    ))}
                </div>

                {/* Results toggle or auto message */}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportResults}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={handleResetAllVotes}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg transition-colors"
                      title="Admin: reset ALL votes"
                    >
                      Reset
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
              const isPicked = !!votes[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeCategory === key
                      ? "bg-yellow-500 text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  } ${isPicked ? "ring-2 ring-green-400" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  {category.title}
                  {isPicked && <CheckCircle className="w-4 h-4 text-green-400" />}
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
              {votes[activeCategory] && (
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
                      } ${votingClosed && !isAdmin ? "cursor-not-allowed opacity-75" : ""}`}
                      onClick={() => {
                        if (votingClosed && !isAdmin) return;
                        submitVote(activeCategory, nominee.id);
                      }}
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
                                {(voterNames[`${activeCategory}_${nominee.id}`] || []).map(
                                  (v) => (
                                    <div
                                      key={`${v.name}-${v.club}-${v.timestamp}`}
                                      className="flex items-center justify-between gap-2 bg-white/5 px-2 py-1 rounded"
                                    >
                                      <span className="truncate">
                                        {v.name}
                                        {v.club ? ` (${v.club})` : ""}
                                      </span>
                                      <span className="opacity-70">{fmtDate(v.timestamp)}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeVote(activeCategory, nominee.id, v.name, v.club);
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
    );
  }

  // ---------- LOGIN VIEW ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{selectedSeason}</h1>
          <h2 className="text-lg text-gray-200">Manager of the Season Voting</h2>

          <div className="text-sm text-yellow-300 flex items-center gap-2 justify-center mt-2">
            <Calendar className="w-4 h-4 inline" />
            {getTimeRemaining()}

            {(isAdmin || ADMIN_USERS.some(
              (u) => u.toLowerCase() === (nameInput || "").trim().toLowerCase()
            )) &&
              (!isEditingDeadline ? (
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
              ))}
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