import React from 'react';

const PasswordInput = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  autoFocus = false,
  validationError,
  showPassword,
  onTogglePassword,
  showStrength = false,
  passwordStrength,
  showConfirmIcon = false,
  isMatching = false
}) => {
  return (
    <div className="form-group">
      <label>
        <i className="bi bi-lock"></i> {label}
      </label>
      <div className="password-input-container">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          className={validationError ? 'error' : (showConfirmIcon && isMatching ? 'success' : '')}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={onTogglePassword}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
        </button>
        {showConfirmIcon && isMatching && (
          <i className="bi bi-check-circle-fill validation-icon success"></i>
        )}
      </div>
      {validationError && (
        <div className="field-error">
          <i className="bi bi-exclamation-circle"></i>
          {validationError}
        </div>
      )}
      {showStrength && value && !validationError && (
        <div className={`password-strength ${passwordStrength}`}>
          <div className="strength-bar"></div>
          <span className="strength-text">
            {passwordStrength === 'weak' && 'Weak password'}
            {passwordStrength === 'medium' && 'Medium strength'}
            {passwordStrength === 'strong' && 'Strong password'}
          </span>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;