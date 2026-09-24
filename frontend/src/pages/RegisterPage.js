import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
  const { isAuthenticated, role, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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

    if (!name || !email || !form.password) {
      setError("Name, email, and password are required.");
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

    setIsSubmitting(true);
    setError("");

    try {
      await register({ name, email, password: form.password });
      navigate("/login", {
        replace: true,
        state: { message: "Registration successful. Please sign in." },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Unable to register. Check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-heading">
        <h1 id="register-heading">Create customer account</h1>
        <p>Registration creates a customer account.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength="8"
            required
          />

          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
