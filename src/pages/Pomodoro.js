import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Pomodoro() {
  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  
  // Task states
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all'); // all, own, office
  
  // Session states
  const [sessionCount, setSessionCount] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  
  // Refs
  const intervalRef = useRef(null);

  const playSound = () => {
    // Play notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(() => {});
  };

  const markTaskComplete = () => {
    if (!selectedTask) return;
    
    fetch(`/tasks/${selectedTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status: 'done' })
    })
      .then(() => {
        toast.success(`Task "${selectedTask.title}" marked as complete!`);
        setSelectedTask(null);
        fetchTasks();
      })
      .catch(() => toast.error('Failed to update task'));
  };

  const startBreak = (minutes) => {
    setIsBreak(true);
    setTimeLeft(minutes * 60);
    setSelectedDuration(minutes);
    toast.info(`Starting ${minutes} minute break`);
  };

  // Memoized callback for timer completion logic
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    playSound();
    
    if (!isBreak && selectedTask) {
      // Show completion popup
      if (window.confirm(`Time's up! Did you complete "${selectedTask.title}"?`)) {
        markTaskComplete();
      }
      setSessionCount(prev => prev + 1);
      
      // Auto start break after work session
      if (sessionCount > 0 && sessionCount % 4 === 0) {
        // Long break after 4 sessions
        startBreak(15);
      } else {
        // Short break
        startBreak(5);
      }
    } else if (isBreak) {
      // Break is over, ready for next work session
      setIsBreak(false);
      toast.info('Break time is over! Ready for the next session?');
    }
  }, [isBreak, selectedTask, sessionCount]);

  // Fetch tasks with loading state
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    setTasksError(null);
    
    try {
      let params = new URLSearchParams();
      params.set('status', 'pending');
      if (taskFilter !== 'all') {
        params.set('category', taskFilter);
      }
      
      const response = await fetch(`/tasks?${params.toString()}`, { 
        headers: authHeaders() 
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasksError('Failed to load tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [taskFilter]);
  
  // UseEffect to fetch tasks when the taskFilter changes
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

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
    setIsBreak(false);
  };

  const setDuration = (minutes) => {
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    setCustomDuration('');
  };

  const setCustomTime = () => {
    const minutes = parseInt(customDuration);
    if (minutes > 0 && minutes <= 180) {
      setDuration(minutes);
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

  return (
    <div className="app-container pomodoro-page">
      <div className="pomodoro-header">
        <h1 className="title">
          <i className="bi bi-clock-history me-2"></i>
          Pomodoro Timer
        </h1>
        <div className="session-info">
          <span className="badge bg-primary">
            <i className="bi bi-fire me-1"></i>
            {sessionCount} Sessions Today
          </span>
        </div>
      </div>

      <div className="pomodoro-content">
        {/* Timer Section */}
        <div className="timer-section">
          <div className="timer-card card">
            <div className="timer-type">
              {isBreak ? (
                <span className="break-badge">
                  <i className="bi bi-cup-hot me-1"></i>
                  Break Time
                </span>
              ) : (
                <span className="work-badge">
                  <i className="bi bi-laptop me-1"></i>
                  Work Session
                </span>
              )}
            </div>

            <div className="timer-display">
              <svg className="timer-svg" viewBox="0 0 200 200">
                <circle
                  className="timer-circle-bg"
                  cx="100"
                  cy="100"
                  r="90"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  className="timer-circle-progress"
                  cx="100"
                  cy="100"
                  r="90"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - getProgressPercentage() / 100)}`}
                  transform="rotate(-90 100 100)"
                />
                <text
                  x="100"
                  y="100"
                  className="timer-text"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {formatTime(timeLeft)}
                </text>
              </svg>
            </div>

            <div className="timer-controls">
              {!isRunning ? (
                <button className="btn btn-primary btn-lg" onClick={startTimer}>
                  <i className="bi bi-play-fill me-2"></i>
                  Start
                </button>
              ) : (
                <button className="btn btn-warning btn-lg" onClick={pauseTimer}>
                  <i className="bi bi-pause-fill me-2"></i>
                  Pause
                </button>
              )}
              <button className="btn btn-outline btn-lg" onClick={resetTimer}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset
              </button>
            </div>

            {/* Duration Options */}
            <div className="duration-options">
              <h5>Set Duration</h5>
              <div className="duration-buttons">
                <button 
                  className={`duration-btn ${selectedDuration === 15 ? 'active' : ''}`}
                  onClick={() => setDuration(15)}
                  disabled={isRunning}
                >
                  15 min
                </button>
                <button 
                  className={`duration-btn ${selectedDuration === 25 ? 'active' : ''}`}
                  onClick={() => setDuration(25)}
                  disabled={isRunning}
                >
                  25 min
                </button>
                <button 
                  className={`duration-btn ${selectedDuration === 45 ? 'active' : ''}`}
                  onClick={() => setDuration(45)}
                  disabled={isRunning}
                >
                  45 min
                </button>
                <button 
                  className={`duration-btn ${selectedDuration === 60 ? 'active' : ''}`}
                  onClick={() => setDuration(60)}
                  disabled={isRunning}
                >
                  60 min
                </button>
              </div>
              <div className="custom-duration">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Custom (minutes)"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  disabled={isRunning}
                  min="1"
                  max="180"
                />
                <button 
                  className="btn btn-primary"
                  onClick={setCustomTime}
                  disabled={isRunning || !customDuration}
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <div className="tasks-card card">
            <div className="tasks-header">
              <h3>Select Task</h3>
              <div className="task-filters">
                <button
                  className={`filter-btn ${taskFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${taskFilter === 'own' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('own')}
                >
                  Own
                </button>
                <button
                  className={`filter-btn ${taskFilter === 'office' ? 'active' : ''}`}
                  onClick={() => setTaskFilter('office')}
                >
                  Office
                </button>
              </div>
            </div>

            {selectedTask && (
              <div className="selected-task">
                <span className="selected-label">Currently Working On:</span>
                <div className="selected-task-card">
                  <span className="task-title">{selectedTask.title}</span>
                  <span className={`task-category ${selectedTask.category}`}>
                    {selectedTask.category}
                  </span>
                </div>
              </div>
            )}
            
            {/* Conditional rendering for tasks based on state */}
            <div className="task-list-container">
              {loadingTasks ? (
                <div className="loading-state">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Loading tasks...</p>
                </div>
              ) : tasksError ? (
                <div className="error-state">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <p>{tasksError}</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="no-tasks">
                  <i className="bi bi-inbox"></i>
                  <p>No pending tasks</p>
                </div>
              ) : (
                <div className="pomodoro-task-list">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className={`pomodoro-task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
                      onClick={() => !isRunning && setSelectedTask(task)}
                    >
                      <div className="task-content">
                        <span className="task-title">{task.title}</span>
                        {task.description && (
                          <span className="task-desc">{task.description}</span>
                        )}
                      </div>
                      <div className="task-meta">
                        <span className={`priority-badge ${task.priority}`}>
                          {task.priority}
                        </span>
                        <span className={`category-badge ${task.category}`}>
                          {task.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}