import React, { useEffect, useState } from "react";
import SharedVotingAwards from "./SharedVotingAwards.jsx";
import { hasSharedVotingConfig, sharedVoting } from "./sharedVotingClient.js";

const MANAGER_ORIGIN = "https://tournaments.smtop100.blog";
const BRIDGE_TIMEOUT_MS = 15000;

export default function AwardsVotingEntry() {
  const [checkingBridge, setCheckingBridge] = useState(true);

  useEffect(() => {
    if (!hasSharedVotingConfig || !sharedVoting || window.location.hostname !== "awards.smtop100.blog") {
      setCheckingBridge(false);
      return undefined;
    }

    let finished = false;
    let frame;
    let timeout;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (timeout) window.clearTimeout(timeout);
      setCheckingBridge(false);
      if (frame?.parentNode) frame.parentNode.removeChild(frame);
    };

    const handleMessage = async (event) => {
      if (event.origin !== MANAGER_ORIGIN || event.data?.type !== "top100-manager-session") return;

      const bridgeSession = event.data.session;
      if (bridgeSession?.access_token && bridgeSession?.refresh_token) {
        const { error } = await sharedVoting.auth.setSession(bridgeSession);
        if (error) console.warn("Could not import Manager Portal session into Awards.", error);
      }

      // The Manager Portal is the canonical manager identity. A null bridge
      // response means there is no portal session to reconcile, so any valid
      // Awards-local session can continue to be used as the fallback.
      finish();
    };

    window.addEventListener("message", handleMessage);

    // Always ask the Manager Portal first, even when this origin already has a
    // cached session. That prevents a stale Awards login for manager A from
    // overriding a newer Manager Portal login for manager B on a shared device.
    frame = document.createElement("iframe");
    frame.src = `${MANAGER_ORIGIN}/auth/session-bridge`;
    frame.title = "Manager sign-in check";
    frame.setAttribute("aria-hidden", "true");
    frame.style.display = "none";
    frame.addEventListener("error", finish, { once: true });
    document.body.appendChild(frame);

    timeout = window.setTimeout(finish, BRIDGE_TIMEOUT_MS);

    return () => {
      if (timeout) window.clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
      if (frame?.parentNode) frame.parentNode.removeChild(frame);
    };
  }, []);

  if (checkingBridge) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-white">
        <div className="rounded-xl border border-white/15 bg-white/5 p-5">
          <h2 className="text-xl font-bold">Checking manager sign-in…</h2>
        </div>
      </div>
    );
  }

  return <SharedVotingAwards />;
}
