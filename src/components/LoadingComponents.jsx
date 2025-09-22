import React from 'react';
import './LoadingSpinner.css';

// Loading Spinner Component
const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  message = 'Loading...',
  fullScreen = false
}) => {
  const spinnerClass = `spinner-${size}`;
  const containerClass = fullScreen ? 'loading-fullscreen' : 'loading-container';

  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div className={`spinner-border text-${color} ${spinnerClass}`} role="status">
          <span className="visually-hidden">{message}</span>
        </div>
        {message && <p className="loading-text mt-2">{message}</p>}
      </div>
    </div>
  );
};

// Skeleton Loader Component
const SkeletonLoader = ({
  width = '100%',
  height = '1rem',
  lines = 1,
  className = ''
}) => {
  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{
            width: index === lines - 1 ? '60%' : width,
            height: height,
            marginBottom: index < lines - 1 ? '0.5rem' : 0
          }}
        />
      ))}
    </div>
  );
};

// Task Card Skeleton
const TaskCardSkeleton = () => {
  return (
    <div className="card task-skeleton">
      <div className="card-body">
        <SkeletonLoader lines={2} className="mb-2" />
        <div className="d-flex justify-content-between align-items-center">
          <SkeletonLoader width="40%" height="0.8rem" />
          <SkeletonLoader width="30%" height="0.8rem" />
        </div>
      </div>
    </div>
  );
};

// Dashboard Skeleton
const DashboardSkeleton = () => {
  return (
    <div className="dashboard-skeleton">
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <SkeletonLoader height="1.5rem" className="mb-2" />
              <SkeletonLoader width="50%" />
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <SkeletonLoader height="1.5rem" className="mb-2" />
              <SkeletonLoader width="50%" />
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <SkeletonLoader height="1.5rem" className="mb-2" />
              <SkeletonLoader width="50%" />
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <SkeletonLoader height="1.5rem" className="mb-2" />
              <SkeletonLoader width="50%" />
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <SkeletonLoader height="1.2rem" className="mb-3" />
              <SkeletonLoader lines={4} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <SkeletonLoader height="1.2rem" className="mb-3" />
              <SkeletonLoader lines={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error State Component
const ErrorState = ({
  title = "Oops! Something went wrong",
  message = "We encountered an error while loading this content.",
  onRetry = null,
  showHomeButton = true
}) => {
  return (
    <div className="error-state text-center py-5">
      <div className="error-icon mb-3">
        <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
      </div>
      <h3 className="error-title mb-3">{title}</h3>
      <p className="error-message mb-4 text-muted">{message}</p>

      <div className="error-actions">
        {onRetry && (
          <button
            className="btn btn-primary me-2"
            onClick={onRetry}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </button>
        )}

        {showHomeButton && (
          <button
            className="btn btn-outline-secondary"
            onClick={() => window.location.href = '/'}
          >
            <i className="bi bi-house me-2"></i>
            Go Home
          </button>
        )}
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({
  icon = "bi-inbox",
  title = "No items found",
  message = "There are no items to display at the moment.",
  action = null,
  actionText = "Add New"
}) => {
  return (
    <div className="empty-state text-center py-5">
      <div className="empty-icon mb-3">
        <i className={`bi ${icon}`} style={{ fontSize: '4rem', color: '#6c757d' }}></i>
      </div>
      <h4 className="empty-title mb-3">{title}</h4>
      <p className="empty-message mb-4 text-muted">{message}</p>

      {action && (
        <button
          className="btn btn-primary"
          onClick={action}
        >
          <i className="bi bi-plus-circle me-2"></i>
          {actionText}
        </button>
      )}
    </div>
  );
};

export {
  LoadingSpinner,
  SkeletonLoader,
  TaskCardSkeleton,
  DashboardSkeleton,
  ErrorState,
  EmptyState
};
