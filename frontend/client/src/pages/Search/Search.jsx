import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { search } from "../../services/searchService";
import MainLayout from "../../layouts/MainLayout";
import { LoadingState } from "../../components/States/States";
import "./Search.css";

import { API_URL } from "../../config";

const API_BASE = API_URL;

function Avatar({ user }) {
  const initials = `${user?.firstName?.[0] || ""}${
    user?.lastName?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="avatar">
      {user?.avatar ? (
        <img
          src={`${API_BASE}${user.avatar}`}
          alt={user.username}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ users: [], posts: [] });
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (q) => {
    if (!q.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const data = await search(q.trim());
      setResults({ users: data.users, posts: data.posts });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runSearch(initialQuery);
    }
     
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query.trim() });
    runSearch(query);
  };

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="card search-header">
          <form onSubmit={handleSubmit}>
            <span className="search-header-icon">🔍</span>
            <input
              type="text"
              className="input"
              placeholder="Search by name, username, skills, department, university..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>

        {searched && (
          <div className="search-tabs">
            <button
              type="button"
              className={`search-tab ${tab === "users" ? "active" : ""}`}
              onClick={() => setTab("users")}
            >
              People ({results.users.length})
            </button>
            <button
              type="button"
              className={`search-tab ${tab === "posts" ? "active" : ""}`}
              onClick={() => setTab("posts")}
            >
              Posts ({results.posts.length})
            </button>
          </div>
        )}

        {loading && <LoadingState label="Searching..." />}

        {!loading && searched && tab === "users" && (
          <div className="card">
            {results.users.length === 0 && (
              <p className="empty-state">No people found for "{initialQuery}".</p>
            )}
            {results.users.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u.username}`}
                className="search-user-row"
              >
                <Avatar user={u} />
                <div>
                  <div className="search-user-name">
                    {u.firstName} {u.lastName}
                  </div>
                  <div className="search-user-meta">
                    @{u.username}
                    {u.department ? ` · ${u.department}` : ""}
                    {u.university ? ` · ${u.university}` : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && searched && tab === "posts" && (
          <div className="card">
            {results.posts.length === 0 && (
              <p className="empty-state">No posts found for "{initialQuery}".</p>
            )}
            {results.posts.map((post) => (
              <Link
                key={post._id}
                to={`/profile/${post.author?.username}`}
                className="search-user-row"
                style={{ alignItems: "flex-start" }}
              >
                <Avatar user={post.author} />
                <div>
                  <div className="search-user-name">
                    {post.author?.firstName} {post.author?.lastName}
                  </div>
                  <div className="search-user-meta">{post.content}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!searched && (
          <p className="empty-state">
            Search for classmates by name, skills, department, or university.
          </p>
        )}
      </div>
    </MainLayout>
  );
}

export default Search;
