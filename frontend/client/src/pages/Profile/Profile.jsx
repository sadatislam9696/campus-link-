import { useContext, useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { getPublicProfile, uploadCoverPhoto } from "../../services/profileService";
import { getUserPosts, toggleLike, votePoll, deletePost, updatePost } from "../../services/postService";
import { getComments, addComment, updateComment, deleteComment } from "../../services/commentService";

import MainLayout from "../../layouts/MainLayout";
import { LoadingState } from "../../components/States/States";
import PostCard from "../../components/PostCard/PostCard";
import EditProfileModal from "../../components/EditProfileModal/EditProfileModal";
import FriendActionButton from "../../components/FriendActionButton/FriendActionButton";
import ReportModal from "../../components/ReportModal/ReportModal";
import { getFriendsList } from "../../services/friendService";
import "./Profile.css";

import { API_URL } from "../../config";

const API_BASE = API_URL;

const TABS = ["About", "Posts", "Friends", "Skills"];

function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, setUser: setCurrentUser } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("About");
  const [editing, setEditing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef(null);
  const [reportingUser, setReportingUser] = useState(false);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});

  const [friendsList, setFriendsList] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  const isOwnProfile = currentUser && profile && currentUser.username === profile.username;

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);

    try {
      const data = await getPublicProfile(username);
      setProfile(data.user);
    } catch (error) {
      console.error(error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
    setActiveTab("About");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const data = await getUserPosts(username);
      setPosts(data.posts);
      data.posts.forEach((post) => loadComments(post._id));
    } catch (error) {
      console.error(error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadComments = async (postId) => {
    try {
      const data = await getComments(postId);
      setComments((prev) => ({ ...prev, [postId]: data.comments }));
    } catch (error) {
      console.error(error);
    }
  };

  const loadFriends = async () => {
    setFriendsLoading(true);
    try {
      const data = await getFriendsList(username);
      setFriendsList(data.friends);
    } catch (error) {
      console.error(error);
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Posts" && profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPosts();
    }

    if (activeTab === "Friends" && profile) {
       
      loadFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile]);

  const handleLike = async (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const liked = p.likes.includes(currentUser.id);
        return {
          ...p,
          likes: liked
            ? p.likes.filter((id) => id !== currentUser.id)
            : [...p.likes, currentUser.id],
        };
      })
    );
    try {
      await toggleLike(postId);
    } catch (error) {
      console.error(error);
      loadPosts();
    }
  };

  const handleVote = async (postId, optionIndex) => {
    try {
      const data = await votePoll(postId, optionIndex);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, poll: data.poll } : p))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleComment = async (postId, text, parentComment) => {
    if (!text?.trim()) return;
    try {
      await addComment(postId, text.trim(), parentComment);
      if (!parentComment) {
        setCommentInput((prev) => ({ ...prev, [postId]: "" }));
      }
      loadComments(postId);
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCommentEdit = async (postId, commentId, text) => {
    try {
      await updateComment(commentId, text);
      loadComments(postId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    try {
      await deleteComment(commentId);
      loadComments(postId);
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditPost = async (postId, newContent) => {
    try {
      await updatePost(postId, { content: newContent });
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleProfileSaved = (updatedFields) => {
    const merged = { ...profile, ...updatedFields };
    setProfile(merged);

    if (isOwnProfile) {
      setCurrentUser((prev) => ({ ...prev, ...updatedFields }));
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const data = await uploadCoverPhoto(file);
      setProfile((prev) => ({ ...prev, coverPhoto: data.coverPhoto }));
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <LoadingState label="Loading profile..." />
      </MainLayout>
    );
  }

  if (notFound || !profile) {
    return (
      <MainLayout>
        <p className="empty-state">This user could not be found.</p>
      </MainLayout>
    );
  }

  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase();

  return (
    <MainLayout>
      <main className="profile-page">
        <div className="profile-hero">
        <section className="profile-cover" aria-label="Cover photo">
          {profile.coverPhoto && (
            <img
              src={`${API_BASE}${profile.coverPhoto}`}
              alt=""
              className="profile-cover-image"
            />
          )}
          <div className="profile-cover__overlay" />

          {isOwnProfile && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm profile-cover-edit-btn"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? <span className="spinner" /> : "📷 Change Cover"}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleCoverChange}
              />
            </>
          )}

        </section>

          <div className="profile-avatar" aria-hidden="true">
            {profile.avatar ? (
              <img
                src={`${API_BASE}${profile.avatar}`}
                alt={profile.username}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>
        </div>

        <section className="profile-summary">
          <div className="profile-title">
            <h1>
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="profile-subtitle">
              @{profile.username}
              {profile.major ? ` · ${profile.major}` : ""}
            </p>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <button type="button" className="btn btn-tertiary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            ) : (
              <>
                <FriendActionButton userId={profile._id} />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(`/chat/${profile.username}`)}
                >
                  💬 Message
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setReportingUser(true)}
                  title="Report this user"
                >
                  🚩
                </button>
              </>
            )}
          </div>

          <div className="profile-navigation">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`profile-nav-item${activeTab === tab ? " active" : ""}`}
                aria-pressed={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <section className="profile-body">
          <div className="profile-column">
            {activeTab === "About" && (
              <article className="profile-card">
                <h2>About</h2>
                <p>{profile.bio || "No bio added yet."}</p>
              </article>
            )}

            {activeTab === "Skills" && (
              <article className="profile-card">
                <h2>Skills</h2>
                {profile.skills?.length ? (
                  <ul className="profile-list">
                    {profile.skills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No skills added yet.</p>
                )}
              </article>
            )}

            {activeTab === "Friends" && (
              <article className="profile-card">
                <h2>Friends</h2>
                {friendsLoading && <LoadingState label="Loading friends..." />}
                {!friendsLoading && friendsList.length === 0 && (
                  <p className="empty-state">No friends yet.</p>
                )}
                <div className="people-grid">
                  {friendsList.map((f) => (
                    <Link key={f._id} to={`/profile/${f.username}`} className="people-row">
                      <div className="avatar" style={{ width: 42, height: 42 }}>
                        {f.avatar ? (
                          <img
                            src={`${API_BASE}${f.avatar}`}
                            alt={f.username}
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          `${f.firstName?.[0] || ""}${f.lastName?.[0] || ""}`
                        )}
                      </div>
                      <div>
                        <div className="people-name">
                          {f.firstName} {f.lastName}
                        </div>
                        <div className="people-meta">@{f.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </article>
            )}

            {activeTab === "Posts" && (
              <div>
                {postsLoading && <LoadingState label="Loading posts..." />}
                {!postsLoading && posts.length === 0 && (
                  <p className="empty-state">No posts yet.</p>
                )}
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    comments={comments[post._id] || []}
                    commentValue={commentInput[post._id] || ""}
                    onCommentChange={(val) =>
                      setCommentInput((prev) => ({ ...prev, [post._id]: val }))
                    }
                    onCommentSubmit={(text, parentComment) => handleComment(post._id, text, parentComment)}
                    onCommentEdit={(commentId, text) => handleCommentEdit(post._id, commentId, text)}
                    onCommentDelete={(commentId) => handleCommentDelete(post._id, commentId)}
                    onLike={() => handleLike(post._id)}
                    onVote={(optionIndex) => handleVote(post._id, optionIndex)}
                    onDelete={() => handleDeletePost(post._id)}
                    onEdit={(newContent) => handleEditPost(post._id, newContent)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="profile-sidebar">
            <article className="profile-card">
              <h2>Academic Info</h2>
              <div className="profile-metrics">
                <div className="profile-metric">
                  <div>
                    <strong>University</strong>
                    <span>{profile.university || "—"}</span>
                  </div>
                </div>
                <div className="profile-metric">
                  <div>
                    <strong>Department</strong>
                    <span>{profile.department || "—"}</span>
                  </div>
                </div>
                <div className="profile-metric">
                  <div>
                    <strong>Academic Year</strong>
                    <span>{profile.academicYear || "—"}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>

      {editing && (
        <EditProfileModal
          user={profile}
          onClose={() => setEditing(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {reportingUser && (
        <ReportModal
          targetType="user"
          targetId={profile._id}
          onClose={() => setReportingUser(false)}
        />
      )}
    </MainLayout>
  );
}

export default Profile;
