import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  const ProblemChild = () => {
    const [shouldThrow, setShouldThrow] = React.useState(false);

    if (shouldThrow) {
      return <ThrowError />;
    }

    return (
      <button
        data-testid="error-button"
        onClick={() => setShouldThrow(true)}
      >
        Throw Error
      </button>
    );
  };

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong! 😵')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('shows error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

    // Restore original env
    process.env.NODE_ENV = originalNodeEnv;
    spy.mockRestore();
  });

  it('does not show error details in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

    // Restore original env
    process.env.NODE_ENV = originalNodeEnv;
    spy.mockRestore();
  });

  it('handles reset functionality', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // Error UI should still be visible since we didn't provide a reset mechanism
    expect(screen.getByText('Something went wrong! 😵')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('logs errors to service in production', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = jest.fn();

    // Mock the logErrorToService method
    const originalRender = ErrorBoundary.prototype.render;
    ErrorBoundary.prototype.logErrorToService = logSpy;

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(logSpy).toHaveBeenCalled();

    // Restore original env and methods
    process.env.NODE_ENV = originalNodeEnv;
    ErrorBoundary.prototype.render = originalRender;
    spy.mockRestore();
  });

  it('renders error icon with correct styling', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const errorIcon = screen.getByText('Something went wrong! 😵').previousElementSibling;
    expect(errorIcon).toHaveClass('bi');
    expect(errorIcon).toHaveClass('bi-exclamation-triangle');

    spy.mockRestore();
  });
});
