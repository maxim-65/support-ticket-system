import React from "react";
import { useAuth } from "../context/AuthContext";

function RoleLandingPage() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>{user.role === "agent" ? "Agent area" : "Customer area"}</h1>
      <p>Authentication is complete. Dashboard features will be added next.</p>
      <button type="button" onClick={logout}>
        Sign out
      </button>
    </main>
  );
}

export default RoleLandingPage;
