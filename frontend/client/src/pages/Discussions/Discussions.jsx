import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getDiscussions, createDiscussion } from "../../services/discussionService";
import { timeAgo } from "../../utils/timeAgo";
import MainLayout from "../../layouts/MainLayout";
import { LoadingState, EmptyState } from "../../components/States/States";
import "./Discussions.css";
import { FiMessageSquare } from "react-icons/fi";

function CreateDiscussionModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !courseCode.trim() || !content.trim()) {
      setError("Title, course code, and content are all required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = await createDiscussion({ title, courseCode, content });
      onCreated(data.discussion);
    } catch (err) {
      setError(err.response?.data?.message || "Could not start discussion.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2>Start a Discussion</h2>

        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Course Code
        </label>
        <input
          className="input"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          placeholder="e.g. CSE 220"
        />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Title
        </label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your question or topic?"
        />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Details
        </label>
        <textarea
          className="input"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add more context..."
        />

        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
            {saving ? <span className="spinner" /> : "Post Discussion"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Discussions() {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [search, setSearch] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async (course = "", q = "") => {
    setLoading(true);
    try {
      const data = await getDiscussions(course, q);
      setDiscussions(data.discussions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    load(courseCode, search);
  };

  return (
    <MainLayout>
      <div>
        <h1 className="feed-heading">Course Discussions</h1>

        <form className="discussions-toolbar" onSubmit={handleFilter}>
          <input
            type="text"
            className="input"
            placeholder="Filter by course code (e.g. CSE 220)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Discussion
          </button>
        </form>

        <div className="card" style={{ padding: 0 }}>
          {loading && <LoadingState label="Loading discussions..." />}

          {!loading && discussions.length === 0 && (
            <EmptyState
              icon={FiMessageSquare}
              title="No discussions yet"
              text="Start a thread tagged with a course code and get the conversation going."
            />
          )}

          {discussions.map((d) => (
            <Link key={d._id} to={`/discussions/${d._id}`} className="discussion-row">
              <span className="discussion-course-tag">{d.courseCode}</span>
              <div className="discussion-title">{d.title}</div>
              <div className="discussion-meta">
                by {d.author?.firstName} {d.author?.lastName} · {timeAgo(d.createdAt)} ·{" "}
                {d.repliesCount} repl{d.repliesCount === 1 ? "y" : "ies"}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateDiscussionModal
          onClose={() => setShowCreate(false)}
          onCreated={(discussion) => {
            setShowCreate(false);
            navigate(`/discussions/${discussion._id}`);
          }}
        />
      )}
    </MainLayout>
  );
}

export default Discussions;
