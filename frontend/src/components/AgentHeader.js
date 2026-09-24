import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AgentHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <Link className="app-brand" to="/agent/dashboard">Support Tickets</Link>
      <nav aria-label="Agent navigation">
        <span className="welcome-text">Hi, {user?.name}</span>
        <Link to="/agent/dashboard">Dashboard</Link>
        <Link to="/agent/tickets/completed">Completed tickets</Link>
        <button className="link-button" type="button" onClick={logout}>Sign out</button>
      </nav>
    </header>
  );
}

export default AgentHeader;
