import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import {
  getTeam,
  getTeamPosts,
  createTeamPost,
  leaveTeam,
  deleteTeam,
  joinTeam,
} from "../../services/teamService";
import { timeAgo } from "../../utils/timeAgo";
import { API_URL } from "../../config";

import MainLayout from "../../layouts/MainLayout";
import { LoadingState } from "../../components/States/States";
import "./Teams.css";
import "./TeamDetail.css";

function MemberAvatar({ user, size = 36 }) {
  const initials = `${user?.firstName?.[0] || ""}${
    user?.lastName?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="avatar" style={{ width: size, height: size }}>
      {user?.avatar ? (
        <img
          src={`${API_URL}${user.avatar}`}
          alt={user.username}
          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [team, setTeam] = useState(null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const teamData = await getTeam(id);
      setTeam(teamData.team);

      if (teamData.team.isMember) {
        const postsData = await getTeamPosts(id);
        setPosts(postsData.posts);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this team.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleJoin = async () => {
    setBusy(true);
    try {
      await joinTeam(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not join team.");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Leave this team?")) return;
    setBusy(true);
    try {
      await leaveTeam(id);
      navigate("/teams");
    } catch (err) {
      setError(err.response?.data?.message || "Could not leave team.");
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this team permanently?")) return;
    setBusy(true);
    try {
      await deleteTeam(id);
      navigate("/teams");
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const data = await createTeamPost(id, text.trim());
      setPosts((prev) => [data.post, ...prev]);
      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <LoadingState label="Loading team..." />
      </MainLayout>
    );
  }

  if (!team) {
    return (
      <MainLayout>
        <p className="empty-state">{error || "Team not found."}</p>
      </MainLayout>
    );
  }

  const isCreator = team.creator._id === user.id;

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="team-header">
          <div>
            <h1>{team.name}</h1>
            <div className="team-header-meta">
              <span className="team-tag">{team.type}</span>
              <span className="team-tag">{team.category}</span>
              {team.members.length}/{team.maxMembers} member{team.maxMembers === 1 ? "" : "s"}
              {team.isFull ? " · Full" : ""} · created by {team.creator.firstName} {team.creator.lastName}
            </div>
            {team.description && (
              <p style={{ marginTop: 8, color: "var(--color-text-muted)" }}>{team.description}</p>
            )}
          </div>

          <div>
            {team.isMember ? (
              isCreator ? (
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={busy}>
                  Delete Team
                </button>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleLeave} disabled={busy}>
                  Leave Team
                </button>
              )
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleJoin} disabled={busy || team.isFull}>
                {team.isFull ? "Team Full" : "Join Team"}
              </button>
            )}
          </div>
        </div>

        {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

        <div className="team-members-panel">
          {team.members.map((m) => (
            <Link key={m._id} to={`/profile/${m.username}`} className="team-member-chip">
              <MemberAvatar user={m} size={24} />
              {m.firstName}
            </Link>
          ))}
        </div>

        {!team.isMember ? (
          <p className="empty-state">Join this team to see and join the discussion.</p>
        ) : (
          <div className="card">
            <form className="team-post-form" onSubmit={handlePost}>
              <input
                type="text"
                className="input"
                placeholder="Share something with the team..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
                Post
              </button>
            </form>

            <div style={{ marginTop: 14 }}>
              {posts.length === 0 && (
                <p className="empty-state">No messages yet — say hello 👋</p>
              )}

              {posts.map((p) => (
                <div key={p._id} className="team-post">
                  <MemberAvatar user={p.author} />
                  <div className="team-post-body">
                    <span className="team-post-name">
                      {p.author.firstName} {p.author.lastName}
                      <span className="team-post-time">{timeAgo(p.createdAt)}</span>
                    </span>
                    <div className="team-post-content">{p.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default TeamDetail;
