import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import AgentHeader from "../components/AgentHeader";

const statuses = ["open", "in_progress", "closed"];
const priorities = ["low", "medium", "high"];

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

function AgentTicketDetails() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [ticketResponse, commentsResponse, agentsResponse] = await Promise.all([
        api.get(`/tickets/${id}`), api.get(`/tickets/${id}/comments`), api.get("/users"),
      ]);
      const nextTicket = ticketResponse.data;
      setTicket(nextTicket);
      setComments(commentsResponse.data);
      setAgents(agentsResponse.data);
      setStatus(nextTicket.status);
      setPriority(nextTicket.priority);
      setAssignedTo(nextTicket.assigned_to ? String(nextTicket.assigned_to) : "");
    } catch (requestError) {
      setError(requestError.response?.status === 403
        ? "You do not have permission to view this ticket."
        : requestError.response?.status === 404
          ? "This ticket could not be found."
          : "Unable to load this ticket.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  const updateTicket = async (event) => {
    event.preventDefault();
    setIsSaving(true); setFormError(""); setSuccess("");
    try {
      const response = await api.put(`/tickets/${id}`, {
        status, priority, assigned_to: assignedTo ? Number(assignedTo) : null,
      });
      setTicket(response.data);
      setSuccess("Ticket updated successfully.");
    } catch (requestError) {
      setFormError(requestError.response?.data?.error || "Unable to update this ticket.");
    } finally { setIsSaving(false); }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) { setFormError("Comment text is required."); return; }
    setIsCommenting(true); setFormError(""); setSuccess("");
    try {
      await api.post(`/tickets/${id}/comments`, { comment: comment.trim() });
      const response = await api.get(`/tickets/${id}/comments`);
      setComments(response.data); setComment(""); setSuccess("Comment added.");
    } catch (requestError) {
      setFormError(requestError.response?.data?.error || "Unable to add comment.");
    } finally { setIsCommenting(false); }
  };

  return (
    <>
      <AgentHeader />
      <main className="page-container narrow-container">
        <Link to="/agent/dashboard">← Back to dashboard</Link>
        {isLoading && <p className="state-message">Loading ticket...</p>}
        {!isLoading && error && <p className="error-panel" role="alert">{error}</p>}
        {!isLoading && !error && ticket && (
          <>
            {success && <p className="success-panel" role="status">{success}</p>}
            <article className="detail-card">
              <div className="page-heading">
                <div><h1>{ticket.subject}</h1><p>Ticket #{ticket.id}</p></div>
                <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
              </div>
              <p className="ticket-description">{ticket.description}</p>
              <dl className="detail-grid">
                <div><dt>Customer</dt><dd>{ticket.customer_name} ({ticket.customer_email})</dd></div>
                <div><dt>Assigned agent</dt><dd>{ticket.agent_name || "Unassigned"}</dd></div>
                <div><dt>Created</dt><dd>{formatDate(ticket.created_at)}</dd></div>
                <div><dt>Updated</dt><dd>{formatDate(ticket.updated_at)}</dd></div>
              </dl>
            </article>
            <form className="ticket-form agent-update-form" onSubmit={updateTicket}>
              <h2>Manage ticket</h2>
              <label htmlFor="ticket-status">Status</label>
              <select id="ticket-status" value={status} onChange={(event) => setStatus(event.target.value)}>
                {statuses.map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}
              </select>
              <label htmlFor="ticket-priority">Priority</label>
              <select id="ticket-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
                {priorities.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <label htmlFor="ticket-agent">Assign agent</label>
              <select id="ticket-agent" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                <option value="">Unassigned</option>
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} ({agent.email})</option>)}
              </select>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</button>
            </form>
            <section className="comments-section">
              <h2>Comments</h2>
              {comments.length === 0 && <p>No comments yet.</p>}
              {comments.map((item) => (
                <article className="comment-card" key={item.id}>
                  <strong>{item.author_name}</strong><time dateTime={item.created_at}>{formatDate(item.created_at)}</time><p>{item.comment}</p>
                </article>
              ))}
              <form className="comment-form" onSubmit={addComment}>
                <label htmlFor="agent-comment">Add a comment</label>
                <textarea id="agent-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows="4" required />
                <button type="submit" disabled={isCommenting}>{isCommenting ? "Adding..." : "Add comment"}</button>
              </form>
            </section>
          </>
        )}
      </main>
    </>
  );
}

export default AgentTicketDetails;
