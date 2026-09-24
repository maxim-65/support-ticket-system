import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import CustomerHeader from "../components/CustomerHeader";
import TicketCard from "../components/TicketCard";

function CustomerDashboard() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      params.sortBy = "updated_at";
      params.sortOrder = "desc";
      const response = await api.get("/tickets", { params });
      setTickets(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.status === 401
          ? "Your session has expired. Please sign in again."
          : "Unable to load your tickets."
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const updateFilter = (event) => {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", priority: "" });
  };

  return (
    <>
      <CustomerHeader />
      <main className="page-container">
        <div className="page-heading">
          <div>
            <h1>My tickets</h1>
            <p>View and follow up on your support requests.</p>
          </div>
          <Link className="primary-button" to="/customer/tickets/new">
            Create ticket
          </Link>
        </div>

        <section className="filter-panel" aria-label="Ticket filters">
          <label htmlFor="ticket-search">Search</label>
          <input
            id="ticket-search"
            name="search"
            value={filters.search}
            onChange={updateFilter}
            placeholder="Search subject or description"
          />
          <label htmlFor="ticket-status">Status</label>
          <select id="ticket-status" name="status" value={filters.status} onChange={updateFilter}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
          <label htmlFor="ticket-priority">Priority</label>
          <select id="ticket-priority" name="priority" value={filters.priority} onChange={updateFilter}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="button" className="secondary-button" onClick={clearFilters}>
            Clear filters
          </button>
        </section>

        {error && <p className="error-panel" role="alert">{error}</p>}
        {isLoading && <p className="state-message">Loading your tickets...</p>}
        {!isLoading && !error && tickets.length === 0 && (
          <section className="empty-state">
            <h2>No tickets found</h2>
            <p>Create a ticket or clear the filters to see your requests.</p>
            <Link className="primary-button" to="/customer/tickets/new">Create your first ticket</Link>
          </section>
        )}
        {!isLoading && !error && tickets.length > 0 && (
          <section className="ticket-list" aria-label="Your tickets">
            {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
          </section>
        )}
      </main>
    </>
  );
}

export default CustomerDashboard;
