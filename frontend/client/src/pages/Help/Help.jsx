import { useState } from "react";
import { Link } from "react-router-dom";

import MainLayout from "../../layouts/MainLayout";
import "./Help.css";

const FAQS = [
  {
    q: "How do I create a study group or club?",
    a: "Go to Groups & Clubs in the sidebar, choose Study Groups or Clubs, and click \"+ New Group\". You become the first member automatically, and can invite others by sharing the group.",
  },
  {
    q: "Can I join multiple teams?",
    a: "Yes — there's no limit on how many teams you can join, as long as the team itself isn't full (each team has its own member cap set by its creator).",
  },
  {
    q: "How do I change my profile picture?",
    a: "Open your profile, click Edit Profile, then \"Change photo\" to upload a new avatar.",
  },
  {
    q: "Is my data secure?",
    a: "Passwords are hashed and never stored in plain text, all traffic is expected to run over HTTPS in production, and sensitive actions (like password resets) use single-use, time-limited tokens.",
  },
  {
    q: "How do I delete my account?",
    a: "Account self-deletion isn't available yet from Settings. In the meantime, contact an admin and they can remove your account from the Admin Panel.",
  },
  {
    q: "Are confessions really anonymous?",
    a: "Yes. Your identity is never sent to the browser for confession posts, not even to other students who are admins — the author is only stored internally for handling abuse reports.",
  },
  {
    q: "Can I report a post or user?",
    a: "Yes — look for the ⋯ menu on a post or the 🚩 icon on a profile. Reports go to a review queue that admins check from the Admin Panel.",
  },
  {
    q: "Why can't I message someone?",
    a: "Messaging is limited to friends. Send a friend request first — once they accept, the Message button on their profile will work.",
  },
];

function Help() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="help-hero">
          <h1>How can we help?</h1>
          <p>Browse FAQs below or reach out directly.</p>
        </div>

        <div className="help-actions-grid">
          <a href="mailto:support@campuslink.app" className="card help-action-card">
            <div className="icon">📧</div>
            <div className="label">Email Support</div>
          </a>
          <div className="card help-action-card" style={{ opacity: 0.6, cursor: "default" }}>
            <div className="icon">💬</div>
            <div className="label">Live Chat (Soon)</div>
          </div>
          <Link to="/dashboard" className="card help-action-card">
            <div className="icon">🚩</div>
            <div className="label">Report an Issue</div>
          </Link>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1rem", marginBottom: 4 }}>Frequently Asked Questions</h2>
          {FAQS.map((item, i) => (
            <div key={item.q} className="faq-item">
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                {item.q}
                <span>{openIndex === i ? "−" : "+"}</span>
              </button>
              {openIndex === i && <div className="faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Help;
