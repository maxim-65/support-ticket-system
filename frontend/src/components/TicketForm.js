import React, { useState } from "react";

function TicketForm({ onSubmit, isSubmitting, submitLabel = "Create ticket" }) {
  const [form, setForm] = useState({
    subject: "",
    description: "",
    priority: "medium",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.description.trim() || !form.priority) {
      setError("Subject, description, and priority are required.");
      return;
    }

    try {
      await onSubmit({
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: form.priority,
      });
      setForm({ subject: "", description: "", priority: "medium" });
      setError("");
    } catch (submitError) {
      setError(submitError.message || "Unable to create the ticket.");
    }
  };

  return (
    <form className="ticket-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="ticket-subject">Subject</label>
      <input
        id="ticket-subject"
        name="subject"
        value={form.subject}
        onChange={handleChange}
        maxLength="200"
        required
      />

      <label htmlFor="ticket-description">Description</label>
      <textarea
        id="ticket-description"
        name="description"
        value={form.description}
        onChange={handleChange}
        rows="6"
        required
      />

      <label htmlFor="ticket-priority">Priority</label>
      <select
        id="ticket-priority"
        name="priority"
        value={form.priority}
        onChange={handleChange}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : submitLabel}
      </button>
    </form>
  );
}

export default TicketForm;
