import { Link, Navigate } from "react-router-dom";
import {
  FiUsers,
  FiMessageSquare,
  FiBookOpen,
  FiCalendar,
  FiAward,
  FiPackage,
  FiArrowRight,
} from "react-icons/fi";

import "./Home.css";

const FEATURES = [
  {
    icon: FiUsers,
    title: "Your campus network",
    text: "Find classmates by course, department or skill, send friend requests, and keep your circle in one place.",
  },
  {
    icon: FiMessageSquare,
    title: "Realtime messaging",
    text: "One-to-one and group chats with typing indicators, read receipts and online presence.",
  },
  {
    icon: FiBookOpen,
    title: "Shared course notes",
    text: "Upload lecture notes and past papers, tagged by course code so the right people actually find them.",
  },
  {
    icon: FiCalendar,
    title: "Events & deadlines",
    text: "Track assignment deadlines and RSVP to campus events without living in three different apps.",
  },
  {
    icon: FiAward,
    title: "Teams & study groups",
    text: "Spin up a team for a project or competition, or join a study group with its own discussion board.",
  },
  {
    icon: FiPackage,
    title: "Campus life",
    text: "A lost & found board, anonymous confessions and polls - the parts of student life nobody builds for.",
  },
];

function Home() {
  const token = localStorage.getItem("token");

  // Already logged in? skip the landing page and go straight to the feed.
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <span className="landing-brand-mark">CL</span>
            CampusLink
          </div>

          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <span className="landing-eyebrow">For university students</span>

            <h1>
              Your university, <span>one network</span> away
            </h1>

            <p>
              Connect with classmates, share notes, form study groups and stay on
              top of campus life &mdash; all in one place built for students.
            </p>

            <div className="landing-hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create your account <FiArrowRight aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-features" aria-label="Features">
          <div className="landing-section-inner">
            <h2 className="landing-section-title">Everything campus, in one app</h2>
            <p className="landing-section-sub">
              Six things students juggle across group chats, shared drives and
              noticeboards &mdash; brought together.
            </p>

            <div className="landing-feature-grid">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article className="landing-feature" key={title}>
                  <span className="landing-feature-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-cta-inner">
            <h2>Ready to join your campus?</h2>
            <p>Create an account with your university email and start connecting.</p>
            <Link to="/register" className="btn btn-lg landing-cta-btn">
              Get started free <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span>&copy; {new Date().getFullYear()} CampusLink</span>
          <nav className="landing-footer-links">
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default Home;
