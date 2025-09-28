import { useState } from 'react';
import { getValidationError, processMobileInput, processOTPInput, calculatePasswordStrength, validateMobile } from '../utils/validation';

export const useAuthForm = (initialFormData = {}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mobileValid, setMobileValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const updateValidationError = (field, error) => {
    setValidationErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const { [field]: removed, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Process mobile number to allow only digits
    if (field === 'mobile') {
      processedValue = processMobileInput(value);
      const isValid = validateMobile(processedValue);
      setMobileValid(isValid);
    }

    // Process OTP to allow only digits
    if (field === 'otp') {
      processedValue = processOTPInput(value);
    }

    // Calculate password strength
    if (field === 'password' || field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(processedValue));
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Validate field in real-time
    const error = getValidationError(field, processedValue, formData);
    updateValidationError(field, error);
  };

  const resetForm = (newFormData = initialFormData) => {
    setFormData(newFormData);
    setValidationErrors({});
    setMobileValid(false);
    setPasswordStrength('');
  };

  const setFieldValue = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    validationErrors,
    loading,
    mobileValid,
    passwordStrength,
    setLoading,
    handleInputChange,
    resetForm,
    setFieldValue,
    updateValidationError
  };
};