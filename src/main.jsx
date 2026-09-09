import React from "react";
import { createRoot } from "react-dom/client";
import VotingApp from "./VotingApp.jsx";
import Top100AwardsShell from "./Top100AwardsShell.jsx";
import "./index.css";
import "./top100-family.css";

const el = document.getElementById("root");
createRoot(el).render(
  <Top100AwardsShell>
    <VotingApp />
  </Top100AwardsShell>
);