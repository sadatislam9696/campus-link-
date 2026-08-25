import { useContext, useState } from "react";

import { AuthContext } from "../../context/AuthContext";
import { resendVerification } from "../../services/authService";
import "./VerifyBanner.css";

function VerifyBanner() {
  const { user } = useContext(AuthContext);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.isEmailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="verify-banner">
      <span>📧 Please verify your email to unlock all features.</span>
      {sent ? (
        <span>Check your inbox!</span>
      ) : (
        <button type="button" onClick={handleResend} disabled={sending}>
          {sending ? "Sending..." : "Resend verification email"}
        </button>
      )}
    </div>
  );
}

export default VerifyBanner;
