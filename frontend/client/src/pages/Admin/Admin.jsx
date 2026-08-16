import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import {
  getAdminStats,
  getAdminUsers,
  toggleBanUser,
  deleteUserAsAdmin,
  getAdminPosts,
  deletePostAsAdmin,
  getAdminReports,
  resolveReport,
} from "../../services/adminService";

import MainLayout from "../../layouts/MainLayout";
import "./Admin.css";

import { API_URL } from "../../config";

const API_BASE = API_URL;

function MiniAvatar({ user }) {
  const initials = `${user?.firstName?.[0] || ""}${
    user?.lastName?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="avatar">
      {user?.avatar ? (
        <img
          src={`${API_BASE}${user.avatar}`}
          alt={user.username}
          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

const TABS = ["Overview", "Users", "Posts", "Reports"];

function Admin() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState("Overview");

  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const [posts, setPosts] = useState([]);

  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const loadForTab = async (currentTab) => {
    setLoading(true);
    setActionError("");
    try {
      if (currentTab === "Overview") {
        const data = await getAdminStats();
        setStats(data.stats);
      } else if (currentTab === "Users") {
        const data = await getAdminUsers(userSearch);
        setUsers(data.users);
      } else if (currentTab === "Posts") {
        const data = await getAdminPosts();
        setPosts(data.posts);
      } else if (currentTab === "Reports") {
        const data = await getAdminReports("pending");
        setReports(data.reports);
      }
    } catch (error) {
      console.error(error);
      setActionError(error.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadForTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Non-admins never see this page - checked after hooks so hook order
  // stays consistent regardless of role.
  if (user && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleUserSearch = (e) => {
    e.preventDefault();
    loadForTab("Users");
  };

  const handleToggleBan = async (userId) => {
    try {
      await toggleBanUser(userId);
      loadForTab("Users");
    } catch (error) {
      setActionError(error.response?.data?.message || "Action failed.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Delete this user and all their content? This cannot be undone.")) return;
    try {
      await deleteUserAsAdmin(userId);
      loadForTab("Users");
    } catch (error) {
      setActionError(error.response?.data?.message || "Action failed.");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Remove this post?")) return;
    try {
      await deletePostAsAdmin(postId);
      loadForTab("Posts");
    } catch (error) {
      setActionError(error.response?.data?.message || "Action failed.");
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await resolveReport(reportId);
      loadForTab("Reports");
    } catch (error) {
      setActionError(error.response?.data?.message || "Action failed.");
    }
  };

  return (
    <MainLayout hideSidebar rightPanel={<div />}>
      <div>
        <h1 className="feed-heading">Admin Panel</h1>

        <div className="tab-group">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`tab-pill ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {actionError && <p className="error-text">{actionError}</p>}
        {loading && <p className="empty-state">Loading...</p>}

        {!loading && tab === "Overview" && stats && (
          <div className="admin-stats-grid">
            <div className="card admin-stat-card">
              <div className="admin-stat-value">{stats.totalUsers}</div>
              <div className="admin-stat-label">Total Users</div>
              <div className="admin-stat-sub">+{stats.newUsersThisWeek} this week</div>
            </div>
            <div className="card admin-stat-card">
              <div className="admin-stat-value">{stats.totalPosts}</div>
              <div className="admin-stat-label">Total Posts</div>
              <div className="admin-stat-sub">+{stats.newPostsThisWeek} this week</div>
            </div>
            <div className="card admin-stat-card">
              <div className="admin-stat-value">{stats.totalComments}</div>
              <div className="admin-stat-label">Total Comments</div>
            </div>
            <div className="card admin-stat-card">
              <div className="admin-stat-value">{stats.totalFriendships}</div>
              <div className="admin-stat-label">Friendships</div>
            </div>
            <div className="card admin-stat-card">
              <div className="admin-stat-value">{stats.totalMessages}</div>
              <div className="admin-stat-label">Messages Sent</div>
            </div>
            <div className="card admin-stat-card">
              <div className="admin-stat-value" style={{ color: stats.pendingReports > 0 ? "var(--color-danger)" : undefined }}>
                {stats.pendingReports}
              </div>
              <div className="admin-stat-label">Pending Reports</div>
            </div>
          </div>
        )}

        {!loading && tab === "Users" && (
          <div className="card">
            <form onSubmit={handleUserSearch} className="admin-search">
              <input
                type="text"
                className="input"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </form>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-row-user">
                        <MiniAvatar user={u} />
                        <div>
                          {u.firstName} {u.lastName}
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-soft)" }}>
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {u.role === "admin" && <span className="admin-badge admin">ADMIN</span>}{" "}
                      <span className={`admin-badge ${u.isActive ? "active" : "banned"}`}>
                        {u.isActive ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td>
                      {u.role !== "admin" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleToggleBan(u._id)}
                          >
                            {u.isActive ? "Ban" : "Unban"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && <p className="empty-state">No users found.</p>}
          </div>
        )}

        {!loading && tab === "Posts" && (
          <div className="card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Content</th>
                  <th>Likes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="admin-row-user">
                        <MiniAvatar user={p.author} />
                        <div>{p.author?.firstName} {p.author?.lastName}</div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-report-content">{p.content}</div>
                    </td>
                    <td>{p.likes?.length || 0}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeletePost(p._id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {posts.length === 0 && <p className="empty-state">No posts found.</p>}
          </div>
        )}

        {!loading && tab === "Reports" && (
          <div className="card">
            {reports.length === 0 && (
              <p className="empty-state">No pending reports — all clear!</p>
            )}

            <table className="admin-table">
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <span className="admin-badge banned" style={{ textTransform: "uppercase" }}>
                        {r.targetType}
                      </span>
                    </td>
                    <td>
                      <div className="admin-report-content">
                        {r.targetType === "post"
                          ? r.target?.content || "(post deleted)"
                          : `@${r.target?.username || "unknown"}`}
                      </div>
                    </td>
                    <td>
                      <div className="admin-report-content">
                        Reported by @{r.reporter?.username}: {r.reason}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleResolveReport(r._id)}
                      >
                        Mark Resolved
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Admin;
