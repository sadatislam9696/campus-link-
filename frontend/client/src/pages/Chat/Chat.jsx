import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiUsers,
  FiUserPlus,
  FiMessageCircle,
  FiMoreHorizontal,
  FiEdit2,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { SocketContext } from "../../context/SocketContext";
import { AuthContext } from "../../context/AuthContext";
import { getConversations, getMessages, updateMessage, deleteMessage } from "../../services/messageService";
import { getPublicProfile } from "../../services/profileService";
import {
  getMyGroupChats,
  getGroupChat,
  createGroupChat,
  leaveGroupChat,
  updateGroupMessage,
  deleteGroupMessage,
} from "../../services/groupChatService";
import { getFriendsList } from "../../services/friendService";

import MainLayout from "../../layouts/MainLayout";
import { LoadingState } from "../../components/States/States";
import "./Chat.css";

import { API_URL } from "../../config";

const API_BASE = API_URL;

function Avatar({ user, online, isGroup }) {
  const initials = `${user?.firstName?.[0] || ""}${
    user?.lastName?.[0] || ""
  }`.toUpperCase();

  if (isGroup) {
    return (
      <div className="avatar" style={{ background: "var(--color-primary-light)" }}>
        <FiUsers aria-hidden="true" />
      </div>
    );
  }

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
      {online && <span className="chat-online-dot" />}
    </div>
  );
}

const formatTime = (dateString) =>
  new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function NewGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getFriendsList(user.username);
        setFriends(data.friends);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (!name.trim() || selected.length < 2) {
      setError("Give the group a name and pick at least 2 friends.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await createGroupChat(name.trim(), selected);
      onCreated(data.conversation);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create group.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>New Group Chat</h2>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Group Name
        </label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CSE Final Year" />

        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
          Add Friends ({selected.length} selected)
        </label>
        <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
          {friends.length === 0 && (
            <p className="empty-state" style={{ padding: 16 }}>
              You need friends to start a group chat with.
            </p>
          )}
          {friends.map((f) => (
            <label
              key={f._id}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--color-border)" }}
            >
              <input type="checkbox" checked={selected.includes(f._id)} onChange={() => toggle(f._id)} />
              <Avatar user={f} />
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{f.firstName} {f.lastName}</span>
            </label>
          ))}
        </div>

        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chat() {
  const { username, groupId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [activeType, setActiveType] = useState(null); // "direct" | "group" | null
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ============================
  // Load conversation lists (direct + group)
  // ============================
  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations);
    } catch (error) {
      console.error(error);
    }
  };

  const loadGroupChats = async () => {
    try {
      const data = await getMyGroupChats();
      setGroupChats(data.conversations);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
     
    loadGroupChats();
  }, []);

  // ============================
  // Resolve URL params into an active thread
  // ============================
  useEffect(() => {
    const openThread = async () => {
      // Leave whichever group room we were previously in.
      if (activeType === "group" && active?._id) {
        socket?.emit("leaveGroupRoom", { conversationId: active._id });
      }

      if (groupId) {
        try {
          const data = await getGroupChat(groupId);
          setActive(data.conversation);
          setActiveType("group");
          socket?.emit("joinGroupRoom", { conversationId: groupId });
        } catch (error) {
          console.error(error);
          setActive(null);
          setActiveType(null);
        }
        return;
      }

      if (!username) {
        setActive(null);
        setActiveType(null);
        return;
      }

      const existing = conversations.find((c) => c.user.username === username);

      if (existing) {
        setActive(existing.user);
        setActiveType("direct");
        return;
      }

      try {
        const data = await getPublicProfile(username);
        setActive(data.user);
        setActiveType("direct");
      } catch (error) {
        console.error(error);
        setActive(null);
        setActiveType(null);
      }
    };

     
    openThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, groupId, socket, conversations.length]);

  // ============================
  // Load message history for the active thread
  // ============================
  useEffect(() => {
    const loadThread = async () => {
      if (!active?._id) {
        setMessages([]);
        return;
      }

      if (activeType === "group") {
        // getGroupChat above already returns the full message history.
        setLoadingThread(true);
        try {
          const data = await getGroupChat(active._id);
          setMessages(data.messages);
        } catch (error) {
          console.error(error);
        } finally {
          setLoadingThread(false);
        }
        return;
      }

      setLoadingThread(true);
      try {
        const data = await getMessages(active._id);
        setMessages(data.messages);
        socket?.emit("markSeen", { senderId: active._id });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingThread(false);
      }
    };

     
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?._id, activeType]);

  // ============================
  // Socket listeners
  // ============================
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (activeType === "direct" && active) {
        const involvesActiveThread =
          message.sender === active._id || message.receiver === active._id;

        if (involvesActiveThread) {
          setMessages((prev) => [...prev, message]);
          if (message.sender === active._id) {
            socket.emit("markSeen", { senderId: active._id });
          }
        }
      }

      loadConversations();
    };

    const handleNewGroupMessage = (message) => {
      if (activeType === "group" && active && message.conversation === active._id) {
        setMessages((prev) => [...prev, message]);
      }
      loadGroupChats();
    };

    const handleTyping = ({ senderId }) => {
      if (activeType === "direct" && active && senderId === active._id) setOtherTyping(true);
    };

    const handleStopTyping = ({ senderId }) => {
      if (activeType === "direct" && active && senderId === active._id) setOtherTyping(false);
    };

    const handleSeen = ({ by }) => {
      if (activeType === "direct" && active && by === active._id) {
        setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
      }
    };

    const handleMessageUpdated = (updated) => {
      setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    };

    const handleMessageDeleted = ({ _id }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === _id ? { ...m, isDeleted: true, text: "" } : m))
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("seen", handleSeen);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("groupMessageUpdated", handleMessageUpdated);
    socket.on("groupMessageDeleted", handleMessageDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("seen", handleSeen);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("groupMessageUpdated", handleMessageUpdated);
      socket.off("groupMessageDeleted", handleMessageDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, active?._id, activeType]);

  // ============================
  // Auto-scroll to newest message
  // ============================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close the "..." message menu when clicking anywhere else.
  useEffect(() => {
    if (!openMenuId) return;
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [openMenuId]);

  // ============================
  // Send message + typing indicator
  // ============================
  const handleTextChange = (val) => {
    setText(val);

    if (!socket || !active || activeType !== "direct") return;

    socket.emit("typing", { receiverId: active._id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: active._id });
    }, 1200);
  };

  const handleSend = (e) => {
    e.preventDefault();

    if (!text.trim() || !active || !socket) return;

    setSendError("");

    if (activeType === "group") {
      socket.emit("sendGroupMessage", { conversationId: active._id, text: text.trim() }, (response) => {
        if (response && response.success === false) setSendError(response.message);
      });
    } else {
      socket.emit(
        "sendMessage",
        { receiverId: active._id, text: text.trim() },
        (response) => {
          if (response && response.success === false) {
            setSendError(response.message);
          }
        }
      );
      socket.emit("stopTyping", { receiverId: active._id });
    }

    setText("");
  };

  const startEdit = (message) => {
    setEditingId(message._id);
    setEditText(message.text);
    setOpenMenuId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (message) => {
    if (!editText.trim()) return;

    try {
      if (activeType === "group") {
        const data = await updateGroupMessage(message._id, editText.trim());
        setMessages((prev) => prev.map((m) => (m._id === message._id ? data.message : m)));
      } else {
        const data = await updateMessage(message._id, editText.trim());
        setMessages((prev) => prev.map((m) => (m._id === message._id ? data.message : m)));
      }
      cancelEdit();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMessage = async (message) => {
    setOpenMenuId(null);
    if (!confirm("Delete this message?")) return;

    try {
      if (activeType === "group") {
        await deleteGroupMessage(message._id);
      } else {
        await deleteMessage(message._id);
      }
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? { ...m, isDeleted: true, text: "" } : m))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Leave this group chat?")) return;
    try {
      await leaveGroupChat(active._id);
      navigate("/chat");
      loadGroupChats();
    } catch (error) {
      console.error(error);
    }
  };

  // Merge both lists for the sidebar, sorted by most recent activity.
  const combinedList = [
    ...conversations.map((c) => ({
      key: `direct-${c.user._id}`,
      type: "direct",
      name: `${c.user.firstName} ${c.user.lastName}`,
      preview: c.lastMessage,
      unread: c.unreadCount,
      user: c.user,
      onClick: () => navigate(`/chat/${c.user.username}`),
      isActive: activeType === "direct" && active?._id === c.user._id,
      lastMessageAt: c.lastMessageAt,
    })),
    ...groupChats.map((g) => ({
      key: `group-${g._id}`,
      type: "group",
      name: g.name,
      preview: g.lastMessage,
      unread: g.unreadCount,
      onClick: () => navigate(`/chat/group/${g._id}`),
      isActive: activeType === "group" && active?._id === g._id,
      lastMessageAt: g.lastMessageAt,
    })),
  ].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

  return (
    <MainLayout rightPanel={null}>
      <div className={`chat-shell${active ? " has-active" : ""}`}>
        <aside className="chat-list">
          <div className="chat-list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Messages
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowNewGroup(true)}
              title="New group"
              aria-label="New group chat"
            >
              <FiUserPlus aria-hidden="true" />
            </button>
          </div>

          {combinedList.length === 0 && (
            <p className="empty-state" style={{ padding: 20 }}>
              No conversations yet. Message a friend from their profile!
            </p>
          )}

          {combinedList.map((c) => (
            <div
              key={c.key}
              className={`chat-list-item ${c.isActive ? "active" : ""}`}
              onClick={c.onClick}
            >
              <Avatar user={c.user} isGroup={c.type === "group"} online={c.user && onlineUsers.includes(c.user._id)} />
              <div className="chat-list-info">
                <div className="chat-list-name">{c.name}</div>
                <div className="chat-list-preview">{c.preview || "No messages yet"}</div>
              </div>
              {c.unread > 0 && (
                <span className="chat-unread-badge">{c.unread}</span>
              )}
            </div>
          ))}
        </aside>

        <section className="chat-thread">
          {!active ? (
            <div className="chat-empty">
              <span className="empty-state-icon"><FiMessageCircle aria-hidden="true" /></span>
              <p>Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="chat-thread-header">
                <button
                  type="button"
                  className="chat-back-btn"
                  onClick={() => navigate("/chat")}
                  aria-label="Back to conversations"
                >
                  <FiChevronLeft />
                </button>

                <Avatar user={active} isGroup={activeType === "group"} online={activeType === "direct" && onlineUsers.includes(active._id)} />
                <div style={{ flex: 1 }}>
                  <div className="chat-thread-name">
                    {activeType === "group" ? active.name : `${active.firstName} ${active.lastName}`}
                  </div>
                  <div className="chat-thread-status">
                    {activeType === "group"
                      ? `${active.members?.length || 0} members`
                      : onlineUsers.includes(active._id) ? "Online" : "Offline"}
                  </div>
                </div>
                {activeType === "group" && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleLeaveGroup}>
                    Leave
                  </button>
                )}
              </div>

              <div className="chat-messages">
                {loadingThread && <LoadingState label="Loading messages..." />}

                {!loadingThread && messages.length === 0 && (
                  <p className="empty-state">Say hi to start the conversation.</p>
                )}

                {messages.map((m) => {
                  const senderId = m.sender?._id || m.sender;
                  const mine = senderId === me.id;
                  const isEditing = editingId === m._id;

                  return (
                    <div key={m._id} className={`chat-bubble-row ${mine ? "mine" : ""}`}>
                      <div className="chat-bubble-content">
                        {activeType === "group" && !mine && (
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: 2 }}>
                            {m.sender?.firstName}
                          </div>
                        )}

                        {isEditing ? (
                          <div className="chat-bubble-edit-row">
                            <input
                              type="text"
                              className="input"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(m);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              autoFocus
                            />
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(m)}>
                              Save
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                              <FiX aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <div className="chat-bubble">
                            {m.isDeleted ? (
                              <em style={{ opacity: 0.7 }}>This message was deleted</em>
                            ) : (
                              m.text
                            )}
                          </div>
                        )}

                        <div className="chat-bubble-time">
                          {formatTime(m.createdAt)}
                          {m.isEdited && !m.isDeleted ? " · edited" : ""}
                          {mine && activeType === "direct" && m.seen ? " · Seen" : ""}

                          {mine && !m.isDeleted && !isEditing && (
                            <div className="chat-bubble-menu">
                              <button
                                type="button"
                                className="chat-bubble-menu-btn"
                                onClick={() => setOpenMenuId(openMenuId === m._id ? null : m._id)}
                                aria-label="Message options"
                              >
                                <FiMoreHorizontal aria-hidden="true" />
                              </button>
                              {openMenuId === m._id && (
                                <div className="chat-bubble-menu-dropdown">
                                  <button type="button" onClick={() => startEdit(m)}>
                                    <FiEdit2 aria-hidden="true" /> Edit
                                  </button>
                                  <button type="button" onClick={() => handleDeleteMessage(m)}>
                                    <FiTrash2 aria-hidden="true" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {otherTyping && activeType === "direct" && (
                <div className="chat-typing">{active.firstName} is typing...</div>
              )}

              {sendError && (
                <p className="error-text" style={{ margin: "0 14px" }}>
                  {sendError}
                </p>
              )}

              <form className="chat-input-row" onSubmit={handleSend}>
                <input
                  type="text"
                  className="input"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreated={(conversation) => {
            setShowNewGroup(false);
            loadGroupChats();
            navigate(`/chat/group/${conversation._id}`);
          }}
        />
      )}
    </MainLayout>
  );
}

export default Chat;
