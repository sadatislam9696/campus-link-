import { useContext, useEffect, useState } from "react";

import { AuthContext } from "../../context/AuthContext";
import { getTeams, createTeam, joinTeam, leaveTeam, deleteTeam } from "../../services/teamService";

import MainLayout from "../../layouts/MainLayout";
import "./Teams.css";
import "../Groups/Groups.css";

const TYPES = ["study", "project", "competition", "other"];
const CATEGORIES = ["academic", "social", "professional", "sport", "art"];

function CreateTeamModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "project",
    category: "academic",
    maxMembers: 10,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) {
      setError("Team name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = await createTeam(form);
      onCreated(data.team);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create team.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>New Team</h2>

        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Team Name
        </label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Hackathon Squad"
        />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Description
        </label>
        <textarea
          className="input"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 6 }}>Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 6 }}>Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Maximum Members
        </label>
        <input
          type="number"
          min={2}
          max={50}
          className="input"
          value={form.maxMembers}
          onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
        />

        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Teams() {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTeams();
      setTeams(data.teams);
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

  const handleJoin = async (id) => {
    setBusyId(id);
    try {
      await joinTeam(id);
      load();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = async (id) => {
    setBusyId(id);
    try {
      await leaveTeam(id);
      load();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this team?")) return;
    try {
      await deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MainLayout>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h1 className="feed-heading" style={{ marginBottom: 0 }}>Teams</h1>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Team
          </button>
        </div>

        {loading && <p className="empty-state">Loading teams...</p>}

        {!loading && teams.length === 0 && (
          <p className="empty-state">No teams yet — create one to start collaborating.</p>
        )}

        <div className="group-grid">
          {teams.map((t) => (
            <div key={t._id} className="card team-card">
              <div className="team-tags">
                <span className="team-tag">{t.type}</span>
                <span className="team-tag">{t.category}</span>
              </div>
              <div className="team-name">{t.name}</div>
              <div className="team-desc">{t.description || "No description yet."}</div>
              <div className="team-footer">
                <span className="team-members-count">
                  {t.memberCount}/{t.maxMembers} members{t.isFull ? " · Full" : ""}
                </span>

                {t.creator._id === user.id ? (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>
                    Delete
                  </button>
                ) : t.isMember ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busyId === t._id}
                    onClick={() => handleLeave(t._id)}
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === t._id || t.isFull}
                    onClick={() => handleJoin(t._id)}
                  >
                    {t.isFull ? "Full" : "Join"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </MainLayout>
  );
}

export default Teams;
