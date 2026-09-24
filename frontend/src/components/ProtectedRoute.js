import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRole }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRole && role !== allowedRole) {
    return (
      <Navigate
        to={role === "agent" ? "/agent/dashboard" : "/customer/dashboard"}
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
