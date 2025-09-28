import React from 'react';

const FormInput = ({
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  maxLength,
  autoFocus = false,
  validationError,
  successMessage,
  children
}) => {
  return (
    <div className="form-group">
      <label>
        <i className={`bi ${icon}`}></i> {label}
      </label>
      <div className="input-container">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          maxLength={maxLength}
          className={validationError ? 'error' : className}
        />
        {children}
      </div>
      {validationError && (
        <div className="field-error">
          <i className="bi bi-exclamation-circle"></i>
          {validationError}
        </div>
      )}
      {successMessage && (
        <div className="field-success">
          <i className="bi bi-check-circle"></i>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default FormInput;