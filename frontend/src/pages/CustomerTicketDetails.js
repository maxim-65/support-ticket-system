import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../api/client";
import CustomerHeader from "../components/CustomerHeader";
import { getCommentRoleLabel, getPriorityLabel, getStatusLabel } from "../utils/ticketLabels";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

function CustomerTicketDetails() {
  const { id } = useParams();
  const location = useLocation();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [success, setSuccess] = useState(location.state?.message || "");

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [ticketResponse, commentsResponse] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`),
      ]);
      setTicket(ticketResponse.data);
      setComments(commentsResponse.data);
    } catch (requestError) {
      setError(
        requestError.response?.status === 403
          ? "You do not have permission to view this ticket."
          : requestError.response?.status === 404
            ? "This ticket could not be found."
            : "Unable to load this ticket."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const addComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) {
      setCommentError("Comment text is required.");
      return;
    }
    setIsSubmitting(true);
    setCommentError("");
    setSuccess("");
    try {
      await api.post(`/tickets/${id}/comments`, { comment: comment.trim() });
      setComment("");
      setSuccess("Comment added.");
      const response = await api.get(`/tickets/${id}/comments`);
      setComments(response.data);
    } catch (requestError) {
      setCommentError(requestError.response?.data?.error || "Unable to add comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CustomerHeader />
      <main className="page-container narrow-container">
        <Link to={ticket?.status === "closed" ? "/customer/tickets/past" : "/customer/dashboard"}>
          ← Back to {ticket?.status === "closed" ? "past tickets" : "current tickets"}
        </Link>
        {isLoading && <p className="state-message">Loading ticket...</p>}
        {!isLoading && error && <p className="error-panel" role="alert">{error}</p>}
        {!isLoading && !error && ticket && (
          <>
            {success && <p className="success-panel" role="status">{success}</p>}
            <article className="detail-card">
              <div className="page-heading">
                <div>
                  <h1>{ticket.subject}</h1>
                  <p>Ticket #{ticket.id}</p>
                </div>
                <span className={`badge badge-${ticket.status}`}>{getStatusLabel(ticket.status)}</span>
              </div>
              <p className="ticket-description">{ticket.description}</p>
              <dl className="detail-grid">
                <div><dt>Priority</dt><dd><span className={`priority-badge priority-${ticket.priority}`}>{getPriorityLabel(ticket.priority)}</span></dd></div>
                <div><dt>Assigned Agent</dt><dd>{ticket.agent_name || "Unassigned"}</dd></div>
                <div><dt>Created</dt><dd>{formatDate(ticket.created_at)}</dd></div>
                <div><dt>Updated</dt><dd>{formatDate(ticket.updated_at)}</dd></div>
              </dl>
            </article>

            <section className="comments-section">
              <h2>Comments</h2>
              {comments.length === 0 && <p>No comments yet.</p>}
              {comments.map((item) => (
                <article className="comment-card" key={item.id}>
                  <div className="comment-author">
                    <span className={`role-pill role-${item.author_role}`}>{getCommentRoleLabel(item.author_role)}</span>
                    <strong>{item.author_name}</strong>
                  </div>
                  <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                  <p>{item.comment}</p>
                </article>
              ))}
              <form className="comment-form" onSubmit={addComment}>
                <label htmlFor="new-comment">Add a comment</label>
                <textarea
                  id="new-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows="4"
                  required
                />
                {commentError && <p className="form-error" role="alert">{commentError}</p>}
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add comment"}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </>
  );
}

export default CustomerTicketDetails;
