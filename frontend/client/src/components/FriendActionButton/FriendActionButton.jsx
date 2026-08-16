import { useEffect, useState } from "react";

import {
  getFriendStatus,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../../services/friendService";

import "./FriendActionButton.css";

function FriendActionButton({ userId }) {
  const [status, setStatus] = useState("loading");
  const [requestId, setRequestId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await getFriendStatus(userId);
      setStatus(data.status);
      setRequestId(data.requestId || null);
    } catch (error) {
      console.error(error);
      setStatus("none");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await loadStatus();
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  };

  if (status === "loading" || status === "self") return null;

  if (status === "none") {
    return (
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => run(() => sendFriendRequest(userId))}
      >
        {busy ? <span className="spinner" /> : "➕ Add Friend"}
      </button>
    );
  }

  if (status === "pending_sent") {
    return (
      <button
        type="button"
        className="btn btn-ghost"
        disabled={busy}
        onClick={() => run(() => cancelFriendRequest(requestId))}
      >
        {busy ? <span className="spinner" /> : "Cancel Request"}
      </button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="friend-action-group">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => run(() => acceptFriendRequest(requestId))}
        >
          Accept
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => run(() => rejectFriendRequest(requestId))}
        >
          Reject
        </button>
      </div>
    );
  }

  // status === "friends"
  return (
    <div className="friend-action-dropdown">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setMenuOpen((v) => !v)}
      >
        ✓ Friends
      </button>

      {menuOpen && (
        <div className="friend-action-dropdown-menu">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => removeFriend(userId))}
          >
            Remove Friend
          </button>
        </div>
      )}
    </div>
  );
}

export default FriendActionButton;
