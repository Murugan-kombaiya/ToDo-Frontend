import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './styles/CustomToast.css';
import './styles/MobileResponsive.css';
import './styles/DropdownFixes.css';
import './styles/ModernHeader.css';
import './styles/UltraModernHeader.css';
import './styles/HeaderMicroInteractions.css';
import './styles/MobileSidebar.css';
import './styles/CleanSidebar.css';
import './styles/EnhancedMobileResponsive.css';
import RouteChangeLoader from './components/RouteChangeLoader';
import RealtimeEvents from "./components/RealtimeEvents";
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import "./App.css";
import "./styles/theme.css";
import Sidebar from "./components/Sidebar.js";
import Header from "./components/Header.js";
import Dashboard from "./pages/Dashboard.js"
import Tasks from "./pages/Tasks.js";
import Board from "./pages/Board.js";
import Pomodoro from "./pages/Pomodoro.js";
import ErrorBoundary from './components/ErrorBoundary';
import "./styles/pomodoro.css";
import './styles/TimeTracker.css';
import './styles/HabitTracker.css';
import './styles/LearningProgress.css';
import './styles/Profile.css';
import './styles/NotesModern.css';
import './styles/StudySessionsModern.css';
import './styles/PRManagement.css';
import TimeTracker from "./pages/TimeTracker.js";
import HabitTracker from "./pages/HabitTracker.js";
import LearningProgress from "./pages/LearningProgress.js";
import StudySessionsModern from "./pages/StudySessionsModern.js";
import DailyGoals from "./pages/DailyGoals.js";
import Profile from "./pages/Profile.js";
import NotesModern from "./pages/NotesModern.js";
import PRManagement from "./pages/PRManagement.js";
import Analytics from "./pages/Analytics.js";
import './styles/Analytics.css';

// Import Auth Pages
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import ForgotPassword from "./pages/ForgotPassword.js";
import { isTokenLikelyExpired } from "./utils/authUtils.js";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  // If no token or token is expired, redirect to login
  if (!token || isTokenLikelyExpired(token)) {
    // Clear any invalid tokens
    if (token && isTokenLikelyExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <ErrorBoundary>
      {/* Global 1s loader on route changes */}
      <RouteChangeLoader minDurationMs={1000} />
      {/* Global toast container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
        theme={theme === 'dark' ? 'dark' : 'light'}
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        progressClassName="custom-toast-progress"
      />
      {/* Real-time socket listeners */}
      <RealtimeEvents />

      <Routes>
        {/* Auth Routes - No Header/Sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Main App Routes - With Header/Sidebar */}
        <Route path="/*" element={
          <>
            <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
            <div className="layout">
              <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                  <Route path="/board" element={<ProtectedRoute><Board /></ProtectedRoute>} />
                  <Route path="/pomodoro" element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
                  <Route path="/timetracker" element={<ProtectedRoute><TimeTracker /></ProtectedRoute>} />
                  <Route path="/habits" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
                  <Route path="/learning" element={<ProtectedRoute><LearningProgress /></ProtectedRoute>} />
                  <Route path="/sessions" element={<ProtectedRoute><StudySessionsModern /></ProtectedRoute>} />
                  <Route path="/prs" element={<ProtectedRoute><PRManagement /></ProtectedRoute>} />
                  <Route path="/notes" element={<ProtectedRoute><NotesModern /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/daily-goals" element={<ProtectedRoute><DailyGoals /></ProtectedRoute>} />
                  <Route path="*" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                </Routes>
              </main>
            </div>
          </>
        } />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}