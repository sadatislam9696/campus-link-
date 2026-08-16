import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import {
  getGroup,
  getGroupPosts,
  createGroupPost,
  leaveGroup,
  deleteGroup,
  joinGroup,
} from "../../services/groupService";
import { timeAgo } from "../../utils/timeAgo";
import { API_URL } from "../../config";

import MainLayout from "../../layouts/MainLayout";
import "./GroupDetail.css";

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

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const groupData = await getGroup(id);
      setGroup(groupData.group);

      if (groupData.group.isMember) {
        const postsData = await getGroupPosts(id);
        setPosts(postsData.posts);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this group.");
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
      await joinGroup(id);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Leave this group?")) return;
    setBusy(true);
    try {
      await leaveGroup(id);
      navigate("/groups");
    } catch (err) {
      setError(err.response?.data?.message || "Could not leave group.");
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this group permanently?")) return;
    setBusy(true);
    try {
      await deleteGroup(id);
      navigate("/groups");
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const data = await createGroupPost(id, text.trim());
      setPosts((prev) => [data.post, ...prev]);
      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <p className="empty-state">Loading group...</p>
      </MainLayout>
    );
  }

  if (!group) {
    return (
      <MainLayout>
        <p className="empty-state">{error || "Group not found."}</p>
      </MainLayout>
    );
  }

  const isCreator = group.creator._id === user.id;

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="group-header">
          <div>
            <h1>{group.name}</h1>
            <div className="group-header-meta">
              {group.subject && `${group.subject} · `}
              {group.members.length} member{group.members.length === 1 ? "" : "s"} · created by{" "}
              {group.creator.firstName} {group.creator.lastName}
            </div>
            {group.description && (
              <p style={{ marginTop: 8, color: "var(--color-text-muted)" }}>{group.description}</p>
            )}
          </div>

          <div>
            {group.isMember ? (
              isCreator ? (
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={busy}>
                  Delete Group
                </button>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleLeave} disabled={busy}>
                  Leave Group
                </button>
              )
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleJoin} disabled={busy}>
                Join Group
              </button>
            )}
          </div>
        </div>

        <div className="group-members-panel">
          {group.members.map((m) => (
            <Link key={m._id} to={`/profile/${m.username}`} className="group-member-chip">
              <MemberAvatar user={m} size={24} />
              {m.firstName}
            </Link>
          ))}
        </div>

        {!group.isMember ? (
          <p className="empty-state">Join this group to see and join the discussion.</p>
        ) : (
          <div className="card">
            <form className="group-post-form" onSubmit={handlePost}>
              <input
                type="text"
                className="input"
                placeholder="Share something with the group..."
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
                <div key={p._id} className="group-post">
                  <MemberAvatar user={p.author} />
                  <div className="group-post-body">
                    <span className="group-post-name">
                      {p.author.firstName} {p.author.lastName}
                      <span className="group-post-time">{timeAgo(p.createdAt)}</span>
                    </span>
                    <div className="group-post-content">{p.content}</div>
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

export default GroupDetail;
