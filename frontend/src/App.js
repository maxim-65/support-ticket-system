import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AgentRegisterPage from "./pages/AgentRegisterPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import CreateTicketPage from "./pages/CreateTicketPage";
import CustomerTicketDetails from "./pages/CustomerTicketDetails";
import AgentDashboard from "./pages/AgentDashboard";
import AgentTicketDetails from "./pages/AgentTicketDetails";
import CustomerPastTickets from "./pages/CustomerPastTickets";
import AgentCompletedTickets from "./pages/AgentCompletedTickets";

function HomeRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={role === "agent" ? "/agent/dashboard" : "/customer/dashboard"}
      replace
    />
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/agent" element={<AgentRegisterPage />} />

      <Route element={<ProtectedRoute allowedRole="customer" />}>
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/tickets/new" element={<CreateTicketPage />} />
        <Route path="/customer/tickets/past" element={<CustomerPastTickets />} />
        <Route path="/customer/tickets/:id" element={<CustomerTicketDetails />} />
      </Route>
      <Route element={<ProtectedRoute allowedRole="agent" />}>
        <Route path="/agent/dashboard" element={<AgentDashboard />} />
        <Route path="/agent/tickets/completed" element={<AgentCompletedTickets />} />
        <Route path="/agent/tickets/:id" element={<AgentTicketDetails />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
