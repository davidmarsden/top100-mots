import React from "react";
import { createRoot } from "react-dom/client";
import VotingApp from "./VotingApp.jsx";
import "./index.css";

const el = document.getElementById("root");
createRoot(el).render(<VotingApp />);