import React from "react";
import { Link } from "react-router-dom";
import { getPriorityLabel, getStatusLabel } from "../utils/ticketLabels";

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

function TicketCard({ ticket }) {
  return (
    <article className="ticket-card">
      <div className="ticket-card-heading">
        <h3>
          <Link to={`/customer/tickets/${ticket.id}`}>{ticket.subject}</Link>
        </h3>
        <span className={`badge badge-${ticket.status}`}>{getStatusLabel(ticket.status)}</span>
      </div>
      <div className="ticket-meta">
        <span>Priority: <strong className={`priority-badge priority-${ticket.priority}`}>{getPriorityLabel(ticket.priority)}</strong></span>
        <span>Created: {formatDate(ticket.created_at)}</span>
        <span>Updated: {formatDate(ticket.updated_at)}</span>
      </div>
      <Link className="secondary-button" to={`/customer/tickets/${ticket.id}`}>
        View details
      </Link>
    </article>
  );
}

export default TicketCard;
