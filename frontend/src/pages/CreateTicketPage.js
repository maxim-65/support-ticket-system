import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import CustomerHeader from "../components/CustomerHeader";
import TicketForm from "../components/TicketForm";

function CreateTicketPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const createTicket = async (details) => {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await api.post("/tickets", details);
      navigate(`/customer/tickets/${response.data.id}`, {
        replace: true,
        state: { message: "Ticket created successfully." },
      });
    } catch (requestError) {
      const message = requestError.response?.data?.error || "Unable to create the ticket.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CustomerHeader />
      <main className="page-container narrow-container">
        <Link to="/customer/dashboard">← Back to dashboard</Link>
        <h1>Create a ticket</h1>
        <p>Tell us what you need help with.</p>
        {error && <p className="error-panel" role="alert">{error}</p>}
        <TicketForm onSubmit={createTicket} isSubmitting={isSubmitting} />
      </main>
    </>
  );
}

export default CreateTicketPage;
