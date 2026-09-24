import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import AgentHeader from "../components/AgentHeader";
import AgentTicketCard from "../components/AgentTicketCard";

const emptyFilters = { search: "", status: "", priority: "", sortBy: "updated_at", sortOrder: "desc" };

function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [statistics, setStatistics] = useState({ total: 0, open: 0, in_progress: 0, closed: 0 });
  const [filters, setFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const listParams = { sortBy: filters.sortBy, sortOrder: filters.sortOrder };
      if (filters.search.trim()) listParams.search = filters.search.trim();
      if (filters.status) listParams.status = filters.status;
      if (filters.priority) listParams.priority = filters.priority;
      const [allResponse, filteredResponse] = await Promise.all([
        api.get("/tickets", { params: { sortBy: "created_at", sortOrder: "desc" } }),
        api.get("/tickets", { params: listParams }),
      ]);
      const allTickets = allResponse.data;
      setTickets(filteredResponse.data);
      setStatistics({
        total: allTickets.length,
        open: allTickets.filter((ticket) => ticket.status === "open").length,
        in_progress: allTickets.filter((ticket) => ticket.status === "in_progress").length,
        closed: allTickets.filter((ticket) => ticket.status === "closed").length,
      });
    } catch (requestError) {
      setError(requestError.response?.status === 401
        ? "Your session has expired. Please sign in again."
        : "Unable to load tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const clearFilters = () => setFilters(emptyFilters);

  return (
    <>
      <AgentHeader />
      <main className="page-container">
        <div className="page-heading">
          <div>
            <h1>Agent dashboard</h1>
            <p>Review and manage all support requests.</p>
          </div>
        </div>

        <section className="stats-grid" aria-label="Ticket statistics">
          <div className="stat-card"><strong>{statistics.total}</strong><span>Total tickets</span></div>
          <div className="stat-card"><strong>{statistics.open}</strong><span>Open</span></div>
          <div className="stat-card"><strong>{statistics.in_progress}</strong><span>In progress</span></div>
          <div className="stat-card"><strong>{statistics.closed}</strong><span>Closed</span></div>
        </section>

        <section className="filter-panel agent-filter-panel" aria-label="Ticket filters">
          <label htmlFor="agent-search">Search</label>
          <input id="agent-search" name="search" value={filters.search} onChange={updateFilter} placeholder="Search subject or description" />
          <label htmlFor="agent-status">Status</label>
          <select id="agent-status" name="status" value={filters.status} onChange={updateFilter}>
            <option value="">All statuses</option><option value="open">Open</option>
            <option value="in_progress">In progress</option><option value="closed">Closed</option>
          </select>
          <label htmlFor="agent-priority">Priority</label>
          <select id="agent-priority" name="priority" value={filters.priority} onChange={updateFilter}>
            <option value="">All priorities</option><option value="low">Low</option>
            <option value="medium">Medium</option><option value="high">High</option>
          </select>
          <label htmlFor="agent-sort">Sort by</label>
          <select id="agent-sort" name="sortBy" value={filters.sortBy} onChange={updateFilter}>
            <option value="updated_at">Updated date</option><option value="created_at">Created date</option>
            <option value="priority">Priority</option><option value="status">Status</option>
          </select>
          <select aria-label="Sort direction" name="sortOrder" value={filters.sortOrder} onChange={updateFilter}>
            <option value="desc">Descending</option><option value="asc">Ascending</option>
          </select>
          <button type="button" className="secondary-button" onClick={clearFilters}>Clear filters</button>
        </section>

        {error && <p className="error-panel" role="alert">{error}</p>}
        {isLoading && <p className="state-message">Loading tickets...</p>}
        {!isLoading && !error && tickets.length === 0 && (
          <section className="empty-state"><h2>No tickets found</h2><p>Try clearing the filters or changing your search.</p></section>
        )}
        {!isLoading && !error && tickets.length > 0 && (
          <section className="ticket-list" aria-label="All tickets">
            {tickets.map((ticket) => <AgentTicketCard key={ticket.id} ticket={ticket} />)}
          </section>
        )}
      </main>
    </>
  );
}

export default AgentDashboard;
