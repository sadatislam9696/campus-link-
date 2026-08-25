import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { verifyEmail } from "../../services/authService";
import "../Login/Auth.css";

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const data = await verifyEmail(token);
        setStatus("success");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      }
    };
    run();
  }, [token]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">CL</span>
        </div>
        <h1 className="auth-title">Email Verification</h1>

        {status === "loading" && <p className="auth-subtitle">Verifying your email...</p>}

        {status === "success" && <p className="auth-success">{message}</p>}

        {status === "error" && <p className="error-text">{message}</p>}

        <p className="auth-footer">
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 700 }}>
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
