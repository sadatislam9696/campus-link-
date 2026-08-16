import { useState } from "react";
import { Link } from "react-router-dom";

import { forgotPassword } from "../../services/authService";
import "../Login/Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">CL</span>
        </div>
        <h1 className="auth-title">Reset your password</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {error && <p className="error-text">{error}</p>}

        {sent ? (
          <p className="auth-success">
            If an account exists for that email, a reset link has been sent. Check your inbox
            (and spam folder) for the next steps.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? <span className="spinner" /> : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
