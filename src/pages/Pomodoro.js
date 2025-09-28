import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Pomodoro() {
  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [loading, setLoading] = useState(false);

  // Task states
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Session states
  const [sessionCount, setSessionCount] = useState(() => {
    const saved = localStorage.getItem('pomodoroSessions');
    const today = new Date().toDateString();
    const savedData = saved ? JSON.parse(saved) : {};
    return savedData[today] || 0;
  });
  const [isBreak, setIsBreak] = useState(false);
  const [totalFocusTime, setTotalFocusTime] = useState(() => {
    const saved = localStorage.getItem('totalFocusTime');
    return saved ? parseInt(saved) : 0;
  });

  // Refs
  const intervalRef = useRef(null);

  // Save session count to localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('pomodoroSessions');
    const savedData = saved ? JSON.parse(saved) : {};
    savedData[today] = sessionCount;
    localStorage.setItem('pomodoroSessions', JSON.stringify(savedData));
  }, [sessionCount]);

  // Save total focus time to localStorage
  useEffect(() => {
    localStorage.setItem('totalFocusTime', totalFocusTime.toString());
  }, [totalFocusTime]);

  const playSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(() => {});
    } catch (error) {
      // Fallback notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
          body: 'Timer completed!',
          icon: '🍅'
        });
      }
    }
  };

  const markTaskComplete = useCallback(async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: 'done' })
      });

      if (response.ok) {
        toast.success(`Task "${selectedTask.title}" completed! 🎉`);
        setSelectedTask(null);
        fetchTasks();
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      toast.error('Failed to mark task as complete');
    }
  }, [selectedTask]); // eslint-disable-line react-hooks/exhaustive-deps

  const startBreak = (minutes) => {
    setIsBreak(true);
    setTimeLeft(minutes * 60);
    setSelectedDuration(minutes);
    toast.info(`Starting ${minutes} minute break ☕`);
  };

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    playSound();

    if (!isBreak) {
      // Work session completed
      setSessionCount(prev => prev + 1);
      setTotalFocusTime(prev => prev + selectedDuration);

      if (selectedTask) {
        // Show completion popup
        const completed = window.confirm(`🎉 Time's up! Did you complete "${selectedTask.title}"?`);
        if (completed) {
          markTaskComplete();
        }
      }

      // Auto start break after work session
      const nextBreakDuration = sessionCount > 0 && (sessionCount + 1) % 4 === 0 ? 15 : 5;
      startBreak(nextBreakDuration);
    } else {
      // Break completed
      setIsBreak(false);
      setTimeLeft(25 * 60); // Reset to default work duration
      setSelectedDuration(25);
      toast.info('Break time is over! Ready for the next session? 💪');
    }
  }, [isBreak, selectedTask, sessionCount, selectedDuration, markTaskComplete]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/tasks?status=pending', {
        headers: authHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startTimer = () => {
    setIsRunning(true);
    toast.success(isBreak ? 'Break started! 🛋️' : 'Focus session started! 🎯');
  };

  const pauseTimer = () => {
    setIsRunning(false);
    toast.info('Timer paused ⏸️');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
    setIsBreak(false);
  };

  const setDuration = (minutes) => {
    if (isRunning) return;
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    setCustomDuration('');
  };

  const setCustomTime = () => {
    const minutes = parseInt(customDuration);
    if (minutes > 0 && minutes <= 180) {
      setDuration(minutes);
      toast.success(`Duration set to ${minutes} minutes`);
    } else {
      toast.error('Please enter a valid duration (1-180 minutes)');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const total = selectedDuration * 60;
    return ((total - timeLeft) / total) * 100;
  };

  const formatHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const getTimerColor = () => {
    if (isBreak) return '#27ae60';
    if (timeLeft <= 300) return '#e74c3c'; // Red when less than 5 minutes
    if (timeLeft <= 600) return '#f39c12'; // Orange when less than 10 minutes
    return '#667eea'; // Default blue
  };

  if (loading) {
    return (
      <div className="pomodoro-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Pomodoro Timer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pomodoro-page">
      {/* Header */}
      <div className="pomodoro-header">
        <div className="header-content">
          <h1 className="title">
            <i className="bi bi-stopwatch me-2"></i>
            Focus Timer Pro
          </h1>
          <p className="subtitle">Boost productivity with the Pomodoro Technique</p>
        </div>

        <div className="session-stats">
          <div className="stat-item">
            <span className="stat-value">{sessionCount}</span>
            <span className="stat-label">Sessions Today</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{formatHours(totalFocusTime)}</span>
            <span className="stat-label">Total Focus Time</span>
          </div>
        </div>
      </div>

      <div className="pomodoro-content">
        {/* Timer Section */}
        <div className="timer-section">
          <div className="timer-card">
            <div className="timer-type">
              {isBreak ? (
                <div className="break-badge">
                  <i className="bi bi-cup-hot me-2"></i>
                  Break Time - Relax & Recharge
                </div>
              ) : (
                <div className="work-badge">
                  <i className="bi bi-bullseye me-2"></i>
                  Focus Session - Deep Work Mode
                </div>
              )}
            </div>

            <div className="timer-display">
              <div className="timer-circle">
                <svg className="timer-svg" viewBox="0 0 200 200">
                  <circle
                    className="timer-circle-bg"
                    cx="100"
                    cy="100"
                    r="85"
                    strokeWidth="8"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                  />
                  <circle
                    className="timer-circle-progress"
                    cx="100"
                    cy="100"
                    r="85"
                    strokeWidth="8"
                    fill="none"
                    stroke={getTimerColor()}
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 85}`}
                    strokeDashoffset={`${2 * Math.PI * 85 * (1 - getProgressPercentage() / 100)}`}
                    transform="rotate(-90 100 100)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
                  />
                </svg>
                <div className="timer-time">
                  {formatTime(timeLeft)}
                </div>
                <div className="timer-status">
                  {isRunning ? (
                    <span className="status-running">
                      <i className="bi bi-play-fill me-1"></i>
                      Running
                    </span>
                  ) : timeLeft === 0 ? (
                    <span className="status-complete">
                      <i className="bi bi-check-circle me-1"></i>
                      Complete
                    </span>
                  ) : (
                    <span className="status-paused">
                      <i className="bi bi-pause me-1"></i>
                      Paused
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="timer-controls">
              {!isRunning ? (
                <button
                  className="control-btn primary"
                  onClick={startTimer}
                  disabled={timeLeft === 0}
                >
                  <i className="bi bi-play-fill me-2"></i>
                  {timeLeft === 0 ? 'Complete' : 'Start Focus'}
                </button>
              ) : (
                <button
                  className="control-btn danger"
                  onClick={pauseTimer}
                >
                  <i className="bi bi-pause-fill me-2"></i>
                  Pause
                </button>
              )}
              <button
                className="control-btn secondary"
                onClick={resetTimer}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset
              </button>
            </div>

            {/* Duration Presets */}
            <div className="duration-section">
              <h5 className="duration-title">
                <i className="bi bi-clock me-2"></i>
                Duration Presets
              </h5>
              <div className="duration-buttons">
                {[15, 25, 30, 45, 60].map(minutes => (
                  <button
                    key={minutes}
                    className={`duration-btn ${selectedDuration === minutes ? 'active' : ''}`}
                    onClick={() => setDuration(minutes)}
                    disabled={isRunning}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
              <div className="custom-duration">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Custom minutes"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  disabled={isRunning}
                  min="1"
                  max="180"
                />
                <button
                  className="btn btn-outline-primary"
                  onClick={setCustomTime}
                  disabled={isRunning || !customDuration}
                >
                  <i className="bi bi-check me-1"></i>
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <div className="tasks-card">
            <div className="tasks-header">
              <h3 className="tasks-title">
                <i className="bi bi-list-task me-2"></i>
                Focus Tasks
              </h3>
              <button
                className="btn btn-outline-primary refresh-btn"
                onClick={fetchTasks}
                disabled={loading}
              >
                <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
              </button>
            </div>

            {selectedTask && (
              <div className="selected-task">
                <div className="selected-label">
                  <i className="bi bi-target me-2"></i>
                  Currently Focusing On:
                </div>
                <div className="selected-task-card">
                  <div className="task-info">
                    <h4 className="task-title">{selectedTask.title}</h4>
                    {selectedTask.description && (
                      <p className="task-description">{selectedTask.description}</p>
                    )}
                  </div>
                  <div className="task-badges">
                    <span className={`priority-badge priority-${selectedTask.priority}`}>
                      {selectedTask.priority}
                    </span>
                    <span className={`category-badge category-${selectedTask.category}`}>
                      {selectedTask.category}
                    </span>
                  </div>
                  <button
                    className="btn btn-success complete-btn"
                    onClick={markTaskComplete}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Complete
                  </button>
                </div>
              </div>
            )}

            <div className="task-list-container">
              {tasks.length === 0 ? (
                <div className="empty-tasks">
                  <div className="empty-icon">
                    <i className="bi bi-inbox"></i>
                  </div>
                  <h4>No Pending Tasks</h4>
                  <p>All caught up! Create new tasks to focus on your goals.</p>
                </div>
              ) : (
                <>
                  <div className="tasks-subtitle">
                    Select a task to focus on during your session:
                  </div>
                  <div className="task-list">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
                        onClick={() => !isRunning && setSelectedTask(task)}
                      >
                        <div className="task-content">
                          <h5 className="task-title">{task.title}</h5>
                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}
                          <div className="task-meta">
                            <span className={`priority-badge priority-${task.priority}`}>
                              {task.priority}
                            </span>
                            <span className={`category-badge category-${task.category}`}>
                              {task.category}
                            </span>
                            {task.due_date && (
                              <span className="due-date">
                                <i className="bi bi-calendar me-1"></i>
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="task-actions">
                          <i className={`bi ${selectedTask?.id === task.id ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}