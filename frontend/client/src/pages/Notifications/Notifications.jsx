import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notificationService";

import MainLayout from "../../layouts/MainLayout";
import { timeAgo } from "../../utils/timeAgo";
import "./Notifications.css";

import { API_URL } from "../../config";

const API_BASE = API_URL;

const ICONS = {
  like: "❤️",
  comment: "💬",
  friend_request: "🤝",
  friend_accept: "🎉",
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
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

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const linkFor = (notification) =>
    notification.type === "friend_request"
      ? "/friends"
      : `/profile/${notification.sender?.username}`;

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="notifications-header">
          <h1 className="feed-heading" style={{ marginBottom: 0 }}>
            Notifications
          </h1>
          {notifications.some((n) => !n.isRead) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleMarkAll}>
              Mark all as read
            </button>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading && <p className="empty-state">Loading notifications...</p>}

          {!loading && notifications.length === 0 && (
            <p className="empty-state">You're all caught up — no notifications yet.</p>
          )}

          {notifications.map((n) => (
            <Link
              key={n._id}
              to={linkFor(n)}
              className={`notification-row ${!n.isRead ? "unread" : ""}`}
              onClick={() => handleClick(n)}
            >
              <div className="avatar">
                {n.sender?.avatar ? (
                  <img
                    src={`${API_BASE}${n.sender.avatar}`}
                    alt={n.sender.username}
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  ICONS[n.type] || "🔔"
                )}
              </div>
              <div className="notification-text">
                <div>{n.message}</div>
                <div className="notification-time">{timeAgo(n.createdAt)}</div>
              </div>
              {!n.isRead && <span className="notification-dot" />}
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Notifications;
