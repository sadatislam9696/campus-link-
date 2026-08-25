import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getGroups, createGroup, joinGroup } from "../../services/groupService";
import MainLayout from "../../layouts/MainLayout";
import { LoadingState } from "../../components/States/States";
import "./Groups.css";

function CreateGroupModal({ defaultType, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = await createGroup({ name, subject, description, type: defaultType });
      onCreated(data.group);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create group.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h2>New Study Group</h2>

        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Group Name
        </label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Data Structures Study Circle"
        />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Subject / Course (optional)
        </label>
        <input
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. CSE 220"
        />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Description (optional)
        </label>
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this group about?"
        />

        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
            {saving ? <span className="spinner" /> : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("study");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const load = async (q = "", t = type) => {
    setLoading(true);
    try {
      const data = await getGroups(q, t);
      setGroups(data.groups);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(search, type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search, type);
  };

  const handleJoin = async (groupId) => {
    setJoiningId(groupId);
    try {
      await joinGroup(groupId);
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <MainLayout>
      <div>
        <h1 className="feed-heading">Study Groups &amp; Clubs</h1>

        <div className="tab-group">
          <button type="button" className={`tab-pill ${type === "study" ? "active" : ""}`} onClick={() => setType("study")}>
            Study Groups
          </button>
          <button type="button" className={`tab-pill ${type === "club" ? "active" : ""}`} onClick={() => setType("club")}>
            Clubs
          </button>
        </div>

        <div className="groups-toolbar">
          <form onSubmit={handleSearch} style={{ flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="Search groups by name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New {type === "club" ? "Club" : "Group"}
          </button>
        </div>

        {loading && <LoadingState label="Loading groups..." />}

        {!loading && groups.length === 0 && (
          <p className="empty-state">No study groups yet — create the first one!</p>
        )}

        <div className="group-grid">
          {groups.map((g) => (
            <div key={g._id} className="card group-card">
              {g.subject && <span className="group-card-subject">{g.subject}</span>}
              <div className="group-card-name">{g.name}</div>
              <div className="group-card-desc">{g.description || "No description yet."}</div>
              <div className="group-card-footer">
                <span className="group-card-members">
                  {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                </span>
                {g.isMember ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/groups/${g._id}`)}
                  >
                    Open
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={joiningId === g._id}
                    onClick={() => handleJoin(g._id)}
                  >
                    {joiningId === g._id ? <span className="spinner" /> : "Join"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateGroupModal
          defaultType={type}
          onClose={() => setShowCreate(false)}
          onCreated={(group) => {
            setShowCreate(false);
            navigate(`/groups/${group._id}`);
          }}
        />
      )}
    </MainLayout>
  );
}

export default Groups;
