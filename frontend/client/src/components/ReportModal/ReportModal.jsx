import { useState } from "react";

import { createReport } from "../../services/reportService";

const REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Hate speech",
  "Inappropriate content",
  "Something else",
];

function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const fullReason = details.trim() ? `${reason} - ${details.trim()}` : reason;
      await createReport(targetType, targetId, fullReason);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        {done ? (
          <>
            <h2>Report submitted</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>
              Thanks for helping keep CampusLink safe. Our team will review this shortly.
            </p>
            <div className="edit-profile-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Report {targetType === "post" ? "Post" : "User"}</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
              Tell us what's wrong. Reports are reviewed by an admin.
            </p>

            {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

            <div style={{ marginTop: 14 }}>
              {REASONS.map((r) => (
                <label
                  key={r}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 4px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>

            <textarea
              className="input"
              rows={3}
              placeholder="Add more details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={{ marginTop: 8 }}
            />

            <div className="edit-profile-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <span className="spinner" /> : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
