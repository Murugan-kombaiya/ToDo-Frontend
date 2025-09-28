import React from 'react';

const MobileInput = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  autoFocus = false,
  validationError,
  isValid = false,
  countryCode = '+91'
}) => {
  return (
    <div className="form-group">
      <label>
        <i className="bi bi-phone"></i> {label}
      </label>
      <div className="mobile-input-container">
        <span className="country-code">{countryCode}</span>
        <input
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength="10"
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          className={validationError ? 'error' : isValid && value.length === 10 ? 'success' : ''}
        />
        {isValid && value.length === 10 && (
          <i className="bi bi-check-circle-fill validation-icon success"></i>
        )}
      </div>
      {validationError && (
        <div className="field-error">
          <i className="bi bi-exclamation-circle"></i>
          {validationError}
        </div>
      )}
      {isValid && value.length === 10 && (
        <div className="field-success">
          <i className="bi bi-check-circle"></i>
          Valid mobile number
        </div>
      )}
    </div>
  );
};

export default MobileInput;