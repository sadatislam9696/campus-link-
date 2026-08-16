import { Link, Navigate } from "react-router-dom";

import "./Home.css";

function Home() {
  const token = localStorage.getItem("token");

  // Already logged in? skip the landing page and go straight to the feed.
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="landing-brand-mark">CL</span>
          CampusLink
        </div>

        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-ghost">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1>
            Your university, <span>one network</span> away
          </h1>
          <p>
            Connect with classmates, share updates, and build your academic
            community — all in one place designed for students.
          </p>

          <div className="landing-hero-actions">
            <Link to="/register" className="btn btn-primary">
              Create your account
            </Link>
            <Link to="/login" className="btn btn-secondary">
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
