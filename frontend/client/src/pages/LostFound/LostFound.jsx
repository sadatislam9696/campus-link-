import { useContext, useEffect, useState } from "react";

import { AuthContext } from "../../context/AuthContext";
import {
  getLostFoundItems,
  createLostFoundItem,
  toggleResolved,
  deleteLostFoundItem,
} from "../../services/lostFoundService";
import { timeAgo } from "../../utils/timeAgo";
import { API_URL } from "../../config";

import MainLayout from "../../layouts/MainLayout";
import "./LostFound.css";

function CreateItemModal({ defaultCategory, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: defaultCategory,
    location: "",
  });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = await createLostFoundItem({ ...form, image });
      onCreated(data.item);
    } catch (err) {
      setError(err.response?.data?.message || "Could not post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Report an Item</h2>

        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          This item was...
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`btn btn-sm ${form.category === "lost" ? "btn-danger" : "btn-ghost"}`}
            onClick={() => setForm({ ...form, category: "lost" })}
          >
            Lost
          </button>
          <button
            type="button"
            className={`btn btn-sm ${form.category === "found" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setForm({ ...form, category: "found" })}
          >
            Found
          </button>
        </div>

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Item Title
        </label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Black iPhone 14 Pro"
        />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Location
        </label>
        <input
          className="input"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. Library entrance"
        />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Description
        </label>
        <textarea
          className="input"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Photo (optional)
        </label>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0] || null)} />

        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LostFound() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState("lost");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async (category = tab) => {
    setLoading(true);
    try {
      const data = await getLostFoundItems(category, "open");
      setItems(data.items);
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

  const handleResolve = async (id) => {
    try {
      await toggleResolved(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this listing?")) return;
    try {
      await deleteLostFoundItem(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MainLayout>
      <div>
        <h1 className="feed-heading">Lost &amp; Found</h1>

        <div className="tab-group">
          <button type="button" className={`tab-pill ${tab === "lost" ? "active" : ""}`} onClick={() => setTab("lost")}>
            Lost
          </button>
          <button type="button" className={`tab-pill ${tab === "found" ? "active" : ""}`} onClick={() => setTab("found")}>
            Found
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginLeft: "auto" }}
            onClick={() => setShowCreate(true)}
          >
            + Report Item
          </button>
        </div>

        {loading && <p className="empty-state">Loading...</p>}

        {!loading && items.length === 0 && (
          <p className="empty-state">Nothing here right now.</p>
        )}

        <div className="lf-grid">
          {items.map((item) => (
            <div key={item._id} className="card lf-card">
              {item.image && (
                <img src={`${API_URL}${item.image}`} alt={item.title} className="lf-card-image" />
              )}
              <div className="lf-card-body">
                <div className="lf-card-top">
                  <div className="lf-card-title">{item.title}</div>
                  <span className={`lf-badge ${item.category}`}>{item.category}</span>
                </div>
                <div className="lf-card-meta">
                  {item.location && `📍 ${item.location} · `}
                  {timeAgo(item.createdAt)} · by {item.postedBy.firstName}
                </div>
                {item.description && <div className="lf-card-desc">{item.description}</div>}

                {(item.postedBy._id === user.id || user.role === "admin") && (
                  <div className="lf-card-footer">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleResolve(item._id)}
                    >
                      ✓ Resolved
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateItemModal
          defaultCategory={tab}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load(tab);
          }}
        />
      )}
    </MainLayout>
  );
}

export default LostFound;
