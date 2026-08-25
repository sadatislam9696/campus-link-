import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import ResetPassword from "../pages/ResetPassword/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail/VerifyEmail";
import Dashboard from "../pages/Dashboard/Dashboard";
import Profile from "../pages/Profile/Profile";
import Search from "../pages/Search/Search";
import Friends from "../pages/Friends/Friends";
import Notifications from "../pages/Notifications/Notifications";
import Chat from "../pages/Chat/Chat";
import Groups from "../pages/Groups/Groups";
import GroupDetail from "../pages/Groups/GroupDetail";
import Discussions from "../pages/Discussions/Discussions";
import DiscussionDetail from "../pages/Discussions/DiscussionDetail";

import PrivateRoute from "./PrivateRoute";

// Only admins ever load this - keeping it out of the main bundle means
// regular users never pay for its code.
const Admin = lazy(() => import("../pages/Admin/Admin"));
const Academics = lazy(() => import("../pages/Academics/Academics"));
const Confessions = lazy(() => import("../pages/Confessions/Confessions"));
const LostFound = lazy(() => import("../pages/LostFound/LostFound"));
const Teams = lazy(() => import("../pages/Teams/Teams"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const Help = lazy(() => import("../pages/Help/Help"));
const Terms = lazy(() => import("../pages/Terms/Terms"));

function AppRoutes() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile/:username"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      <Route
        path="/search"
        element={
          <PrivateRoute>
            <Search />
          </PrivateRoute>
        }
      />

      <Route
        path="/friends"
        element={
          <PrivateRoute>
            <Friends />
          </PrivateRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />

      <Route
        path="/chat/:username"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />

      <Route
        path="/chat/group/:groupId"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />

      <Route
        path="/groups"
        element={
          <PrivateRoute>
            <Groups />
          </PrivateRoute>
        }
      />

      <Route
        path="/groups/:id"
        element={
          <PrivateRoute>
            <GroupDetail />
          </PrivateRoute>
        }
      />

      <Route
        path="/discussions"
        element={
          <PrivateRoute>
            <Discussions />
          </PrivateRoute>
        }
      />

      <Route
        path="/discussions/:id"
        element={
          <PrivateRoute>
            <DiscussionDetail />
          </PrivateRoute>
        }
      />

      <Route
        path="/academics"
        element={
          <PrivateRoute>
            <Suspense fallback={<p className="empty-state">Loading...</p>}>
              <Academics />
            </Suspense>
          </PrivateRoute>
        }
      />

      <Route
        path="/confessions"
        element={
          <PrivateRoute>
            <Suspense fallback={<p className="empty-state">Loading...</p>}>
              <Confessions />
            </Suspense>
          </PrivateRoute>
        }
      />

      <Route
        path="/lost-found"
        element={
          <PrivateRoute>
            <Suspense fallback={<p className="empty-state">Loading...</p>}>
              <LostFound />
            </Suspense>
          </PrivateRoute>
        }
      />

      <Route
        path="/teams"
        element={
          <PrivateRoute>
            <Suspense fallback={<p className="empty-state">Loading...</p>}>
              <Teams />
            </Suspense>
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Suspense fallback={<p className="empty-state">Loading...</p>}>
              <Settings />
            </Suspense>
          </PrivateRoute>
        }
      />

      <Route
        path="/help"
        element={
          <PrivateRoute>
            <Suspense fallback={<p className="empty-state">Loading...</p>}>
              <Help />
            </Suspense>
          </PrivateRoute>
        }
      />

      <Route
        path="/terms"
        element={
          <PrivateRoute>
            <Suspense fallback={<p className="empty-state">Loading...</p>}>
              <Terms />
            </Suspense>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <Suspense fallback={<p className="empty-state">Loading...</p>}>
              <Admin />
            </Suspense>
          </PrivateRoute>
        }
      />

    </Routes>
  );
}

export default AppRoutes;