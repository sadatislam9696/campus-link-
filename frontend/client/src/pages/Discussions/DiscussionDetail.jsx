import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { getDiscussion, addReply, deleteDiscussion } from "../../services/discussionService";
import { timeAgo } from "../../utils/timeAgo";
import { API_URL } from "../../config";

import MainLayout from "../../layouts/MainLayout";
import "./DiscussionDetail.css";

function PersonAvatar({ user, size = 34 }) {
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

function DiscussionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDiscussion(id);
      setDiscussion(data.discussion);
      setReplies(data.replies);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const data = await addReply(id, replyText.trim());
      setReplies((prev) => [...prev, data.reply]);
      setDiscussion((prev) => ({ ...prev, repliesCount: prev.repliesCount + 1 }));
      setReplyText("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this discussion?")) return;
    try {
      await deleteDiscussion(id);
      navigate("/discussions");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <p className="empty-state">Loading discussion...</p>
      </MainLayout>
    );
  }

  if (!discussion) {
    return (
      <MainLayout>
        <p className="empty-state">Discussion not found.</p>
      </MainLayout>
    );
  }

  const canDelete = user && (discussion.author.username === user.username || user.role === "admin");

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="card discussion-detail-header">
          <span className="discussion-course-tag">{discussion.courseCode}</span>
          <h1 className="discussion-detail-title">{discussion.title}</h1>

          <div className="discussion-detail-meta">
            <PersonAvatar user={discussion.author} size={28} />
            <Link to={`/profile/${discussion.author.username}`} style={{ fontWeight: 600 }}>
              {discussion.author.firstName} {discussion.author.lastName}
            </Link>
            <span>· {timeAgo(discussion.createdAt)}</span>

            {canDelete && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                style={{ marginLeft: "auto" }}
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
          </div>

          <p className="discussion-detail-content">{discussion.content}</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1rem", marginBottom: 6 }}>
            {replies.length} Repl{replies.length === 1 ? "y" : "ies"}
          </h2>

          {replies.map((r) => (
            <div key={r._id} className="reply-row">
              <PersonAvatar user={r.author} />
              <div>
                <span className="reply-name">
                  {r.author.firstName} {r.author.lastName}
                  <span className="reply-time">{timeAgo(r.createdAt)}</span>
                </span>
                <div className="reply-content">{r.content}</div>
              </div>
            </div>
          ))}

          <form className="reply-form" onSubmit={handleReply}>
            <input
              type="text"
              className="input"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!replyText.trim()}>
              Reply
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

export default DiscussionDetail;
