import React, { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import AgentHeader from "../components/AgentHeader";
import AgentTicketCard from "../components/AgentTicketCard";
import { getPriorityLabel } from "../utils/ticketLabels";

const emptyFilters = { search: "", priority: "", sortBy: "updated_at", sortOrder: "desc" };

function AgentCompletedTickets() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = { status: "closed", sortBy: filters.sortBy, sortOrder: filters.sortOrder };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.priority) params.priority = filters.priority;
      const response = await api.get("/tickets", { params });
      setTickets(response.data);
    } catch (requestError) {
      setError(requestError.response?.status === 401
        ? "Your session has expired. Please sign in again."
        : "Unable to load completed tickets.");
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
      <AgentHeader />
      <main className="page-container">
        <div className="page-heading">
          <div>
            <h1>Completed tickets</h1>
            <p>Review resolved tickets and their conversation history.</p>
          </div>
        </div>
        <section className="filter-panel completed-filter-panel" aria-label="Completed ticket filters">
          <label htmlFor="completed-search">Search</label>
          <input id="completed-search" name="search" value={filters.search} onChange={updateFilter} placeholder="Search subject or description" />
          <label htmlFor="completed-priority">Priority</label>
          <select id="completed-priority" name="priority" value={filters.priority} onChange={updateFilter}>
            <option value="">All priorities</option>
            {["low", "medium", "high"].map((value) => <option key={value} value={value}>{getPriorityLabel(value)}</option>)}
          </select>
          <label htmlFor="completed-sort">Sort by</label>
          <select id="completed-sort" name="sortBy" value={filters.sortBy} onChange={updateFilter}>
            <option value="updated_at">Updated date</option><option value="created_at">Created date</option>
            <option value="priority">Priority</option><option value="status">Status</option>
          </select>
          <select aria-label="Sort direction" name="sortOrder" value={filters.sortOrder} onChange={updateFilter}>
            <option value="desc">Descending</option><option value="asc">Ascending</option>
          </select>
          <button type="button" className="secondary-button" onClick={() => setFilters(emptyFilters)}>Clear filters</button>
        </section>
        {error && <p className="error-panel" role="alert">{error}</p>}
        {isLoading && <p className="state-message">Loading completed tickets...</p>}
        {!isLoading && !error && tickets.length === 0 && (
          <section className="empty-state">
            <h2>{hasFilters ? "No tickets match your current filters." : "No completed tickets"}</h2>
            <p>{hasFilters ? "Try clearing the filters or changing your search." : "Resolved tickets will appear here."}</p>
          </section>
        )}
        {!isLoading && !error && tickets.length > 0 && (
          <section className="ticket-list" aria-label="Completed tickets">
            {tickets.map((ticket) => <AgentTicketCard key={ticket.id} ticket={ticket} />)}
          </section>
        )}
      </main>
    </>
  );
}

export default AgentCompletedTickets;
