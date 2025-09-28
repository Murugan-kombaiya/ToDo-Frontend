import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/Profile.css';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Profile() {
  const { theme, setTheme, isAuto } = useTheme();
  const [profile, setProfile] = useState({
    username: localStorage.getItem('username') || '',
    email: '',
    phone: '',
    full_name: '',
    profile_photo: '',
    is_verified: false,
    joined_date: new Date().toISOString(),
    last_active: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'English',
    account_type: 'Free'
  });

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fileInputRef = useRef(null);

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalGoals: 0,
    completedGoals: 0,
    studyHours: 0,
    studySessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalHabits: 0,
    completedHabits: 0,
    learningProgress: 0,
    totalNotes: 0
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [productivityGoal, setProductivityGoal] = useState({
    dailyTasks: 5,
    weeklyStudyHours: 10,
    monthlyGoals: 20
  });
  const [notificationSettings, setNotificationSettings] = useState({
    taskReminders: true,
    goalDeadlines: true,
    studyBreaks: false,
    achievements: true,
    emailNotifications: true,
    pushNotifications: false
  });
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  // const [showProductivityGraph, setShowProductivityGraph] = useState(false);

  useEffect(() => {
    fetchProfileData();
    fetchUserStats();
    fetchRecentActivity();
    fetchAchievements();
    loadUserPreferences();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserPreferences = () => {
    const savedGoals = localStorage.getItem('productivityGoals');
    const savedNotifications = localStorage.getItem('notificationSettings');

    if (savedGoals) {
      setProductivityGoal(JSON.parse(savedGoals));
    }
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications));
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/profile', {
        headers: authHeaders()
      });

      if (response.ok) {
        const userData = await response.json();
        setProfile(userData);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
      // Fallback to localStorage data
      const userData = {
        username: localStorage.getItem('username') || 'User',
        email: '',
        phone: '',
        full_name: '',
        profile_photo: '',
        is_verified: false
      };
      setProfile(userData);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch all data in parallel
      const [tasksRes, goalsRes, sessionsRes, habitsRes, learningRes, notesRes] = await Promise.all([
        fetch('/tasks', { headers: authHeaders() }).catch(() => ({ json: () => [] })),
        fetch('/daily-goals', { headers: authHeaders() }).catch(() => ({ json: () => [] })),
        fetch('/study-sessions', { headers: authHeaders() }).catch(() => ({ json: () => [] })),
        fetch('/habits', { headers: authHeaders() }).catch(() => ({ json: () => [] })),
        fetch('/learning/progress', { headers: authHeaders() }).catch(() => ({ json: () => [] })),
        fetch('/notes', { headers: authHeaders() }).catch(() => ({ json: () => [] }))
      ]);

      const tasks = await tasksRes.json().catch(() => []);
      const goals = await goalsRes.json().catch(() => []);
      const sessions = await sessionsRes.json().catch(() => []);
      const habits = await habitsRes.json().catch(() => []);
      const learning = await learningRes.json().catch(() => []);
      const notes = await notesRes.json().catch(() => []);

      // Calculate statistics
      const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
      const completedTasks = Array.isArray(tasks) ? tasks.filter(t => t.status === 'done').length : 0;
      const totalGoals = Array.isArray(goals) ? goals.length : 0;
      const completedGoals = Array.isArray(goals) ? goals.filter(g => g.status === 'completed').length : 0;
      const studySessions = Array.isArray(sessions) ? sessions.length : 0;
      const studyHours = Array.isArray(sessions)
        ? Math.round(sessions.reduce((total, session) => total + (session.duration_minutes || 0), 0) / 60)
        : 0;
      const totalHabits = Array.isArray(habits) ? habits.length : 0;
      const completedHabits = Array.isArray(habits) ? habits.filter(h => h.status === 'completed').length : 0;
      const learningProgress = Array.isArray(learning) && learning.length > 0
        ? Math.round(learning.reduce((sum, item) => sum + (item.progress_percentage || 0), 0) / learning.length)
        : 0;
      const totalNotes = Array.isArray(notes) ? notes.length : 0;

      // Calculate streaks (simplified version)
      const currentStreak = calculateCurrentStreak(tasks, goals, sessions);
      const longestStreak = calculateLongestStreak(tasks, goals, sessions);

      setStats({
        totalTasks,
        completedTasks,
        totalGoals,
        completedGoals,
        studyHours,
        studySessions,
        currentStreak,
        longestStreak,
        totalHabits,
        completedHabits,
        learningProgress,
        totalNotes
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const calculateCurrentStreak = (tasks, goals, sessions) => {
    // Simplified streak calculation based on recent activity
    const now = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toDateString();
      const hasActivity = [
        ...Array.isArray(tasks) ? tasks : [],
        ...Array.isArray(goals) ? goals : [],
        ...Array.isArray(sessions) ? sessions : []
      ].some(item => new Date(item.created_at || item.updated_at || 0).toDateString() === dateStr);

      if (hasActivity) streak++;
      else break;
    }
    return streak;
  };

  const calculateLongestStreak = (tasks, goals, sessions) => {
    // Simplified longest streak calculation
    return Math.max(7, Math.floor(Math.random() * 20) + 5); // Placeholder
  };

  const fetchRecentActivity = async () => {
    try {
      // Combine recent items from different endpoints
      const activities = [];

      // Add some sample recent activities (in real app, this would come from API)
      activities.push(
        { id: 1, type: 'task', action: 'completed', description: 'Completed daily standup task', time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: 2, type: 'goal', action: 'achieved', description: 'Achieved daily coding goal', time: new Date(Date.now() - 5 * 60 * 60 * 1000) },
        { id: 3, type: 'study', action: 'finished', description: 'Finished React study session (45 min)', time: new Date(Date.now() - 8 * 60 * 60 * 1000) },
        { id: 4, type: 'habit', action: 'tracked', description: 'Logged morning workout habit', time: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      );

      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      // Enhanced achievements with more variety
      const achievements = [
        { id: 1, title: 'First Week', description: 'Completed your first week!', icon: '🎯', unlocked: true, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { id: 2, title: 'Task Master', description: 'Completed 50+ tasks', icon: '✅', unlocked: true, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { id: 3, title: 'Study Streak', description: 'Study for 7 days in a row', icon: '📚', unlocked: stats.currentStreak >= 7 },
        { id: 4, title: 'Goal Getter', description: 'Achieve 20 daily goals', icon: '🏆', unlocked: stats.completedGoals >= 20 },
        { id: 5, title: 'Early Bird', description: 'Complete tasks before 9 AM', icon: '🌅', unlocked: false },
        { id: 6, title: 'Night Owl', description: 'Complete tasks after 10 PM', icon: '🦉', unlocked: false },
        { id: 7, title: 'Productivity Master', description: 'Achieve 90+ productivity score', icon: '⚡', unlocked: calculateProductivityScore() >= 90 },
        { id: 8, title: 'Learning Champion', description: 'Complete 5 learning subjects', icon: '🎓', unlocked: stats.learningProgress >= 80 }
      ];

      setAchievements(achievements);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          email: profile.email,
          profile_photo: profile.profile_photo
        })
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      // Convert image to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;

        // Update local state immediately for UI feedback
        setProfile(prev => ({
          ...prev,
          profile_photo: base64Image
        }));

        try {
          // Automatically save photo to backend
          const response = await fetch('/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders()
            },
            body: JSON.stringify({
              full_name: profile.full_name,
              email: profile.email,
              profile_photo: base64Image
            })
          });

          if (response.ok) {
            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            toast.success('Photo uploaded and saved successfully!');
          } else {
            throw new Error('Failed to save photo');
          }
        } catch (saveError) {
          console.error('Error saving photo:', saveError);
          toast.error('Photo uploaded but failed to save. Please try saving manually.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!changePasswordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!changePasswordData.newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (changePasswordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: changePasswordData.currentPassword,
          newPassword: changePasswordData.newPassword
        })
      });

      if (response.ok) {
        toast.success('Password changed successfully!');
        setShowForgotPassword(false);
        setChangePasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    }
  };

  // const getCompletionRate = (completed, total) => {
  //   if (total === 0) return 0;
  //   return Math.round((completed / total) * 100);
  // };

  const getProfileCompletionPercentage = () => {
    const fields = [
      profile.email,
      profile.full_name,
      profile.profile_photo
    ];
    const completed = fields.filter(field => field).length;
    return Math.round((completed / fields.length) * 100);
  };

  // const getTimeAgo = (date) => {
  //   const now = new Date();
  //   const diff = now - new Date(date);
  //   const minutes = Math.floor(diff / 60000);
  //   const hours = Math.floor(diff / 3600000);
  //   const days = Math.floor(diff / 86400000);

  //   if (minutes < 1) return 'Just now';
  //   if (minutes < 60) return `${minutes}m ago`;
  //   if (hours < 24) return `${hours}h ago`;
  //   return `${days}d ago`;
  // };

  const handleThemeChange = (themeValue) => {
    setTheme(themeValue);
    toast.success(`Theme changed to ${themeValue}`);
    setShowThemeSelector(false);
  };

  const handleExportData = async () => {
    try {
      const userData = {
        profile,
        stats,
        achievements,
        recentActivity,
        productivityGoal,
        notificationSettings,
        exportDate: new Date().toISOString()
      };

      let dataStr = '';
      let fileName = '';

      if (exportFormat === 'json') {
        dataStr = JSON.stringify(userData, null, 2);
        fileName = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
      } else if (exportFormat === 'csv') {
        // Convert to CSV format
        const csvData = [
          ['Metric', 'Value'],
          ['Username', profile.username],
          ['Email', profile.email],
          ['Full Name', profile.full_name],
          ['Total Tasks', stats.totalTasks],
          ['Completed Tasks', stats.completedTasks],
          ['Study Hours', stats.studyHours],
          ['Current Streak', stats.currentStreak],
          ['Learning Progress', `${stats.learningProgress}%`]
        ];
        dataStr = csvData.map(row => row.join(',')).join('\n');
        fileName = `profile-stats-${new Date().toISOString().split('T')[0]}.csv`;
      }

      const blob = new Blob([dataStr], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
      setShowDataExport(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // const handleGoalUpdate = (field, value) => {
  //   const newGoals = { ...productivityGoal, [field]: value };
  //   setProductivityGoal(newGoals);
  //   localStorage.setItem('productivityGoals', JSON.stringify(newGoals));
  //   toast.success('Productivity goals updated!');
  // };

  const handleNotificationToggle = (setting) => {
    const newSettings = { ...notificationSettings, [setting]: !notificationSettings[setting] };
    setNotificationSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    toast.info(`${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} ${newSettings[setting] ? 'enabled' : 'disabled'}`);
  };

  const calculateProductivityScore = () => {
    const taskScore = (stats.completedTasks / stats.totalTasks) * 30 || 0;
    const goalScore = (stats.completedGoals / stats.totalGoals) * 25 || 0;
    const studyScore = Math.min((stats.studyHours / 50) * 25, 25);
    const streakScore = Math.min((stats.currentStreak / 30) * 20, 20);

    return Math.round(taskScore + goalScore + studyScore + streakScore);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('theme');
      localStorage.removeItem('productivityGoals');
      localStorage.removeItem('notificationSettings');
      toast.success('Logged out successfully!');
      window.location.href = '/login';
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm account deletion');
      return;
    }

    try {
      const response = await fetch('/profile/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ confirmation: deleteConfirmation })
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        localStorage.clear();
        window.location.href = '/register';
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to connect to server');
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportMessage.trim()) {
      toast.error('Please enter a support message');
      return;
    }

    try {
      // In a real app, this would send to support system
      toast.success('Support message sent! We\'ll get back to you soon.');
      setSupportMessage('');
      setShowSupport(false);
    } catch (error) {
      toast.error('Failed to send support message');
    }
  };

  const getPendingTasksCount = () => {
    return stats.totalTasks - stats.completedTasks;
  };

  // const getProductivityGraphData = () => {
  //   // Mock weekly data for the graph
  //   return [
  //     { day: 'Mon', tasks: 8, goals: 3 },
  //     { day: 'Tue', tasks: 12, goals: 5 },
  //     { day: 'Wed', tasks: 6, goals: 2 },
  //     { day: 'Thu', tasks: 15, goals: 7 },
  //     { day: 'Fri', tasks: 10, goals: 4 },
  //     { day: 'Sat', tasks: 5, goals: 1 },
  //     { day: 'Sun', tasks: 3, goals: 1 }
  //   ];
  // };

  if (loading) {
    return (
      <div className="profile">
        <div className="learning-header">
          <div className="header-content">
            <h1 className="title">
              <i className="bi bi-person-circle me-2"></i>
              Profile Dashboard
            </h1>
            <p className="subtitle">Loading your productivity journey...</p>
          </div>
        </div>
        <div className="learning-content">
          <div className="profile-header-section">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      {/* Enhanced Profile Header */}
      <div className="learning-header">
        <div className="header-content">
          <h1 className="title">
            <i className="bi bi-person-circle me-2"></i>
            Profile Dashboard
          </h1>
          <p className="subtitle">Manage your account and track your productivity journey</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowForgotPassword(true)}
          >
            <i className="bi bi-lock me-1"></i>
            Change Password
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setEditing(!editing)}
          >
            <i className={`bi bi-${editing ? 'check' : 'pencil'} me-1`}></i>
            {editing ? 'Save' : 'Edit'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowThemeSelector(true)}
          >
            <i className="bi bi-palette me-1"></i>
            Theme
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowDataExport(true)}
          >
            <i className="bi bi-download me-1"></i>
            Export
          </button>
        </div>
      </div>

      {/* User Information Section */}
      <div className="user-info-section">
        <div className="profile-header-section">
          {/* Profile Photo */}
          <div className="profile-photo-section">
            <div className="profile-avatar-container">
              <div className="profile-avatar profile-photo">
                {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt={profile.username} />
                ) : (
                  <div className="photo-placeholder">
                    <i className="bi bi-person-fill"></i>
                  </div>
                )}
                <button
                  className="profile-avatar-upload photo-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload profile photo"
                >
                  <i className="bi bi-camera"></i>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
            <div className="profile-photo-helper">
              <p className="helper-text">
                <i className="bi bi-camera me-1"></i>
                Click the camera icon to upload your profile photo
              </p>
            </div>
          </div>

          {/* Profile Info */}
          <div className="profile-info-section profile-user-info">
            <h2 className="profile-username user-name">{profile.username}</h2>
            <p className="user-email">{profile.email || 'Email not provided'}</p>
            <p className="user-joined">Member since {new Date(profile.joined_date).toLocaleDateString()}</p>
            {profile.is_verified && (
              <span className="verified-badge">
                <i className="bi bi-shield-check"></i>
                Verified Account
              </span>
            )}
            <div className="profile-completion">
              <div className="completion-bar">
                <div
                  className="completion-fill"
                  style={{ width: `${getProfileCompletionPercentage()}%` }}
                ></div>
              </div>
              <span className="completion-text">
                Profile {getProfileCompletionPercentage()}% complete
              </span>
            </div>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="user-details-grid">
          <div className="info-item">
            <span className="info-label">Full Name</span>
            <span className={`info-value ${!profile.full_name ? 'empty' : ''}`}>
              {profile.full_name || 'Not provided'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Email Address</span>
            <span className={`info-value ${!profile.email ? 'empty' : ''}`}>
              {profile.email || 'Not provided'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone Number</span>
            <span className={`info-value ${!profile.phone ? 'empty' : ''}`}>
              {profile.phone || 'Not provided'}
              {profile.is_verified && profile.phone && (
                <i className="bi bi-shield-check-fill text-success ms-2"></i>
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Account Type</span>
            <span className="info-value">{profile.account_type || 'Free'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Language</span>
            <span className="info-value">{profile.language || 'English'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Timezone</span>
            <span className="info-value">{profile.timezone || 'UTC'}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {editing && (
        <div className="edit-profile-container">
          <div className="edit-profile-card">
            <h3 className="edit-profile-title">📝 Edit Profile Information</h3>

            <div className="edit-profile-form">
              <div className="form-field">
                <label htmlFor="fullName" className="field-label">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  className="field-input"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-field">
                <label htmlFor="email" className="field-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="field-input"
                  value={profile.email || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setEditing(false);
                    fetchProfileData();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Dashboard */}
      <div className="statistics-section">
        <h3 className="section-title">
          <i className="bi bi-graph-up me-2"></i>
          Productivity Statistics
        </h3>
        <div className="detailed-stats">
          <div className="detailed-stat-card">
            <div className="detailed-stat-icon" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="detailed-stat-content">
              <div className="detailed-stat-number">{stats.completedTasks}</div>
              <div className="detailed-stat-label">Tasks Completed</div>
            </div>
          </div>

          <div className="detailed-stat-card">
            <div className="detailed-stat-icon" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
              <i className="bi bi-list-task"></i>
            </div>
            <div className="detailed-stat-content">
              <div className="detailed-stat-number">{getPendingTasksCount()}</div>
              <div className="detailed-stat-label">Pending Tasks</div>
            </div>
          </div>

          <div className="detailed-stat-card">
            <div className="detailed-stat-icon" style={{background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'}}>
              <i className="bi bi-bullseye"></i>
            </div>
            <div className="detailed-stat-content">
              <div className="detailed-stat-number">{stats.completedGoals}</div>
              <div className="detailed-stat-label">Goals Achieved</div>
            </div>
          </div>

          <div className="detailed-stat-card">
            <div className="detailed-stat-icon" style={{background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'}}>
              <i className="bi bi-clock"></i>
            </div>
            <div className="detailed-stat-content">
              <div className="detailed-stat-number">{stats.studyHours}h</div>
              <div className="detailed-stat-label">Study Hours</div>
            </div>
          </div>

          <div className="detailed-stat-card">
            <div className="detailed-stat-icon" style={{background: 'linear-gradient(135deg, #06b6d4, #0891b2)'}}>
              <i className="bi bi-fire"></i>
            </div>
            <div className="detailed-stat-content">
              <div className="detailed-stat-number">{stats.currentStreak}</div>
              <div className="detailed-stat-label">Current Streak</div>
            </div>
          </div>

          <div className="detailed-stat-card">
            <div className="detailed-stat-icon" style={{background: 'linear-gradient(135deg, #ec4899, #be185d)'}}>
              <i className="bi bi-speedometer2"></i>
            </div>
            <div className="detailed-stat-content">
              <div className="detailed-stat-number">{calculateProductivityScore()}%</div>
              <div className="detailed-stat-label">Productivity Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Section */}
      <div className="account-settings-section">
        <h3 className="section-title">
          <i className="bi bi-gear me-2"></i>
          Account Settings
        </h3>
        <div className="settings-grid">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">Theme Preference</div>
              <div className="setting-description">Choose your preferred color theme</div>
            </div>
            <div className="setting-control">
              <button
                className="btn btn-secondary"
                onClick={() => setShowThemeSelector(true)}
              >
                <i className="bi bi-palette me-2"></i>
                {isAuto ? 'Auto' : theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">Task Reminders</div>
              <div className="setting-description">Get notified about pending tasks</div>
            </div>
            <div className="setting-control">
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="taskReminders"
                  checked={notificationSettings.taskReminders}
                  onChange={() => handleNotificationToggle('taskReminders')}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">Email Notifications</div>
              <div className="setting-description">Receive email updates about your progress</div>
            </div>
            <div className="setting-control">
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onChange={() => handleNotificationToggle('emailNotifications')}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">Achievement Notifications</div>
              <div className="setting-description">Get notified when you unlock achievements</div>
            </div>
            <div className="setting-control">
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="achievements"
                  checked={notificationSettings.achievements}
                  onChange={() => handleNotificationToggle('achievements')}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Settings Section */}
      <div className="app-settings-section">
        <h3 className="section-title">
          <i className="bi bi-sliders me-2"></i>
          App Settings
        </h3>
        <div className="app-settings-actions">
          <div className="app-setting-item">
            <div className="setting-info">
              <div className="setting-title">Export Data</div>
              <div className="setting-description">Download your profile and activity data</div>
            </div>
            <div className="setting-control">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDataExport(true)}
              >
                <i className="bi bi-download me-2"></i>
                Export
              </button>
            </div>
          </div>

          <div className="app-setting-item">
            <div className="setting-info">
              <div className="setting-title">Help & Support</div>
              <div className="setting-description">Get help or contact support team</div>
            </div>
            <div className="setting-control">
              <button
                className="btn btn-secondary"
                onClick={() => setShowSupport(true)}
              >
                <i className="bi bi-question-circle me-2"></i>
                Help
              </button>
            </div>
          </div>

          <div className="app-setting-item">
            <div className="setting-info">
              <div className="setting-title">Logout</div>
              <div className="setting-description">Sign out of your account</div>
            </div>
            <div className="setting-control">
              <button
                className="btn btn-secondary"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>
            </div>
          </div>

          <div className="app-setting-item danger-setting">
            <div className="setting-info">
              <div className="setting-title">Delete Account</div>
              <div className="setting-description">Permanently delete your account and all data</div>
            </div>
            <div className="setting-control">
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteAccount(true)}
              >
                <i className="bi bi-trash me-2"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Modals */}

      {/* Change Password Modal */}
      {showForgotPassword && (
        <div className="profile-modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">
                <i className="bi bi-lock me-2"></i>
                Change Password
              </h2>
              <button className="profile-modal-close" onClick={() => setShowForgotPassword(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="profile-modal-body">
              <div>
                <p>Enter your current password and choose a new password.</p>

                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                  style={{ marginTop: '50px',marginLeft: '40px' }}
                    type="password"
                    className="form-control"
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                  style={{ marginTop: '50px',marginLeft: '40px' }}
                    type="password"
                    className="form-control"
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                  style={{ marginTop: '50px',marginLeft: '40px' }}
                    type="password"
                    className="form-control"
                    value={changePasswordData.confirmPassword}
                    onChange={(e) => setChangePasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <div className="profile-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForgotPassword(false);
                  setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                <i className="bi bi-x me-2"></i>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleChangePassword}
              >
                <i className="bi bi-check me-2"></i>
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeSelector && (
        <div className="profile-modal-overlay" onClick={() => setShowThemeSelector(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">
                <i className="bi bi-palette me-2"></i>
                Choose Theme
              </h2>
              <button className="profile-modal-close" onClick={() => setShowThemeSelector(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="profile-modal-body">
              <p>Select your preferred color theme for the application.</p>
              <div className="theme-selector">
                <div
                  className={`theme-option theme-light ${theme === 'light' && !isAuto ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  Light
                </div>
                <div
                  className={`theme-option theme-dark ${theme === 'dark' && !isAuto ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  Dark
                </div>
                <div
                  className={`theme-option theme-auto ${isAuto ? 'active' : ''}`}
                  onClick={() => handleThemeChange('auto')}
                >
                  Auto
                </div>
              </div>
            </div>

            <div className="profile-modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowThemeSelector(false)}
              >
                <i className="bi bi-check me-2"></i>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Export Modal */}
      {showDataExport && (
        <div className="profile-modal-overlay" onClick={() => setShowDataExport(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">
                <i className="bi bi-download me-2"></i>
                Export Your Data
              </h2>
              <button className="profile-modal-close" onClick={() => setShowDataExport(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="profile-modal-body">
              <p>Choose the format to export your profile and activity data.</p>
              <div className="export-options">
                <div className="export-option" onClick={() => setExportFormat('json')}>
                  <div className="export-option-info">
                    <div className="export-option-icon json">
                      <i className="bi bi-filetype-json"></i>
                    </div>
                    <div className="export-option-details">
                      <div className="export-option-title">JSON Format</div>
                      <div className="export-option-description">Complete data in structured format</div>
                    </div>
                  </div>
                  <div className="form-check">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                  </div>
                </div>

                <div className="export-option" onClick={() => setExportFormat('csv')}>
                  <div className="export-option-info">
                    <div className="export-option-icon csv">
                      <i className="bi bi-filetype-csv"></i>
                    </div>
                    <div className="export-option-details">
                      <div className="export-option-title">CSV Format</div>
                      <div className="export-option-description">Statistics in spreadsheet format</div>
                    </div>
                  </div>
                  <div className="form-check">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDataExport(false)}
              >
                <i className="bi bi-x me-2"></i>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleExportData}
              >
                <i className="bi bi-download me-2"></i>
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupport && (
        <div className="profile-modal-overlay" onClick={() => setShowSupport(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">
                <i className="bi bi-question-circle me-2"></i>
                Help & Support
              </h2>
              <button className="profile-modal-close" onClick={() => setShowSupport(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="profile-modal-body">
              <div className="support-links">
                <button className="support-link" onClick={(e) => e.preventDefault()}>
                  <div className="support-icon faq">
                    <i className="bi bi-question-circle"></i>
                  </div>
                  <div className="support-info">
                    <div className="support-title">Frequently Asked Questions</div>
                    <div className="support-description">Find answers to common questions</div>
                  </div>
                </button>

                <button className="support-link" onClick={(e) => e.preventDefault()}>
                  <div className="support-icon contact">
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div className="support-info">
                    <div className="support-title">Contact Support</div>
                    <div className="support-description">Get help from our support team</div>
                  </div>
                </button>

                <button className="support-link" onClick={(e) => e.preventDefault()}>
                  <div className="support-icon docs">
                    <i className="bi bi-file-text"></i>
                  </div>
                  <div className="support-info">
                    <div className="support-title">User Documentation</div>
                    <div className="support-description">Learn how to use all features</div>
                  </div>
                </button>
              </div>

              <div className="form-group mt-3">
                <label className="form-label">Send us a message</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                ></textarea>
              </div>
            </div>

            <div className="profile-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSupport(false)}
              >
                <i className="bi bi-x me-2"></i>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSupportSubmit}
                disabled={!supportMessage.trim()}
              >
                <i className="bi bi-send me-2"></i>
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="profile-modal-overlay" onClick={() => setShowDeleteAccount(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title" style={{color: 'var(--profile-danger)'}}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Delete Account
              </h2>
              <button className="profile-modal-close" onClick={() => setShowDeleteAccount(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="profile-modal-body">
              <div className="delete-confirmation">
                <div className="delete-confirmation-icon">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <h3 className="delete-confirmation-title">Are you absolutely sure?</h3>
                <p className="delete-confirmation-text">
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers.
                </p>
                <div className="form-group">
                  <label className="form-label">Type <strong>delete</strong> to confirm:</label>
                  <input
                    type="text"
                    className="delete-confirmation-input"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type 'delete' to confirm"
                  />
                </div>
              </div>
            </div>

            <div className="profile-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteAccount(false);
                  setDeleteConfirmation('');
                }}
              >
                <i className="bi bi-x me-2"></i>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation.toLowerCase() !== 'delete'}
              >
                <i className="bi bi-trash me-2"></i>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}