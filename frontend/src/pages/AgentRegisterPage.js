import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AgentRegisterPage() {
  const { isAuthenticated, role, registerAgent } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return (
      <Navigate
        to={role === "agent" ? "/agent/dashboard" : "/customer/dashboard"}
        replace
      />
    );
  }

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError("Name, email, password, and password confirmation are required.");
      return;
    }
    if (!emailPattern.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await registerAgent({
        name,
        email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      navigate("/login", {
        replace: true,
        state: { message: "Support account created. Please sign in." },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Unable to create the support account. Check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="agent-register-heading">
        <h1 id="agent-register-heading">Create support account</h1>
        <p>This registration is for support team members.</p>
        <Link className="auth-back-link" to="/login">← Back to Login</Link>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="agent-register-name">Full name</label>
          <input
            id="agent-register-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />

          <label htmlFor="agent-register-email">Email</label>
          <input
            id="agent-register-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="agent-register-password">Password</label>
          <input
            id="agent-register-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength="8"
            required
          />

          <label htmlFor="agent-register-confirm-password">Confirm password</label>
          <input
            id="agent-register-confirm-password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength="8"
            required
          />

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating support account..." : "Create support account"}
          </button>
        </form>
        <div className="auth-navigation">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <p>
            Are you a customer?{" "}
            <Link to="/register">Create a customer account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default AgentRegisterPage;
