import React from "react";
import { Link } from "react-router-dom";
import { getPriorityLabel, getStatusLabel } from "../utils/ticketLabels";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

function AgentTicketCard({ ticket }) {
  return (
    <article className="ticket-card">
      <div className="ticket-card-heading">
        <div>
          <h3><Link to={`/agent/tickets/${ticket.id}`}>{ticket.subject}</Link></h3>
          <p className="ticket-customer">
            {ticket.customer_name} ({ticket.customer_email})
          </p>
        </div>
        <span className={`badge badge-${ticket.status}`}>{getStatusLabel(ticket.status)}</span>
      </div>
      <div className="ticket-meta">
        <span>Ticket #{ticket.id}</span>
        <span>Priority: <strong className={`priority-badge priority-${ticket.priority}`}>{getPriorityLabel(ticket.priority)}</strong></span>
        <span>Assigned: {ticket.agent_name || "Unassigned"}</span>
        <span>Created: {formatDate(ticket.created_at)}</span>
        <span>Updated: {formatDate(ticket.updated_at)}</span>
      </div>
      <Link to={`/agent/tickets/${ticket.id}`}>View details</Link>
    </article>
  );
}

export default AgentTicketCard;
