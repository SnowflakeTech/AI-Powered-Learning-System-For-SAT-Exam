import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const loc = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  // khi refresh, token có thể có nhưng /user/me chưa kịp trả về
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600">
        Đang tải...
      </div>
    );
  }

  if (user.role !== "admin") {
    return <Navigate to="/tests" replace />;
  }

  return children;
}
