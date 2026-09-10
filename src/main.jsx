import React from "react";
import { createRoot } from "react-dom/client";
import AwardsHome from "./AwardsHome.jsx";
import VotingApp from "./VotingApp.jsx";
import SharedVotingAwards from "./SharedVotingAwards.jsx";
import Top100AwardsShell from "./Top100AwardsShell.jsx";
import "./index.css";
import "./top100-family.css";

const params = new URLSearchParams(window.location.search);
const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
const useSharedVotingV2 = params.get("shared-voting-v2") === "1";
const useLegacyAwards = params.get("legacy") === "1";

let content;
if (pathname === "/vote" || useSharedVotingV2) {
  content = <SharedVotingAwards />;
} else if (pathname === "/history" || useLegacyAwards) {
  content = <VotingApp />;
} else {
  content = <AwardsHome />;
}

const el = document.getElementById("root");
createRoot(el).render(<Top100AwardsShell>{content}</Top100AwardsShell>);
