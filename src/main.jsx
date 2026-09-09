import React from "react";
import { createRoot } from "react-dom/client";
import VotingApp from "./VotingApp.jsx";
import SharedVotingAwards from "./SharedVotingAwards.jsx";
import Top100AwardsShell from "./Top100AwardsShell.jsx";
import "./index.css";
import "./top100-family.css";

const params = new URLSearchParams(window.location.search);
const useSharedVotingV2 = params.get("shared-voting-v2") === "1";
const el = document.getElementById("root");

createRoot(el).render(
  <Top100AwardsShell>
    {useSharedVotingV2 ? <SharedVotingAwards /> : <VotingApp />}
  </Top100AwardsShell>
);
