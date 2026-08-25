import { useEffect, useState } from "react";

import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import MobileNav from "../components/MobileNav/MobileNav";
import VerifyBanner from "../components/VerifyBanner/VerifyBanner";
import "./MainLayout.css";

/**
 * The application shell.
 *
 * Desktop: a three-column grid - navigation rail, fluid content column and
 * an optional right rail - centred inside a wide max-width so the app fills
 * a widescreen instead of sitting in a narrow phone-shaped strip.
 *
 * Mobile: the rail collapses into a slide-in drawer (hamburger in the
 * navbar), the right rail drops out, and a bottom tab bar carries the
 * primary destinations.
 */
function MainLayout({ children, rightPanel, hideSidebar }) {
  // The drawer closes on navigation via the Sidebar's onNavigate callback
  // below, so no route-watching effect is needed here.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll while the drawer covers the page, and allow Escape to
  // dismiss it.
  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  const showSidebar = !hideSidebar;

  return (
    <div className="app-shell">
      <Navbar onMenuClick={() => setDrawerOpen(true)} />

      <VerifyBanner />

      <div
        className={[
          "shell-body",
          showSidebar ? "" : "no-sidebar",
          rightPanel === null ? "no-rail" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showSidebar && (
          <aside className="shell-rail-left">
            <div className="shell-rail-left-inner">
              <Sidebar />
            </div>
          </aside>
        )}

        <main className="shell-content">{children}</main>

        {rightPanel !== null && (
          <aside className="shell-rail-right">
            <div className="shell-rail-right-inner">
              {rightPanel || <TrendingCard />}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile drawer */}
      {showSidebar && (
        <>
          <div
            className={`shell-scrim${drawerOpen ? " open" : ""}`}
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`shell-drawer${drawerOpen ? " open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            aria-hidden={!drawerOpen}
          >
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {showSidebar && <MobileNav />}
    </div>
  );
}

function TrendingCard() {
  const tags = ["#AI", "#CampusLink", "#React", "#NodeJS", "#Finals"];

  return (
    <div className="card trending-card">
      <h3 className="card-title">Trending on Campus</h3>

      <div className="trending-list">
        {tags.map((tag) => (
          <span className="trending-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default MainLayout;
