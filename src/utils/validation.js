// Reusable validation utilities for authentication forms

export const validateMobile = (mobile) => {
  const mobileRegex = /^\d{10}$/;
  return mobileRegex.test(mobile);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const calculatePasswordStrength = (password) => {
  if (password.length < 6) return 'weak';
  if (password.length < 8) return 'medium';
  if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
    return 'strong';
  }
  return 'medium';
};

export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export const validateOTP = (otp) => {
  return otp && otp.length === 6 && /^\d{6}$/.test(otp);
};

export const getValidationError = (field, value, additionalData = {}) => {
  const { password, confirmPassword } = additionalData;

  switch (field) {
    case 'name':
      if (!validateName(value)) {
        return 'Name must be at least 2 characters long';
      }
      break;
    case 'email':
      if (value && !validateEmail(value)) {
        return 'Please enter a valid email address';
      }
      break;
    case 'mobile':
      if (value.length > 0 && value.length !== 10) {
        return 'Mobile number must be exactly 10 digits';
      } else if (value.length === 10 && !validateMobile(value)) {
        return 'Please enter a valid mobile number';
      }
      break;
    case 'password':
      if (value && !validatePassword(value)) {
        return 'Password must be at least 6 characters long';
      }
      break;
    case 'confirmPassword':
      if (value && !validatePasswordMatch(password, value)) {
        return 'Passwords do not match';
      }
      break;
    case 'newPassword':
      if (value && !validatePassword(value)) {
        return 'Password must be at least 6 characters long';
      }
      break;
    case 'otp':
      if (value && !validateOTP(value)) {
        return 'Please enter a valid 6-digit OTP';
      }
      break;
    default:
      return null;
  }
  return null;
};

export const processMobileInput = (value) => {
  return value.replace(/[^0-9]/g, '').slice(0, 10);
};

export const processOTPInput = (value) => {
  return value.replace(/[^0-9]/g, '').slice(0, 6);
};

export const isFormValid = (formData, requiredFields, validationErrors = {}) => {
  // Check if all required fields are filled
  const allFieldsFilled = requiredFields.every(field => {
    const value = formData[field];
    return value && value.toString().trim().length > 0;
  });

  // Check if there are no validation errors
  const noValidationErrors = Object.keys(validationErrors).length === 0;

  return allFieldsFilled && noValidationErrors;
};