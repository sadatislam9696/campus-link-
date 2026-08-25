import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getIncomingRequests,
  getSentRequests,
  getFriendSuggestions,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  sendFriendRequest,
} from "../../services/friendService";

import MainLayout from "../../layouts/MainLayout";
import { LoadingState } from "../../components/States/States";
import "./Friends.css";

import { API_URL } from "../../config";

const API_BASE = API_URL;

function PersonAvatar({ user }) {
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

const TABS = [
  { key: "incoming", label: "Requests" },
  { key: "sent", label: "Sent" },
  { key: "suggestions", label: "Suggestions" },
];

function Friends() {
  const [tab, setTab] = useState("incoming");
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [incomingRes, sentRes, suggestionsRes] = await Promise.all([
        getIncomingRequests(),
        getSentRequests(),
        getFriendSuggestions(),
      ]);
      setIncoming(incomingRes.requests);
      setSent(sentRes.requests);
      setSuggestions(suggestionsRes.suggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  const handleAccept = async (requestId) => {
    setBusyId(requestId);
    try {
      await acceptFriendRequest(requestId);
      loadAll();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestId) => {
    setBusyId(requestId);
    try {
      await rejectFriendRequest(requestId);
      loadAll();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (requestId) => {
    setBusyId(requestId);
    try {
      await cancelFriendRequest(requestId);
      loadAll();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  const handleSendRequest = async (userId) => {
    setBusyId(userId);
    try {
      await sendFriendRequest(userId);
      loadAll();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <MainLayout>
      <div className="page-shell">
        <h1 className="feed-heading">Friends</h1>

        <div className="friends-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`friends-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === "incoming" && incoming.length > 0 ? ` (${incoming.length})` : ""}
            </button>
          ))}
        </div>

        {loading && <LoadingState label="Loading..." />}

        {!loading && tab === "incoming" && (
          <div className="card" style={{ padding: 0 }}>
            {incoming.length === 0 && (
              <p className="empty-state">No incoming friend requests.</p>
            )}
            {incoming.map((req) => (
              <div key={req._id} className="friend-request-row">
                <PersonAvatar user={req.sender} />
                <div className="friend-request-info">
                  <Link to={`/profile/${req.sender.username}`} className="friend-request-name">
                    {req.sender.firstName} {req.sender.lastName}
                  </Link>
                  <div className="friend-request-meta">@{req.sender.username}</div>
                </div>
                <div className="friend-request-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === req._id}
                    onClick={() => handleAccept(req._id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busyId === req._id}
                    onClick={() => handleReject(req._id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "sent" && (
          <div className="card" style={{ padding: 0 }}>
            {sent.length === 0 && (
              <p className="empty-state">You haven't sent any friend requests.</p>
            )}
            {sent.map((req) => (
              <div key={req._id} className="friend-request-row">
                <PersonAvatar user={req.receiver} />
                <div className="friend-request-info">
                  <Link to={`/profile/${req.receiver.username}`} className="friend-request-name">
                    {req.receiver.firstName} {req.receiver.lastName}
                  </Link>
                  <div className="friend-request-meta">@{req.receiver.username}</div>
                </div>
                <div className="friend-request-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busyId === req._id}
                    onClick={() => handleCancel(req._id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "suggestions" && (
          <div className="card" style={{ padding: 0 }}>
            {suggestions.length === 0 && (
              <p className="empty-state">No suggestions right now.</p>
            )}
            {suggestions.map((s) => (
              <div key={s._id} className="friend-request-row">
                <PersonAvatar user={s} />
                <div className="friend-request-info">
                  <Link to={`/profile/${s.username}`} className="friend-request-name">
                    {s.firstName} {s.lastName}
                  </Link>
                  <div className="friend-request-meta">
                    @{s.username}
                    {s.department ? ` · ${s.department}` : ""}
                  </div>
                </div>
                <div className="friend-request-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === s._id}
                    onClick={() => handleSendRequest(s._id)}
                  >
                    Add Friend
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Friends;
