import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./Home.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import FigmaDashboard from "./FigmaDashboard.jsx";
import Tests from "./Tests.jsx";
import Feedback from "./Feedback.jsx";
import FeedbackDetails from "./FeedbackDetails.jsx";
import Settings from "./Settings.jsx";
import Exam from "./Exam.jsx";
import HistoryPage from "./HistoryPage.jsx";
import Stats from "./Stats.jsx";
import HistoryDetail from "./HistoryDetails.jsx";
import Guide from "./Guide.jsx";
import StudyAssistant from "./StudyAssistant.jsx";
import AdminTestBuilder from "./AdminTestBuilder.jsx";
import AdminTestEditor from "./AdminTestEditor.jsx";
import Practice from "./Practice.jsx";
import PracticeSession from "./PracticeSession.jsx";
import About from "./About.jsx";
import TraCuu from "./TraCuu.jsx";

import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import AdminRoute from "../routes/AdminRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/huong-dan" element={<Guide />} />
      <Route path="/ve-chung-toi" element={<About />} />
      <Route path="/tra-cuu" element={<TraCuu />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <FigmaDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tests"
        element={
          <ProtectedRoute>
            <Tests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/practice"
        element={
          <ProtectedRoute>
            <Practice />
          </ProtectedRoute>
        }
      />

      <Route
        path="/practice/session"
        element={
          <ProtectedRoute>
            <PracticeSession />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tests/new"
        element={
          <AdminRoute>
            <AdminTestBuilder />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/tests/:id/edit"
        element={
          <AdminRoute>
            <AdminTestEditor />
          </AdminRoute>
        }
      />

      <Route
        path="/tro-ly-hoc-tap"
        element={
          <ProtectedRoute>
            <StudyAssistant />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exam/:id"
        element={
          <ProtectedRoute>
            <Exam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback/:id"
        element={
          <ProtectedRoute>
            <FeedbackDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history/:attemptId"
        element={
          <ProtectedRoute>
            <HistoryDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <Stats />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
