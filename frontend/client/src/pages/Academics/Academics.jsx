import { useContext, useEffect, useState } from "react";

import { AuthContext } from "../../context/AuthContext";
import { API_URL } from "../../config";
import { timeAgo } from "../../utils/timeAgo";

import { getEvents, createEvent, toggleInterested, deleteEvent } from "../../services/eventService";
import { getNotes, createNote, deleteNote } from "../../services/noteService";
import {
  getAssignments,
  createAssignment,
  toggleCompleted,
  deleteAssignment,
} from "../../services/assignmentService";
import {
  getProjects,
  createProject,
  toggleLikeProject,
  deleteProject,
} from "../../services/projectService";

import MainLayout from "../../layouts/MainLayout";
import "./Academics.css";

const TABS = ["Events", "Notes", "Assignments", "Projects"];

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==================================================================
// Create modals (kept small and inline - each tab has one simple form)
// ==================================================================

function EventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "", location: "", date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title.trim() || !form.date) {
      setError("Title and date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await createEvent(form);
      onCreated(data.event);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>New Event</h2>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Date & Time</label>
        <input
          type="datetime-local"
          className="input"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Location</label>
        <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Description</label>
        <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", courseCode: "", description: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title.trim() || !form.courseCode.trim()) {
      setError("Title and course code are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await createNote({ ...form, file });
      onCreated(data.note);
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Share a Note</h2>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Course Code</label>
        <input className="input" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} placeholder="e.g. CSE 220" />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Midterm Review Notes" />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Description (optional)</label>
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Attach a file (optional — PDF, DOC(X), PPT(X), ZIP, image, up to 15MB)
        </label>
        <input type="file" onChange={(e) => setFile(e.target.files[0] || null)} />
        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : "Share Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", courseCode: "", description: "", dueDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title.trim() || !form.courseCode.trim() || !form.dueDate) {
      setError("Title, course code, and due date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await createAssignment(form);
      onCreated(data.assignment);
    } catch (err) {
      setError(err.response?.data?.message || "Could not add assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>New Assignment</h2>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Course Code</label>
        <input className="input" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} placeholder="e.g. CSE 220" />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Due Date</label>
        <input type="datetime-local" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Description (optional)</label>
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : "Add Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "project",
    githubUrl: "",
    demoUrl: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await createProject(form);
      onCreated(data.project);
    } catch (err) {
      setError(err.response?.data?.message || "Could not publish.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Share a Project or Research</h2>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Type</label>
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="project">Project</option>
          <option value="research">Research</option>
        </select>
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Description</label>
        <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>GitHub URL (optional)</label>
        <input className="input" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Live Demo URL (optional)</label>
        <input className="input" value={form.demoUrl} onChange={(e) => setForm({ ...form, demoUrl: e.target.value })} />
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>Tags (comma separated)</label>
        <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="React, MongoDB, AI" />
        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================================================================
// Main page
// ==================================================================

function Academics() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState("Events");

  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);

  const [courseFilter, setCourseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async (currentTab) => {
    setLoading(true);
    try {
      if (currentTab === "Events") setEvents((await getEvents()).events);
      else if (currentTab === "Notes") setNotes((await getNotes(courseFilter)).notes);
      else if (currentTab === "Assignments") setAssignments((await getAssignments(courseFilter)).assignments);
      else if (currentTab === "Projects") setProjects((await getProjects()).projects);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const canModerate = (creatorId) => user && (creatorId === user.id || user.role === "admin");

  return (
    <MainLayout>
      <div>
        <h1 className="feed-heading">Academics</h1>

        <div className="tab-group">
          {TABS.map((t) => (
            <button key={t} type="button" className={`tab-pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {(tab === "Notes" || tab === "Assignments") && (
          <div className="academics-toolbar">
            <input
              type="text"
              className="input"
              placeholder="Filter by course code..."
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(tab)}
              style={{ maxWidth: 220 }}
            />
            <button type="button" className="btn btn-secondary" onClick={() => load(tab)}>Filter</button>
            <button type="button" className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setShowModal(true)}>
              + New {tab === "Notes" ? "Note" : "Assignment"}
            </button>
          </div>
        )}

        {(tab === "Events" || tab === "Projects") && (
          <div className="academics-toolbar">
            <button type="button" className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setShowModal(true)}>
              + New {tab === "Events" ? "Event" : "Project"}
            </button>
          </div>
        )}

        {loading && <p className="empty-state">Loading...</p>}

        {/* Events */}
        {!loading && tab === "Events" && (
          <div className="card" style={{ padding: 0 }}>
            {events.length === 0 && <p className="empty-state">No upcoming events.</p>}
            {events.map((ev) => (
              <div key={ev._id} className="item-row">
                <div className="item-row-top">
                  <div>
                    <div className="item-title">{ev.title}</div>
                    <div className="item-meta">
                      📅 {formatDate(ev.date)} {ev.location && `· 📍 ${ev.location}`} · {ev.interestedCount} interested
                    </div>
                    {ev.description && <div className="item-desc">{ev.description}</div>}
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className={`btn btn-sm ${ev.isInterested ? "btn-secondary" : "btn-primary"}`}
                      onClick={async () => {
                        await toggleInterested(ev._id);
                        load("Events");
                      }}
                    >
                      {ev.isInterested ? "✓ Interested" : "Interested"}
                    </button>
                    {canModerate(ev.creator._id) && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (confirm("Remove this event?")) {
                            await deleteEvent(ev._id);
                            load("Events");
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {!loading && tab === "Notes" && (
          <div className="card" style={{ padding: 0 }}>
            {notes.length === 0 && <p className="empty-state">No notes shared yet.</p>}
            {notes.map((n) => (
              <div key={n._id} className="item-row">
                <div className="item-row-top">
                  <div>
                    <span className="item-tag">{n.courseCode}</span>
                    <span className="item-title">{n.title}</span>
                    <div className="item-meta">
                      by {n.uploader.firstName} {n.uploader.lastName} · {timeAgo(n.createdAt)}
                    </div>
                    {n.description && <div className="item-desc">{n.description}</div>}
                    {n.fileUrl && (
                      <a
                        href={`${API_URL}${n.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: 8, display: "inline-flex" }}
                      >
                        📎 {n.fileName || "Download attachment"}
                      </a>
                    )}
                  </div>
                  {canModerate(n.uploader._id) && (
                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (confirm("Delete this note?")) {
                            await deleteNote(n._id);
                            load("Notes");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assignments */}
        {!loading && tab === "Assignments" && (
          <div className="card" style={{ padding: 0 }}>
            {assignments.length === 0 && <p className="empty-state">No assignments tracked yet.</p>}
            {assignments.map((a) => {
              const overdue = new Date(a.dueDate) < new Date() && !a.isCompleted;
              return (
                <div key={a._id} className="item-row">
                  <div className="item-row-top">
                    <div>
                      <span className="item-tag">{a.courseCode}</span>
                      <span className="item-title" style={a.isCompleted ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
                        {a.title}
                      </span>
                      <div className={`item-meta ${overdue ? "overdue" : ""}`}>
                        Due {formatDate(a.dueDate)} {overdue && "· Overdue"}
                      </div>
                      {a.description && <div className="item-desc">{a.description}</div>}
                    </div>
                    <div className="item-actions">
                      <button
                        type="button"
                        className={`btn btn-sm ${a.isCompleted ? "btn-secondary" : "btn-primary"}`}
                        onClick={async () => {
                          await toggleCompleted(a._id);
                          load("Assignments");
                        }}
                      >
                        {a.isCompleted ? "✓ Done" : "Mark Done"}
                      </button>
                      {canModerate(a.creator._id) && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            if (confirm("Remove this assignment?")) {
                              await deleteAssignment(a._id);
                              load("Assignments");
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Projects */}
        {!loading && tab === "Projects" && (
          <div className="card" style={{ padding: 0 }}>
            {projects.length === 0 && <p className="empty-state">No projects shared yet.</p>}
            {projects.map((p) => (
              <div key={p._id} className="item-row">
                <div className="item-row-top">
                  <div>
                    <span className="item-tag">{p.type === "research" ? "Research" : "Project"}</span>
                    <span className="item-title">{p.title}</span>
                    <div className="item-meta">
                      by {p.creator.firstName} {p.creator.lastName} · {timeAgo(p.createdAt)}
                    </div>
                    <div className="item-desc">{p.description}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                          🔗 GitHub
                        </a>
                      )}
                      {p.demoUrl && (
                        <a href={p.demoUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                          🚀 Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className={`btn btn-sm ${p.isLiked ? "btn-secondary" : "btn-primary"}`}
                      onClick={async () => {
                        await toggleLikeProject(p._id);
                        load("Projects");
                      }}
                    >
                      {p.isLiked ? "❤️" : "🤍"} {p.likeCount}
                    </button>
                    {canModerate(p.creator._id) && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (confirm("Remove this project?")) {
                            await deleteProject(p._id);
                            load("Projects");
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && tab === "Events" && (
        <EventModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load("Events"); }} />
      )}
      {showModal && tab === "Notes" && (
        <NoteModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load("Notes"); }} />
      )}
      {showModal && tab === "Assignments" && (
        <AssignmentModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load("Assignments"); }} />
      )}
      {showModal && tab === "Projects" && (
        <ProjectModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load("Projects"); }} />
      )}
    </MainLayout>
  );
}

export default Academics;
