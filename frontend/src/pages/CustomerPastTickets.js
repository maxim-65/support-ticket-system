import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import CustomerHeader from "../components/CustomerHeader";
import TicketCard from "../components/TicketCard";
import { getPriorityLabel } from "../utils/ticketLabels";

function CustomerPastTickets() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ search: "", priority: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = { status: "closed", sortBy: "updated_at", sortOrder: "desc" };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.priority) params.priority = filters.priority;
      const response = await api.get("/tickets", { params });
      setTickets(response.data);
    } catch (requestError) {
      setError(requestError.response?.status === 401
        ? "Your session has expired. Please sign in again."
        : "Unable to load your completed tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const hasFilters = filters.search || filters.priority;

  return (
    <>
      <CustomerHeader />
      <main className="page-container">
        <div className="page-heading">
          <div>
            <h1>Past tickets</h1>
            <p>Review your completed and resolved support requests.</p>
          </div>
          <Link className="primary-button" to="/customer/tickets/new">Create ticket</Link>
        </div>
        <section className="filter-panel past-filter-panel" aria-label="Past ticket filters">
          <label htmlFor="past-ticket-search">Search</label>
          <input id="past-ticket-search" name="search" value={filters.search} onChange={updateFilter} placeholder="Search subject or description" />
          <label htmlFor="past-ticket-priority">Priority</label>
          <select id="past-ticket-priority" name="priority" value={filters.priority} onChange={updateFilter}>
            <option value="">All priorities</option>
            {["low", "medium", "high"].map((value) => <option key={value} value={value}>{getPriorityLabel(value)}</option>)}
          </select>
          <button type="button" className="secondary-button" onClick={() => setFilters({ search: "", priority: "" })}>Clear filters</button>
        </section>
        {error && <p className="error-panel" role="alert">{error}</p>}
        {isLoading && <p className="state-message">Loading past tickets...</p>}
        {!isLoading && !error && tickets.length === 0 && (
          <section className="empty-state">
            <h2>{hasFilters ? "No tickets match your current filters." : "No completed tickets yet"}</h2>
            <p>{hasFilters ? "Try clearing the filters or changing your search." : "Completed tickets will appear here once an issue is resolved."}</p>
            {!hasFilters && <Link className="primary-button" to="/customer/tickets/new">Create ticket</Link>}
          </section>
        )}
        {!isLoading && !error && tickets.length > 0 && (
          <section className="ticket-list" aria-label="Past tickets">
            {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
          </section>
        )}
      </main>
    </>
  );
}

export default CustomerPastTickets;
