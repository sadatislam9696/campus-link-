import { useContext, useState } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { timeAgo } from "../../utils/timeAgo";
import ReportModal from "../ReportModal/ReportModal";
import EmojiPicker from "../EmojiPicker/EmojiPicker";
import "./PostCard.css";

import { API_URL } from "../../config";

const API_BASE = API_URL;

function Avatar({ user, size = 42 }) {
  const initials = `${user?.firstName?.[0] || ""}${
    user?.lastName?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="avatar" style={{ width: size, height: size }}>
      {user?.avatar ? (
        <img
          src={`${API_BASE}${user.avatar}`}
          alt={user.username}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

function CommentItem({ comment, currentUser, onReply, onEdit, onDelete, isReply = false }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const isMine = currentUser && comment.author?.username === currentUser.username;

  const saveEdit = () => {
    if (!editText.trim()) return;
    onEdit(comment._id, editText.trim());
    setEditing(false);
  };

  return (
    <div className="post-comment" style={isReply ? { marginLeft: 38 } : undefined}>
      <Avatar user={comment.author} size={28} />
      <div style={{ flex: 1 }}>
        {editing ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              autoFocus
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>
              Save
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="post-comment-bubble">
              <b>
                {comment.author?.firstName} {comment.author?.lastName}
              </b>
              {comment.text}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 2, marginLeft: 12 }}>
              <span className="post-comment-time">{timeAgo(comment.createdAt)}</span>
              {comment.isEdited && <span className="post-comment-time">edited</span>}
              {!isReply && (
                <button type="button" className="post-comment-action" onClick={() => onReply(comment)}>
                  Reply
                </button>
              )}
              {isMine && (
                <>
                  <button type="button" className="post-comment-action" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="post-comment-action"
                    onClick={() => confirm("Delete this comment?") && onDelete(comment._id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PostCard({
  post,
  comments = [],
  commentValue = "",
  onCommentChange,
  onCommentSubmit,
  onCommentDelete,
  onCommentEdit,
  onLike,
  onVote,
  onDelete,
  onEdit,
}) {
  const { user } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [reporting, setReporting] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // comment being replied to
  const [replyText, setReplyText] = useState("");

  const isOwner = user && post.author?.username === user.username;
  const liked = user && post.likes?.includes(user.id);

  const topLevel = comments.filter((c) => !c.parentComment);
  const repliesFor = (commentId) =>
    comments.filter((c) => c.parentComment === commentId);

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onEdit?.(editText.trim());
    setIsEditing(false);
  };

  const submitReply = () => {
    if (!replyText.trim() || !replyTo) return;
    onCommentSubmit?.(replyText.trim(), replyTo._id);
    setReplyText("");
    setReplyTo(null);
  };

  const totalVotes = post.poll?.options?.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0;
  const myVoteIndex = post.poll?.options?.findIndex((o) =>
    o.votes?.includes(user?.id)
  );

  return (
    <div className="card post-card">
      <div className="post-card-header">
        <Link to={`/profile/${post.author?.username}`}>
          <Avatar user={post.author} />
        </Link>

        <div className="post-card-header-text">
          <Link
            to={`/profile/${post.author?.username}`}
            className="post-card-name"
          >
            {post.author?.firstName} {post.author?.lastName}
          </Link>

          <div className="post-card-meta">
            <span>@{post.author?.username}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            {post.isEdited && <span>· edited</span>}
            {post.category && post.category !== "general" && (
              <span className="post-card-category-badge" style={{ marginLeft: 4 }}>
                {{ event: "📅 Event", question: "❓ Question", announcement: "📢 Announcement" }[post.category]}
              </span>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="post-card-menu">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Post options"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="post-card-menu-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setMenuOpen(false);
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (confirm("Delete this post?")) onDelete?.();
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        )}

        {!isOwner && user && (
          <div className="post-card-menu">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Post options"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="post-card-menu-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setReporting(true);
                  }}
                >
                  🚩 Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div style={{ marginBottom: 12 }}>
          <textarea
            className="input"
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveEdit}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setIsEditing(false);
                setEditText(post.content);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="post-card-content">{post.content}</p>
      )}

      {post.image && (
        <img
          src={`${API_BASE}${post.image}`}
          alt=""
          className="post-card-image"
        />
      )}

      {post.video && (
        <video
          src={`${API_BASE}${post.video}`}
          controls
          className="post-card-image"
        />
      )}

      {post.document?.url && (
        <a
          href={`${API_BASE}${post.document.url}`}
          target="_blank"
          rel="noreferrer"
          className="post-card-doc-chip"
        >
          📎 {post.document.name || "Download attachment"}
        </a>
      )}

      {post.poll && (
        <div className="post-poll">
          <div className="post-poll-question">{post.poll.question}</div>
          {post.poll.options.map((opt, i) => {
            const count = opt.votes?.length || 0;
            const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
            const isMine = myVoteIndex === i;
            return (
              <button
                type="button"
                key={i}
                className={`post-poll-option ${isMine ? "voted" : ""}`}
                onClick={() => onVote?.(i)}
              >
                <div className="post-poll-option-fill" style={{ width: `${pct}%` }} />
                <span className="post-poll-option-label">
                  {isMine && "✓ "}
                  {opt.text}
                </span>
                <span className="post-poll-option-pct">{pct}%</span>
              </button>
            );
          })}
          <div className="post-poll-total">{totalVotes} vote{totalVotes === 1 ? "" : "s"}</div>
        </div>
      )}

      <div className="post-card-stats">
        <span>❤️ {post.likes?.length || 0} likes</span>
        <span>{post.commentsCount || 0} comments</span>
      </div>

      <div className="post-card-actions">
        <button
          type="button"
          className={`post-action-btn ${liked ? "liked" : ""}`}
          onClick={onLike}
        >
          {liked ? "❤️" : "🤍"} Like
        </button>

        <button
          type="button"
          className="post-action-btn"
          onClick={() =>
            document
              .getElementById(`comment-input-${post._id}`)
              ?.focus()
          }
        >
          💬 Comment
        </button>
      </div>

      <div className="post-card-comments">
        {topLevel.map((comment) => (
          <div key={comment._id}>
            <CommentItem
              comment={comment}
              currentUser={user}
              onReply={setReplyTo}
              onEdit={onCommentEdit}
              onDelete={onCommentDelete}
            />
            {repliesFor(comment._id).map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUser={user}
                isReply
                onEdit={onCommentEdit}
                onDelete={onCommentDelete}
              />
            ))}

            {replyTo?._id === comment._id && (
              <div className="post-comment-form" style={{ marginLeft: 38 }}>
                <input
                  type="text"
                  className="input"
                  placeholder={`Reply to ${comment.author?.firstName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitReply()}
                  autoFocus
                />
                <EmojiPicker onSelect={(emoji) => setReplyText((t) => t + emoji)} />
                <button type="button" className="btn btn-primary btn-sm" onClick={submitReply}>
                  Reply
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReplyTo(null)}>
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="post-comment-form">
          <input
            id={`comment-input-${post._id}`}
            type="text"
            className="input"
            placeholder="Write a comment..."
            value={commentValue}
            onChange={(e) => onCommentChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onCommentSubmit?.(commentValue, null);
              }
            }}
          />
          <EmojiPicker onSelect={(emoji) => onCommentChange?.(commentValue + emoji)} />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onCommentSubmit?.(commentValue, null)}
          >
            Post
          </button>
        </div>
      </div>

      {reporting && (
        <ReportModal
          targetType="post"
          targetId={post._id}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}

export default PostCard;
