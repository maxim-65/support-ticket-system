import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function CustomerHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <Link className="app-brand" to="/customer/dashboard">
        Support Tickets
      </Link>
      <nav aria-label="Customer navigation">
        <span className="welcome-text">Hi, {user.name}</span>
        <Link to="/customer/dashboard">Dashboard</Link>
        <Link to="/customer/tickets/new">New ticket</Link>
        <Link to="/customer/tickets/past">Past tickets</Link>
        <button type="button" className="link-button" onClick={handleLogout}>
          Sign out
        </button>
      </nav>
    </header>
  );
}

export default CustomerHeader;
