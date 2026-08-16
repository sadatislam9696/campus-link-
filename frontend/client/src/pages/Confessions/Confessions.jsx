import { useEffect, useState } from "react";

import {
  getConfessions,
  createConfession,
  toggleConfessionLike,
  voteConfessionPoll,
  deleteConfession,
} from "../../services/confessionService";
import { timeAgo } from "../../utils/timeAgo";

import MainLayout from "../../layouts/MainLayout";
import "./Confessions.css";

function CreateConfessionModal({ onClose, onCreated }) {
  const [content, setContent] = useState("");
  const [isPoll, setIsPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateOption = (i, val) =>
    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));

  const submit = async () => {
    if (!content.trim()) {
      setError("Say something first.");
      return;
    }

    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (isPoll && (!pollQuestion.trim() || options.length < 2)) {
      setError("A poll needs a question and at least 2 options.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const poll = isPoll ? { question: pollQuestion.trim(), options } : null;
      const data = await createConfession(content.trim(), poll);
      onCreated(data.confession);
    } catch (err) {
      setError(err.response?.data?.message || "Could not post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Share Anonymously</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
          Your name is never attached to this — not even shown to other students.
        </p>

        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        <textarea
          className="input"
          rows={4}
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ marginTop: 14 }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: "0.88rem" }}>
          <input type="checkbox" checked={isPoll} onChange={(e) => setIsPoll(e.target.checked)} />
          Attach a poll
        </label>

        {isPoll && (
          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              className="input"
              placeholder="Ask a question..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            {pollOptions.map((opt, i) => (
              <input
                key={i}
                type="text"
                className="input"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                style={{ marginBottom: 6 }}
              />
            ))}
            {pollOptions.length < 5 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPollOptions((p) => [...p, ""])}
              >
                + Add option
              </button>
            )}
          </div>
        )}

        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : "Post Anonymously"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PollBlock({ confession, onVote }) {
  const total = confession.pollMeta?.totalVotes || 0;

  return (
    <div className="post-poll" style={{ marginBottom: 12 }}>
      <div className="post-poll-question">{confession.poll.question}</div>
      {confession.poll.options.map((opt, i) => {
        const count = opt.votes?.length || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        const mine = confession.pollMeta?.myVoteIndex === i;
        return (
          <button
            type="button"
            key={i}
            className={`post-poll-option ${mine ? "voted" : ""}`}
            onClick={() => onVote(i)}
          >
            <div className="post-poll-option-fill" style={{ width: `${pct}%` }} />
            <span className="post-poll-option-label">{mine && "✓ "}{opt.text}</span>
            <span className="post-poll-option-pct">{pct}%</span>
          </button>
        );
      })}
      <div className="post-poll-total">{total} vote{total === 1 ? "" : "s"}</div>
    </div>
  );
}

function Confessions() {
  const [tab, setTab] = useState("all"); // all | polls
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async (currentTab = tab) => {
    setLoading(true);
    try {
      const data = await getConfessions(currentTab === "polls");
      setConfessions(data.confessions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleLike = async (id) => {
    setConfessions((prev) =>
      prev.map((c) =>
        c._id === id ? { ...c, isLiked: !c.isLiked, likeCount: c.likeCount + (c.isLiked ? -1 : 1) } : c
      )
    );
    try {
      await toggleConfessionLike(id);
    } catch (error) {
      console.error(error);
      load(tab);
    }
  };

  const handleVote = async (id, optionIndex) => {
    try {
      const data = await voteConfessionPoll(id, optionIndex);
      setConfessions((prev) => prev.map((c) => (c._id === id ? data.confession : c)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this confession?")) return;
    try {
      await deleteConfession(id);
      setConfessions((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MainLayout>
      <div className="page-shell">
        <h1 className="feed-heading">Confessions &amp; Polls</h1>

        <div className="tab-group">
          <button type="button" className={`tab-pill ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
            Confessions
          </button>
          <button type="button" className={`tab-pill ${tab === "polls" ? "active" : ""}`} onClick={() => setTab("polls")}>
            Polls
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginLeft: "auto" }}
            onClick={() => setShowCreate(true)}
          >
            + Share Anonymously
          </button>
        </div>

        {loading && <p className="empty-state">Loading...</p>}

        {!loading && confessions.length === 0 && (
          <p className="empty-state">
            {tab === "polls" ? "No polls yet." : "No confessions yet — be the first to share."}
          </p>
        )}

        {confessions.map((c) => (
          <div key={c._id} className="card confession-card">
            <span className="confession-badge">🎭 Anonymous</span>

            <p className="confession-content">{c.content}</p>

            {c.poll && <PollBlock confession={c} onVote={(i) => handleVote(c._id, i)} />}

            <div className="confession-footer">
              <button
                type="button"
                className={`confession-like-btn ${c.isLiked ? "liked" : ""}`}
                onClick={() => handleLike(c._id)}
              >
                {c.isLiked ? "❤️" : "🤍"} {c.likeCount}
              </button>

              {c.isMine && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(c._id)}>
                  Delete
                </button>
              )}

              <span className="confession-time">{timeAgo(c.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateConfessionModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load(tab);
          }}
        />
      )}
    </MainLayout>
  );
}

export default Confessions;
