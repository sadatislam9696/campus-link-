import { useContext, useEffect, useRef, useState } from "react";

import {
  createPost,
  getPosts,
  toggleLike,
  votePoll,
  updatePost,
  deletePost,
} from "../../services/postService";

import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
} from "../../services/commentService";

import { AuthContext } from "../../context/AuthContext";
import MainLayout from "../../layouts/MainLayout";
import PostCard from "../../components/PostCard/PostCard";
import EmojiPicker from "../../components/EmojiPicker/EmojiPicker";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const [posts, setPosts] = useState([]);
  const [postCategory, setPostCategory] = useState("general");
  const [feedFilter, setFeedFilter] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);

  // ============================
  // Load Posts
  // ============================
  const loadPosts = async (category = feedFilter) => {
    try {
      const data = await getPosts(1, category);
      setPosts(data.posts);
      setPage(1);
      setHasMore(data.hasMore);

      data.posts.forEach((post) => {
        loadComments(post._id);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getPosts(nextPage, feedFilter);
      setPosts((prev) => [...prev, ...data.posts]);
      setPage(nextPage);
      setHasMore(data.hasMore);

      data.posts.forEach((post) => {
        loadComments(post._id);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPosts(feedFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedFilter]);

  // ============================
  // Create Post
  // ============================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : null);
    if (file) {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideo(null);
      setVideoPreview(null);
      setDocFile(null);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setVideo(file || null);
    setVideoPreview(file ? URL.createObjectURL(file) : null);
    if (file) {
      setImage(null);
      setImagePreview(null);
      setDocFile(null);
    }
  };

  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    setDocFile(file || null);
    if (file) {
      setImage(null);
      setImagePreview(null);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideo(null);
      setVideoPreview(null);
    }
  };

  const clearDoc = () => {
    setDocFile(null);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const updatePollOption = (index, value) => {
    setPollOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addPollOption = () => {
    if (pollOptions.length >= 6) return;
    setPollOptions((prev) => [...prev, ""]);
  };

  const removePollOption = (index) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetPoll = () => {
    setShowPoll(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (showPoll && (!pollQuestion.trim() || validOptions.length < 2)) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("content", content);
      formData.append("visibility", "public");
      formData.append("category", postCategory);
      if (image) formData.append("image", image);
      if (video) formData.append("video", video);
      if (docFile) formData.append("document", docFile);

      if (showPoll && pollQuestion.trim() && validOptions.length >= 2) {
        formData.append(
          "poll",
          JSON.stringify({ question: pollQuestion.trim(), options: validOptions })
        );
      }

      await createPost(formData);

      setContent("");
      setPostCategory("general");
      clearImage();
      clearVideo();
      clearDoc();
      resetPoll();
      loadPosts(feedFilter);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Like / Vote / Comment / Edit / Delete
  // ============================
  const handleLike = async (postId) => {
    // Optimistic update so the like feels instant.
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const liked = p.likes.includes(user.id);
        return {
          ...p,
          likes: liked
            ? p.likes.filter((id) => id !== user.id)
            : [...p.likes, user.id],
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

  return (
    <MainLayout>
      <div className="page-shell">
        <h1 className="feed-heading">Feed</h1>

        <div className="tab-group">
          {[
            { value: "", label: "All" },
            { value: "general", label: "💬 General" },
            { value: "event", label: "📅 Events" },
            { value: "question", label: "❓ Questions" },
            { value: "announcement", label: "📢 Announcements" },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              className={`tab-pill ${feedFilter === f.value ? "active" : ""}`}
              onClick={() => setFeedFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Create Post */}
        <form onSubmit={handleSubmit} className="card create-post-box">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { value: "general", label: "💬 General" },
                { value: "event", label: "📅 Event" },
                { value: "question", label: "❓ Question" },
                { value: "announcement", label: "📢 Announcement" },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`btn btn-sm ${postCategory === c.value ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setPostCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <EmojiPicker onSelect={(emoji) => setContent((c) => c + emoji)} />
          </div>

          <textarea
            rows={3}
            className="input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
          />

          {imagePreview && (
            <div className="create-post-preview">
              <img src={imagePreview} alt="preview" />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearImage}
              >
                ✕
              </button>
            </div>
          )}

          {video && (
            <div className="create-post-preview">
              <video src={videoPreview} controls style={{ width: "100%", maxHeight: 260 }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearVideo}>
                ✕
              </button>
            </div>
          )}

          {docFile && (
            <div className="create-post-doc-chip">
              📎 {docFile.name}
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearDoc}>
                ✕
              </button>
            </div>
          )}

          {showPoll && (
            <div className="create-post-poll">
              <input
                type="text"
                className="input"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              {pollOptions.map((opt, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updatePollOption(i, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removePollOption(i)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {pollOptions.length < 6 ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addPollOption}>
                    + Add option
                  </button>
                ) : <span />}
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetPoll}>
                  Remove poll
                </button>
              </div>
            </div>
          )}

          <div className="create-post-footer">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <label className="create-post-file-label">
                🖼️ Add photo
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>

              <label className="create-post-file-label">
                🎥 Add video
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoChange}
                />
              </label>

              <label className="create-post-file-label">
                📎 Add document
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                  onChange={handleDocChange}
                />
              </label>

              {!showPoll && (
                <button
                  type="button"
                  className="create-post-file-label"
                  onClick={() => setShowPoll(true)}
                >
                  📊 Add poll
                </button>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !content.trim()}
            >
              {loading ? <span className="spinner" /> : "Post"}
            </button>
          </div>
        </form>

        {/* Feed */}
        {postsLoading && <p className="empty-state">Loading feed...</p>}

        {!postsLoading && posts.length === 0 && (
          <p className="empty-state">
            No posts yet — be the first to share something!
          </p>
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

        {hasMore && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadMorePosts}
              disabled={loadingMore}
            >
              {loadingMore ? <span className="spinner" /> : "Load More"}
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
