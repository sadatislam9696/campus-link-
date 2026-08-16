import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import VerifyBanner from "../components/VerifyBanner/VerifyBanner";
import "./MainLayout.css";

function MainLayout({ children, rightPanel, hideSidebar }) {
  return (
    <>
      <Navbar />
      <VerifyBanner />

      <div className="main-layout-body">
        {!hideSidebar && <Sidebar />}

        <div className="main-layout-content">{children}</div>

        <div className="main-layout-right">
          {rightPanel || (
            <div className="card trending-card">
              <h3>Trending on Campus</h3>
              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", marginBottom: 8 }} />
              <p>#AI</p>
              <p>#CampusLink</p>
              <p>#React</p>
              <p>#NodeJS</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MainLayout;
