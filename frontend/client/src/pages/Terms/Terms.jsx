import { useState } from "react";

import MainLayout from "../../layouts/MainLayout";
import "./Terms.css";

function Terms() {
  const [tab, setTab] = useState("terms");

  return (
    <MainLayout>
      <div className="page-shell">
        <h1 className="feed-heading">Legal</h1>

        <div className="legal-tabs">
          <button type="button" className={`tab-pill ${tab === "terms" ? "active" : ""}`} onClick={() => setTab("terms")}>
            Terms of Service
          </button>
          <button type="button" className={`tab-pill ${tab === "privacy" ? "active" : ""}`} onClick={() => setTab("privacy")}>
            Privacy Policy
          </button>
        </div>

        <div className="card">
          <p className="legal-updated">Last updated: placeholder — replace before a real launch.</p>

          {tab === "terms" ? (
            <>
              <div className="legal-block">
                <h3>Acceptance of Terms</h3>
                <p>By accessing and using CampusLink, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
              </div>
              <div className="legal-block">
                <h3>User Responsibilities</h3>
                <p>You're responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p>
              </div>
              <div className="legal-block">
                <h3>Content Guidelines</h3>
                <p>Users must not post harmful, offensive, or illegal content. CampusLink reserves the right to remove content that violates community guidelines.</p>
              </div>
              <div className="legal-block">
                <h3>Prohibited Behavior</h3>
                <p>Harassment, spam, impersonation, and unauthorized data collection are strictly prohibited. Violators may face account suspension.</p>
              </div>
            </>
          ) : (
            <>
              <div className="legal-block">
                <h3>What We Collect</h3>
                <p>Your name, university email, and any profile details you choose to add (bio, department, skills, avatar). Posts, messages, and other content you create are stored to power the app's features.</p>
              </div>
              <div className="legal-block">
                <h3>Anonymous Features</h3>
                <p>Confessions are stored with an internal author reference for abuse handling only — it is never exposed through the app or any API response to other users.</p>
              </div>
              <div className="legal-block">
                <h3>How We Use It</h3>
                <p>Solely to operate CampusLink's features — your feed, friend connections, messaging, and notifications. We don't sell your data to third parties.</p>
              </div>
              <div className="legal-block">
                <h3>Your Choices</h3>
                <p>You can control profile visibility and notification preferences from Settings, and can contact an admin to request account deletion.</p>
              </div>
            </>
          )}
        </div>

        <p style={{ fontSize: "0.78rem", color: "var(--color-text-soft)", marginTop: 12 }}>
          This is placeholder legal content for a student project — have an actual lawyer review it before treating it as binding.
        </p>
      </div>
    </MainLayout>
  );
}

export default Terms;
