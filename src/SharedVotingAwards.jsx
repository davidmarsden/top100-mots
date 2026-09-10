import React, { useEffect, useMemo, useState } from "react";
import { Award, CheckCircle, Lock, Trophy } from "lucide-react";
import { hasSharedVotingConfig, sharedVoting } from "./sharedVotingClient.js";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "Not set";

export default function SharedVotingAwards() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [ballots, setBallots] = useState({});
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSharedVotingConfig || !sharedVoting) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    sharedVoting.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session || null);
    });
    const { data: listener } = sharedVoting.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      setAccount(null);
      setEvents([]);
      return;
    }
    loadAwards();
  }, [session?.user?.id]);

  const questionsByEvent = useMemo(() => {
    const map = new Map();
    questions.forEach((question) => {
      const list = map.get(question.event_id) || [];
      list.push(question);
      map.set(question.event_id, list);
    });
    return map;
  }, [questions]);

  const optionsByQuestion = useMemo(() => {
    const map = new Map();
    options.forEach((option) => {
      const list = map.get(option.question_id) || [];
      list.push(option);
      map.set(option.question_id, list);
    });
    return map;
  }, [options]);

  const activeEvent = events.find((event) => event.id === activeEventId) || events[0] || null;
  const eventQuestions = activeEvent ? questionsByEvent.get(activeEvent.id) || [] : [];
  const activeQuestion =
    eventQuestions.find((question) => question.id === activeQuestionId) || eventQuestions[0] || null;

  async function sendMagicLink(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const redirectTo = `${window.location.origin}/?shared-voting-v2=1`;
    const { error } = await sharedVoting.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    setMessage(error ? error.message : "Check your email for your secure Top 100 sign-in link.");
    setLoading(false);
  }

  async function loadAwards() {
    setLoading(true);
    setMessage("Loading Shared Voting V2…");

    const [accountResult, adminResult, eventResult] = await Promise.all([
      sharedVoting
        .from("manager_portal_accounts")
        .select("id, manager_id, active, managers(id, name, display_name)")
        .eq("auth_user_id", session.user.id)
        .eq("active", true)
        .maybeSingle(),
      sharedVoting.rpc("is_admin"),
      sharedVoting
        .from("voting_events")
        .select("*")
        .eq("event_type", "awards")
        .order("created_at", { ascending: false }),
    ]);

    if (accountResult.error) {
      setMessage(accountResult.error.message);
      setLoading(false);
      return;
    }

    const managerAccount = accountResult.data || null;
    setAccount(managerAccount);
    setIsAdmin(Boolean(adminResult.data));

    if (eventResult.error) {
      setMessage(eventResult.error.message);
      setLoading(false);
      return;
    }

    const eventRows = eventResult.data || [];
    setEvents(eventRows);
    if (!eventRows.length) {
      setQuestions([]);
      setOptions([]);
      setBallots({});
      setLoading(false);
      setMessage("No Shared Voting V2 Awards event exists yet.");
      return;
    }

    setActiveEventId((current) => current || eventRows[0].id);
    const eventIds = eventRows.map((row) => row.id);
    const questionResult = await sharedVoting
      .from("voting_questions")
      .select("*")
      .in("event_id", eventIds)
      .order("sort_order")
      .order("id");

    if (questionResult.error) {
      setMessage(questionResult.error.message);
      setLoading(false);
      return;
    }

    const questionRows = questionResult.data || [];
    setQuestions(questionRows);
    const questionIds = questionRows.map((row) => row.id);
    const optionResult = questionIds.length
      ? await sharedVoting
          .from("voting_options")
          .select("*")
          .in("question_id", questionIds)
          .order("sort_order")
          .order("id")
      : { data: [], error: null };

    if (optionResult.error) {
      setMessage(optionResult.error.message);
      setLoading(false);
      return;
    }
    setOptions(optionResult.data || []);

    const ballotMap = {};
    const answerMap = {};
    if (managerAccount) {
      for (const voteEvent of eventRows) {
        const { data, error } = await sharedVoting.rpc("get_my_voting_ballot", {
          target_event_id: voteEvent.id,
        });
        if (!error && data) {
          ballotMap[voteEvent.id] = data;
          (data.answers || []).forEach((answer) => {
            answerMap[answer.question_id] = answer.option_id;
          });
        }
      }
    }
    setBallots(ballotMap);
    setAnswers(answerMap);

    if (managerAccount) {
      setMessage(
        `Shared voting account verified as ${managerAccount.managers?.display_name || managerAccount.managers?.name || "manager"}.`
      );
    } else if (adminResult.data) {
      setMessage("Administrator access verified. An active manager account is still required to vote.");
    } else {
      setMessage("Your sign-in is valid, but it is not linked to an active Top 100 manager account.");
    }
    setLoading(false);
  }

  async function submitEventBallot(eventId) {
    if (!account) {
      setMessage("An active manager account is required to vote.");
      return;
    }
    const eventQuestionRows = questionsByEvent.get(eventId) || [];
    const payload = eventQuestionRows
      .filter((question) => answers[question.id])
      .map((question) => ({
        question_id: question.id,
        option_id: Number(answers[question.id]),
      }));

    const missingRequired = eventQuestionRows.some(
      (question) => question.required && !answers[question.id]
    );
    if (missingRequired) {
      setMessage("Please vote in every required Awards category before submitting.");
      return;
    }

    setMessage("Saving your Awards ballot…");
    const { error } = await sharedVoting.rpc("submit_voting_ballot", {
      target_event_id: eventId,
      answers: payload,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Awards ballot saved. You can change it until voting closes.");
    await loadAwards();
  }

  async function loadResults(eventId) {
    const { data, error } = await sharedVoting.rpc("get_voting_results", {
      target_event_id: eventId,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setResults((current) => ({ ...current, [eventId]: data || [] }));
  }

  async function finaliseAwards(eventId) {
    setMessage("Finalising Awards categories…");
    const { data, error } = await sharedVoting.rpc("finalise_awards_event", {
      target_event_id: eventId,
    });
    setMessage(error ? error.message : data?.decision_summary || "Awards event finalised.");
    if (!error) await loadAwards();
  }

  async function releaseResults(eventId) {
    setMessage("Releasing Awards results…");
    const { data, error } = await sharedVoting.rpc("release_voting_results", {
      target_event_id: eventId,
    });
    setMessage(error ? error.message : `Results released${data ? ` ${formatDate(data)}` : ""}.`);
    if (!error) await loadAwards();
  }

  async function logout() {
    await sharedVoting.auth.signOut();
    setMessage("Signed out.");
  }

  if (!hasSharedVotingConfig || !sharedVoting) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-white">
        <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-5">
          <strong>Shared Voting V2 is not configured.</strong>
          <p className="mt-2 text-sm text-gray-300">The Awards deployment needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto p-6 text-white">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4"><Trophy className="text-yellow-400" /><div><p className="uppercase tracking-widest text-xs text-green-300">Shared Voting V2 test</p><h1 className="text-3xl font-bold">Top 100 Awards</h1></div></div>
          <p className="text-gray-300 mb-6">Sign in with the same email address as your Top 100 Manager Portal account. Typed manager names are no longer used in this adapter.</p>
          <form onSubmit={sendMagicLink} className="space-y-4">
            <label className="block text-sm font-semibold">Email address<input className="mt-2 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-white" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <button className="w-full rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-400" type="submit" disabled={loading}>{loading ? "Sending…" : "Email me a secure sign-in link"}</button>
          </form>
          {message && <p className="mt-4 text-sm text-gray-300">{message}</p>}
          <p className="mt-6 text-xs text-gray-400"><a className="underline" href="/">Return to the current Awards app</a></p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const canVote = Boolean(
    account &&
      activeEvent &&
      activeEvent.status === "open" &&
      (!activeEvent.opens_at || new Date(activeEvent.opens_at) <= now) &&
      (!activeEvent.closes_at || new Date(activeEvent.closes_at) > now)
  );
  const savedBallot = activeEvent ? ballots[activeEvent.id] : null;
  const resultRows = activeEvent ? results[activeEvent.id] || [] : [];
  const resultsCanBeReleased = Boolean(
    isAdmin &&
      activeEvent?.results_visibility === "manual_release" &&
      !activeEvent?.results_released_at &&
      activeEvent?.status === "closed"
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 text-white">
      <section className="rounded-2xl border border-white/15 bg-gradient-to-br from-blue-950/80 to-slate-900/80 p-5 md:p-7 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="uppercase tracking-[0.25em] text-xs font-bold text-green-300">Awards adapter · Shared Voting V2</p><h1 className="mt-2 text-3xl md:text-4xl font-bold">Top 100 Manager Awards</h1><p className="mt-2 text-gray-300">Authenticated manager identity, one ballot per manager, editable until close.</p></div>
          <button onClick={logout} className="self-start rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm">Sign out</button>
        </div>
      </section>

      {message && <p className="my-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-200">{message}</p>}
      {loading && <div className="my-5 rounded-xl bg-white/10 p-5">Loading…</div>}

      {!loading && !account && !isAdmin && (
        <div className="my-5 rounded-xl border border-amber-400/30 bg-amber-950/20 p-5"><Lock className="mb-2 text-amber-300" /><h2 className="text-xl font-bold">Manager account required</h2><p className="mt-2 text-gray-300">Your email is authenticated but not linked to an active manager identity. Claim or restore your identity in the Manager Portal first.</p><a className="mt-3 inline-block underline" href="https://tournaments.smtop100.blog/manager">Open Manager Portal</a></div>
      )}

      {!loading && events.length === 0 && (
        <div className="my-5 rounded-xl border border-white/15 bg-white/5 p-5"><h2 className="text-xl font-bold">No Shared Voting Awards event yet</h2><p className="mt-2 text-gray-300">The adapter is connected successfully. Create an Awards-shaped test event in Shared Voting V2 to exercise the full flow.</p></div>
      )}

      {!loading && events.length > 0 && (
        <>
          {events.length > 1 && <div className="my-5"><label className="text-sm font-semibold">Awards event<select className="ml-3 rounded-lg bg-slate-900 border border-white/20 px-3 py-2" value={activeEvent?.id || ""} onChange={(e) => { const id = Number(e.target.value); setActiveEventId(id); const first = (questionsByEvent.get(id) || [])[0]; setActiveQuestionId(first?.id || null); }}>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label></div>}

          <section className="my-5 rounded-2xl border border-white/15 bg-white/5 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-green-300">{activeEvent.status}</p><h2 className="text-2xl font-bold mt-1">{activeEvent.title}</h2>{activeEvent.description && <p className="mt-2 text-gray-300">{activeEvent.description}</p>}<p className="mt-2 text-sm text-gray-400">Closes {formatDate(activeEvent.closes_at)}</p></div><Award className="text-yellow-400 shrink-0" /></div>
            {savedBallot?.ballot_id && <p className="mt-4 flex items-center gap-2 text-green-300"><CheckCircle size={18} /> Your ballot is saved.{canVote ? " You can still change it." : ""}</p>}
          </section>

          <nav className="my-5 flex flex-wrap gap-2">
            {eventQuestions.map((question) => {
              const complete = Boolean(answers[question.id]);
              const active = activeQuestion?.id === question.id;
              return <button key={question.id} onClick={() => setActiveQuestionId(question.id)} className={`rounded-lg px-3 py-2 text-sm font-semibold border ${active ? "bg-yellow-500 text-black border-yellow-400" : "bg-white/5 border-white/15"} ${complete ? "ring-1 ring-green-400" : ""}`}>{question.title}</button>;
            })}
          </nav>

          {activeQuestion && <section className="rounded-2xl border border-white/15 bg-white/5 p-5 md:p-6"><h3 className="text-2xl font-bold">{activeQuestion.title}</h3>{activeQuestion.description && <p className="mt-2 text-gray-300">{activeQuestion.description}</p>}<div className="mt-5 grid gap-3">{(optionsByQuestion.get(activeQuestion.id) || []).map((option) => { const selected = String(answers[activeQuestion.id] || "") === String(option.id); const metadata = option.metadata || {}; return <button key={option.id} disabled={!canVote} onClick={() => setAnswers((current) => ({ ...current, [activeQuestion.id]: option.id }))} className={`text-left rounded-xl border p-4 transition ${selected ? "border-yellow-400 bg-yellow-400/15" : "border-white/15 bg-black/10"} ${canVote ? "hover:border-green-300" : "opacity-80"}`}><div className="flex items-center justify-between gap-3"><div><h4 className="font-bold text-lg">{option.label}</h4>{metadata.club && <p className="text-sm text-green-300">{metadata.club}</p>}</div>{selected && <CheckCircle className="text-yellow-400" />}</div>{metadata.achievement && <p className="mt-3 font-semibold text-gray-200">{metadata.achievement}</p>}{metadata.description && <p className="mt-1 text-sm text-gray-400">{metadata.description}</p>}</button>; })}</div></section>}

          <div className="my-5 flex flex-wrap gap-3">{canVote && <button onClick={() => submitEventBallot(activeEvent.id)} className="rounded-lg bg-yellow-500 px-5 py-3 font-bold text-black hover:bg-yellow-400">{savedBallot?.ballot_id ? "Update Awards ballot" : "Submit Awards ballot"}</button>}{isAdmin && activeEvent.status === "closed" && <button onClick={() => finaliseAwards(activeEvent.id)} className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">Finalise Awards categories</button>}{resultsCanBeReleased && <button onClick={() => releaseResults(activeEvent.id)} className="rounded-lg border border-green-400/30 bg-green-500/20 px-4 py-3">Release results</button>}<button onClick={() => loadResults(activeEvent.id)} className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">Show available results</button></div>

          {resultRows.length > 0 && <section className="my-5 rounded-2xl border border-white/15 bg-white/5 p-5"><h3 className="text-xl font-bold">Results</h3><div className="mt-4 space-y-4">{eventQuestions.map((question) => { const rows = resultRows.filter((row) => row.question_id === question.id).sort((a, b) => Number(b.votes) - Number(a.votes)); if (!rows.length) return null; return <div key={question.id}><h4 className="font-bold">{question.title}</h4><ol className="mt-2 space-y-1">{rows.map((row, index) => <li key={row.option_id} className="flex justify-between gap-4"><span>{index + 1}. {row.option_label}</span><strong>{row.votes}</strong></li>)}</ol></div>; })}</div></section>}
        </>
      )}

      <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-400"><a className="underline" href="/">Current Awards app</a><a className="underline" href="https://vote.smtop100.blog">Shared Voting admin/front door</a><a className="underline" href="https://tournaments.smtop100.blog/manager">Manager Portal</a></div>
    </div>
  );
}
