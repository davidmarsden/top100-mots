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

const fmtDate = (iso) => new Date(iso).toLocaleString();

const ADMIN_USERS = ["David Marsden", "Regan Thompson"];

const norm = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const isAdminName = (name) => ADMIN_USERS.some((a) => norm(a) === norm(name));

const FALLBACK_ACTIVE_MANAGER_NAMES = [
  "ANMOL SATAM",
  "Adam",
  "Alessandro Ioli",
  "Alessio ”Main Event” T.",
  "Alexandre Costa",
  "Andrew Kelly",
  "André Guerra",
  "Anthony Guardiola",
  "Armando Pierone",
  "Ash L",
  "Bojan H",
  "Brian Gallucci",
  "Carl Martin",
  "Carlos Azevedo",
  "Carlos Miranda",
  "Chris Baggio",
  "Chris East",
  "Chris Meida",
  "Chris Taylor",
  "Daniel N.Ferreira",
  "David Inglis",
  "David Marsden",
  "Davy Vandendriessche",
  "Enzo T",
  "Francesco Garofalo",
  "Francesco Senesi",
  "Frank Hirst",
  "Gav Harmer",
  "Gianluca Ghio",
  "Glen Mullan",
  "Golden Bear",
  "Gursimran Brar",
  "Heath Brown",
  "Hugo Costa",
  "Hussain Saif",
  "Ignazio Barraco",
  "James Mckenzie",
  "Jamie Alldridge",
  "Jay Jones",
  "Jerod Ramnarine",
  "Jibriil Mohamed",
  "Josh McMillan",
  "João Rocha",
  "Kevin Trapp",
  "Landucci",
  "Luciano Catalano",
  "Marc Ques",
  "Marco G",
  "Marian Moise",
  "Mark Deadman",
  "Melvin Udall 5️⃣3️⃣",
  "Mister TRX",
  "Mohammed Ajmal",
  "Neil Frankland",
  "Noisy Steve",
  "Nuno Marques",
  "Pane Trifunov",
  "Paolo Everland",
  "Paul Masters",
  "Paul Rimmer",
  "Paulo Lopes",
  "Pedro Vilar",
  "Regan Thompson",
  "Ricardo Ferreira",
  "Ricardo Alexandre",
  "Rob Ryan",
  "Salvatore Zerbo",
  "Saverio Cordiano",
  "Scott Mckenzie",
  "Shashi P",
  "Steven Allington",
  "Stuart Monteith",
  "The FM",
  "The Godfather",
  "The Special Gyan",
  "Tommaso Mello",
  "Tonian McGoogan",
  "Valter Martins",
  "Walter Gogh",
  "Wayne Bullough",
  "feargal Hickey",
  "john vinicombe",
  "paddy d",
  "rob cast",
  "simon thomas",
  "yamil Mc02",
  "⍟Greg Bilboaツ",
  "Bruno Neto^^",
  "Dario Saviano",
  "Dave Oz Osborne",
  "Everton Luiz",
  "RJ Alston",
  "Sheene Ralspunsky",
  "Zé Quim",
  "kevin mcgregor",
  "Gregg Robinson",
  "Luís André Libras-Boas",
  "Sir Stephen Beddows (God)",
  "rOsS fAlCOn3r",
];

const utcIsoToLondonInputValue = (utcIso) => {
  if (!utcIso || Number.isNaN(Date.parse(utcIso))) return "";

  const d = new Date(utcIso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (t) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

const londonInputValueToUtcIso = (inputValue) => {
  if (!inputValue) return "";

  const [datePart, timePart] = inputValue.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);

  const utcGuess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));

  const londonParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(utcGuess);

  const get = (type) => londonParts.find((p) => p.type === type)?.value || "00";
  const ly = Number(get("year"));
  const lm = Number(get("month"));
  const ld = Number(get("day"));
  const lhh = Number(get("hour"));
  const lmm = Number(get("minute"));
  const lss = Number(get("second"));

  const intendedLondonAsUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
  const actualLondonAsUtc = Date.UTC(ly, lm - 1, ld, lhh, lmm, lss);
  const offsetMs = actualLondonAsUtc - intendedLondonAsUtc;

  return new Date(utcGuess.getTime() - offsetMs).toISOString();
};

export default function VotingApp() {
  const [selectedSeason] = useState("S27");

  const [currentManager, setCurrentManager] = useState("");
  const [currentClub, setCurrentClub] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [votes, setVotes] = useState({});
  const [votingComplete, setVotingComplete] = useState({});
  const [results, setResults] = useState(false);
  const [activeCategory, setActiveCategory] = useState("overall");
  const [verificationError, setVerificationError] = useState("");

  const [remoteTallies, setRemoteTallies] = useState(null);
  const [talliesLoading, setTalliesLoading] = useState(false);

  const [votingDeadline, setVotingDeadline] = useState(null);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  const [allVotes, setAllVotes] = useState({});
  const [voterNames, setVoterNames] = useState({});

  const fallbackManagers = useMemo(
    () =>
      FALLBACK_ACTIVE_MANAGER_NAMES.filter(Boolean).map((n) => ({
        club: "",
        name: n,
        active: true,
      })),
    []
  );

  const [validManagers, setValidManagers] = useState(fallbackManagers);

  const [nameInput, setNameInput] = useState("");
  const [clubInput, setClubInput] = useState("");
  const [needsClub, setNeedsClub] = useState(false);

  useEffect(() => {
    fetch("/api/deadline")
      .then((r) => r.json())
      .then((d) => {
        if (d?.deadline) setVotingDeadline(d.deadline);
      })
      .catch(() => {});
  }, []);

  const isValidDeadline = useMemo(() => {
    return !!votingDeadline && !Number.isNaN(Date.parse(votingDeadline));
  }, [votingDeadline]);

  const rawVotingClosed = useMemo(() => {
    if (!isValidDeadline) return false;
    return Date.now() > Date.parse(votingDeadline);
  }, [isValidDeadline, votingDeadline]);

  const votingClosed = rawVotingClosed && !isAdmin;

  useEffect(() => {
    if (rawVotingClosed) setResults(true);
  }, [rawVotingClosed]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/managers");
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok || !Array.isArray(data?.managers)) return;

        const seen = new Set();
        const clean = data.managers
          .map((m) => ({
            club: (m.club || "").toString().trim(),
            name: (m.name || "").toString().trim(),
            active: !!m.active,
          }))
          .filter((m) => m.name && m.active)
          .filter((m) => {
            const key = `${norm(m.name)}|${norm(m.club)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        if (!cancelled && clean.length) setValidManagers(clean);
      } catch {
        // keep fallback list
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fallbackManagers]);

const norm = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[“”"‘’']/g, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ");

  const findMatchesByName = (name) =>
    validManagers.filter((m) => m.name && norm(m.name) === norm(name));

  const findCanonicalManager = (name, clubOptional) => {
    const matches = findMatchesByName(name);
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    if (!clubOptional) return "AMBIGUOUS";
    return matches.find((m) => norm(m.club) === norm(clubOptional)) || null;
  };

  const refreshTallies = async () => {
    try {
      setTalliesLoading(true);
      const r = await fetch(`/api/results?season=${selectedSeason}`);
      const j = await r.json();
      if (j?.ok && j?.tallies) setRemoteTallies(j.tallies);
    } catch {
      // ignore
    } finally {
      setTalliesLoading(false);
    }
  };

  useEffect(() => {
    if (!(results || rawVotingClosed)) return;
    refreshTallies();
    const id = setInterval(refreshTallies, 15000);
    return () => clearInterval(id);
  }, [results, rawVotingClosed, selectedSeason]);

const categories = useMemo(
  () => ({
    overall: {
      title: "Overall Manager of the Season",
      icon: Trophy,
      nominees: [
        {
          id: "james_mckenzie",
          name: "James Mckenzie",
          club: "Chelsea",
          achievement: "Division 1 Champions",
          description:
            "Won a sixth D1 title, his first since S21. Now only two behind Scott Mckenzie’s record of eight.",
        },
        {
          id: "ash_l",
          name: "Ash L",
          club: "Leicester City",
          achievement: "SMFA Cup + World Club Cup double winners",
          description:
            "Finished 3rd in D1 after Leicester’s best-ever 2nd place last season, and added a major cup double.",
        },
        {
          id: "glen_mullan",
          name: "Glen Mullan",
          club: "RCD Espanyol",
          achievement: "Promoted + Youth Cup winners",
          description:
            "Predicted to be relegated, but won promotion and secured a second successive Youth Cup.",
        },
        {
          id: "chris_meida",
          name: "Chris Meida",
          club: "CSKA Moskva",
          achievement: "D1 survival against the odds",
          description:
            "Kept CSKA in Division 1 after two successive promotions.",
        },
        {
          id: "alessandro_ioli",
          name: "Alessandro Ioli",
          club: "Ajax",
          achievement: "D4 Champions + PVA leader",
          description:
            "Won Division 4 and topped the Positional Value Added table.",
        },
        {
          id: "marc_ques",
          name: "Marc Ques",
          club: "Rubin Kazan",
          achievement: "Playoff winners",
          description:
            "Completed a remarkable third successive promotion.",
        },
      ],
    },

    division1: {
      title: "Division 1 Manager of the Season",
      icon: Star,
      reviewUrl:
        "https://smtop100.blog/2026/06/13/season-27-division-1-stats-and-facts-review/",
      nominees: [
        {
          id: "james_mckenzie_d1",
          name: "James Mckenzie",
          club: "Chelsea",
          achievement: "Division 1 Champions",
          description:
            "Champions again. His sixth D1 title, and first since S21.",
        },
        {
          id: "chris_meida_d1",
          name: "Chris Meida",
          club: "CSKA Moskva",
          achievement: "D1 survival against the odds",
          description:
            "Kept CSKA in D1 after two successive promotions.",
        },
        {
          id: "ash_l_d1",
          name: "Ash L",
          club: "Leicester City",
          achievement: "SMFA Cup + World Club Cup double winners",
          description:
            "Also finished 3rd in D1 after Leicester’s best-ever 2nd place last season under Doug Earle.",
        },
        {
          id: "bojan_h_d1",
          name: "Bojan H",
          club: "Bayern München",
          achievement: "Cup winners",
          description:
            "Won his third Cup, and his first since S17.",
        },
      ],
    },

    division2: {
      title: "Division 2 Manager of the Season",
      icon: Award,
      reviewUrl:
        "https://smtop100.blog/2026/06/13/season-27-division-2-stats-and-facts-review/",
      nominees: [
        {
          id: "heath_brown_d2",
          name: "Heath Brown",
          club: "Arsenal",
          achievement: "Division 2 Champions",
          description: "Led Arsenal to the D2 title.",
        },
        {
          id: "glen_mullan_d2",
          name: "Glen Mullan",
          club: "RCD Espanyol",
          achievement: "Promoted + Youth Cup winners",
          description:
            "Predicted to be relegated, but won promotion and a second successive Youth Cup.",
        },
        {
          id: "gursimran_brar_d2",
          name: "Gursimran Brar",
          club: "1. FC Köln",
          achievement: "Playoff winners",
          description: "Won the playoffs to secure promotion.",
        },
        {
          id: "andrew_kelly_d2",
          name: "Andrew Kelly",
          club: "Stoke City",
          achievement: "Playoff finalists + Shield winners",
          description:
            "Reached the playoff final and added Shield success.",
        },
      ],
    },

    division3: {
      title: "Division 3 Manager of the Season",
      icon: Award,
      reviewUrl:
        "https://smtop100.blog/2026/06/14/season-27-division-3-stats-and-facts-review/",
      nominees: [
        {
          id: "greg_bilboa_d3",
          name: "⍟Greg Bilboaツ",
          club: "West Bromwich Albion",
          achievement: "Division 3 Champions",
          description: "Won the D3 title and secured automatic promotion.",
        },
        {
          id: "jerod_ramnarine_d3",
          name: "Jerod Ramnarine",
          club: "Galatasaray SK",
          achievement: "Playoff winners + PVA leader",
          description:
            "Predicted to be relegated, but won promotion and topped the Positional Value Added table.",
        },
      ],
    },

    division4: {
      title: "Division 4 Manager of the Season",
      icon: Award,
      reviewUrl:
        "https://smtop100.blog/2026/06/14/season-27-division-4-stats-and-facts-review/",
      nominees: [
        {
          id: "alessandro_ioli_d4",
          name: "Alessandro Ioli",
          club: "Ajax",
          achievement: "Division 4 Champions + PVA leader",
          description:
            "Won the D4 title and topped the Positional Value Added table.",
        },
        {
          id: "jay_jones_d4",
          name: "Jay Jones",
          club: "AS Monaco",
          achievement: "Playoff winners",
          description:
            "Won his fourth playoff final.",
        },
        {
          id: "bruno_neto_d4",
          name: "Bruno Neto^^",
          club: "Olympique Lyonnais",
          achievement: "Predicted relegation, finished 8th",
          description:
            "One of the biggest overachievement stories of the season.",
        },
      ],
    },

    division5: {
      title: "Division 5 Manager of the Season",
      icon: Award,
      reviewUrl:
        "https://smtop100.blog/2026/06/15/season-27-division-5-stats-and-facts-review/",
      nominees: [
        {
          id: "tonian_mcgoogan_d5",
          name: "Tonian McGoogan",
          club: "Valencia CF",
          achievement: "Division 5 Champions",
          description: "Led Valencia to the D5 title.",
        },
        {
          id: "wayne_bullough_d5",
          name: "Wayne Bullough",
          club: "Athletic Club",
          achievement: "Runners-up + PVA leader",
          description:
            "Finished second and topped the Positional Value Added table.",
        },
        {
          id: "marc_ques_d5",
          name: "Marc Ques",
          club: "Rubin Kazan",
          achievement: "Playoff winners",
          description:
            "Completed a remarkable third successive promotion.",
        },
      ],
    },
  }),
  []
);

  const handleResetAllVotes = async () => {
    if (!isAdmin) return;
    if (!confirm("This will clear ALL local votes (UI only). Proceed?")) return;

    setAllVotes({});
    setVoterNames({});
    setVotes({});
    setVotingComplete({});

    try {
      await fetch("/api/reset-votes", { method: "POST" });
    } catch {}
  };

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

    const admin = isAdminName(match.name);

    setCurrentManager(match.name);
    setCurrentClub(match.club || "");
    setIsLoggedIn(true);
    setIsAdmin(admin);

    if (rawVotingClosed) setResults(true);
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

  const submitVote = (category, nomineeId) => {
    if (!isLoggedIn || !currentManager) return;
    if (rawVotingClosed && !isAdmin) return;

    setVotes((prev) => ({ ...prev, [category]: nomineeId }));
    setVotingComplete((prev) => ({ ...prev, [category]: true }));

    setAllVotes((prev) => ({
      ...prev,
      [currentManager]: { ...(prev[currentManager] || {}), [category]: nomineeId },
    }));

    setVoterNames((prev) => {
      const next = { ...prev };
      const prevChoice = votes[category];

      if (prevChoice) {
        const kOld = `${category}_${prevChoice}`;
        next[kOld] = (next[kOld] || []).filter((v) => v.name !== currentManager);
      }

      const kNew = `${category}_${nomineeId}`;
      next[kNew] = [
        ...(next[kNew] || []),
        { name: currentManager, timestamp: new Date().toISOString() },
      ];

      return next;
    });

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
      })
        .then(() => refreshTallies())
        .catch(() => {});
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
  };

  const getVoteCount = (category, nomineeId) => {
    const rt = remoteTallies?.[category]?.[nomineeId]?.votes;
    if (typeof rt === "number") return rt;

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

  const getTimeRemaining = () => {
    if (!isValidDeadline) return "Deadline not set";

    const now = Date.now();
    const deadline = Date.parse(votingDeadline);
    const diff = deadline - now;

    if (diff <= 0) return "Voting Closed";

    const MIN = 1000 * 60;
    const HOUR = MIN * 60;
    const DAY = HOUR * 24;

    const days = Math.floor(diff / DAY);
    const hours = Math.floor((diff % DAY) / HOUR);
    const minutes = Math.floor((diff % HOUR) / MIN);

    return `${days}d ${hours}h ${minutes}m remaining`;
  };

if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">{selectedSeason}</h1>
            <h2 className="text-lg text-gray-200">Manager of the Season Voting</h2>

            <div className="mt-2 text-sm text-yellow-300 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 inline" />
              {getTimeRemaining()}
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
                  if (e.key === "Enter") login(nameInput, clubInput);
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
                    if (e.key === "Enter") login(nameInput, clubInput);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Season 27 Manager Awards</h1>
                <p className="text-sm text-gray-300">
                  Voting as: {currentManager}
                  {currentClub ? ` (${currentClub})` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="text-sm text-yellow-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 inline" />
                {getTimeRemaining()}

                {isAdmin && (
                  !isEditingDeadline ? (
                    <button
                      onClick={() => setIsEditingDeadline(true)}
                      className="ml-2 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                    >
                      Edit deadline
                    </button>
                  ) : (
                    <>
                      <input
                        type="datetime-local"
                        value={isValidDeadline ? utcIsoToLondonInputValue(votingDeadline) : ""}
                        onChange={(e) => {
                          const utc = londonInputValueToUtcIso(e.target.value);
                          if (utc) setVotingDeadline(utc);
                        }}
                        className="ml-2 bg-black/30 border border-white/20 rounded px-2 py-1 text-white"
                      />

                      <button
                        onClick={async () => {
                          setIsEditingDeadline(false);

                          try {
                            await fetch("/api/deadline", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                "x-admin-token": import.meta.env.VITE_ADMIN_TOKEN,
                              },
                              body: JSON.stringify({ deadline: votingDeadline }),
                            });
                          } catch {}
                        }}
                        className="px-2 py-1 rounded bg-green-500/30 hover:bg-green-500/40 text-green-100"
                      >
                        Done
                      </button>
                    </>
                  )
                )}
              </div>

              {!rawVotingClosed ? (
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

              {(results || rawVotingClosed) && (
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
                    title="Reset local UI votes"
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

      <div className="max-w-6xl mx-auto px-4 py-6">
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

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 border-b border-white/10">
            <div className="flex items-start gap-3">
  {React.createElement(categories[activeCategory].icon, {
    className: "w-6 h-6 text-yellow-400 mt-1",
  })}

  <div>
    <h2 className="text-2xl font-bold text-white">
      {categories[activeCategory].title}
    </h2>

    {categories[activeCategory].reviewUrl && (
      <a
        href={categories[activeCategory].reviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-yellow-300 underline hover:text-yellow-200"
      >
        View stats, facts & PVA table
      </a>
    )}
  </div>
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
              {categories[activeCategory].nominees
  .map((nominee) => {
    const voteCount = getVoteCount(activeCategory, nominee.id);

    return {
      ...nominee,
      voteCount,
    };
  })
  .sort((a, b) => {
    if (!(results || rawVotingClosed)) return 0;
    return b.voteCount - a.voteCount;
  })
  .map((nominee) => {
    const isVoted = votes[activeCategory] === nominee.id;

    const voteCount = nominee.voteCount;
    const totalVotes = getTotalVotes(activeCategory);
    const percentage =
      totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;

    const sortedNominees = [...categories[activeCategory].nominees]
      .map((n) => ({
        ...n,
        voteCount: getVoteCount(activeCategory, n.id),
      }))
      .sort((a, b) => b.voteCount - a.voteCount);

    const rank =
      (results || rawVotingClosed) && voteCount > 0
        ? sortedNominees.findIndex((n) => n.id === nominee.id) + 1
        : null;

    const isWinner = rank === 1;
    const isRunnerUp = rank === 2;
    const isThird = rank === 3;
    const isOverall = activeCategory === "overall";

    const disabled = rawVotingClosed && !isAdmin;

    return (
                  <div
  key={nominee.id}
  className={`relative bg-white/5 border rounded-lg p-4 transition-all ${
    isWinner
      ? isOverall
        ? "border-yellow-300 bg-yellow-500/10 shadow-[0_0_34px_rgba(250,204,21,0.45)] animate-[championGlow_4s_ease-in-out_infinite]"
        : "border-yellow-300 bg-yellow-500/10 shadow-[0_0_24px_rgba(250,204,21,0.35)] animate-[championGlow_4s_ease-in-out_infinite]"
      : isRunnerUp
      ? "border-slate-300/80 bg-slate-300/10 shadow-[0_0_18px_rgba(203,213,225,0.22)]"
      : isThird
      ? "border-orange-300/70 bg-orange-500/10 shadow-[0_0_18px_rgba(251,146,60,0.2)]"
      : isVoted
      ? "border-green-400 bg-green-500/20"
      : "border-white/20 hover:border-white/40"
  } ${disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer hover:bg-white/10"}`}
  onClick={() => !disabled && submitVote(activeCategory, nominee.id)}
>
  {isWinner && (
    <div className="absolute -top-2 -right-2 z-20 rotate-6 rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 px-4 py-1 text-xs font-black text-black shadow-xl border border-yellow-200">
      {isOverall ? "👑 MANAGER OF THE SEASON" : "🏆 WINNER"}
    </div>
  )}

  {isRunnerUp && (
    <div className="absolute -top-2 -right-2 z-20 rotate-6 rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 px-4 py-1 text-xs font-black text-black shadow-xl border border-slate-100">
      🥈 RUNNER-UP
    </div>
  )}

  {isThird && (
    <div className="absolute -top-2 -right-2 z-20 rotate-6 rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-600 px-4 py-1 text-xs font-black text-black shadow-xl border border-orange-200">
      🥉 THIRD
    </div>
  )}

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

                    {(results || rawVotingClosed) && (
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