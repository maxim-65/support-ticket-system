import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { isAuthenticated, role, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
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
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      });
      const destination =
        location.state?.from?.pathname ||
        (user.role === "agent" ? "/agent/dashboard" : "/customer/dashboard");
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Unable to sign in. Check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-heading">
        <h1 id="login-heading">Sign in</h1>
        <p>Access your support ticket account.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p>
          New customer? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
