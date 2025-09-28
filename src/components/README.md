# Modular Authentication Components

This directory contains reusable authentication components and utilities that can be used across your ToDo application.

## 🏗️ Component Structure

```
src/
├── components/           # Reusable UI components
│   ├── AuthLayout.js     # Layout wrapper for auth pages
│   ├── FormInput.js      # Generic form input component
│   ├── PasswordInput.js  # Password input with toggle and strength meter
│   ├── MobileInput.js    # Mobile number input with validation
│   └── OTPInput.js       # OTP input component
├── hooks/                # Custom React hooks
│   └── useAuthForm.js    # Form state management hook
├── services/             # API service layer
│   └── authService.js    # Authentication API calls
├── utils/                # Utility functions
│   └── validation.js     # Form validation utilities
└── pages/                # Page components
    ├── Register.js       # Registration page
    ├── Login.js          # Login page
    └── Forgot.js         # Password reset page
```

## 🧩 Components

### AuthLayout
Wrapper component for all authentication pages with consistent styling and navigation links.

```jsx
import AuthLayout from '../components/AuthLayout';

const authLinks = [
  { to: "/login", icon: "bi-box-arrow-in-right", text: "Sign In" }
];

<AuthLayout authLinks={authLinks}>
  {/* Your form content */}
</AuthLayout>
```

### FormInput
Generic input component with validation and icon support.

```jsx
import FormInput from '../components/FormInput';

<FormInput
  label="Email Address"
  icon="bi-envelope"
  type="email"
  value={formData.email}
  onChange={(e) => handleInputChange('email', e.target.value)}
  validationError={validationErrors.email}
  required
/>
```

### PasswordInput
Password input with show/hide toggle and strength indicator.

```jsx
import PasswordInput from '../components/PasswordInput';

<PasswordInput
  label="Password"
  value={formData.password}
  onChange={(e) => handleInputChange('password', e.target.value)}
  showPassword={showPassword}
  onTogglePassword={() => setShowPassword(!showPassword)}
  showStrength={true}
  passwordStrength={passwordStrength}
  validationError={validationErrors.password}
/>
```

### MobileInput
Mobile number input with country code and validation.

```jsx
import MobileInput from '../components/MobileInput';

<MobileInput
  label="Mobile Number"
  value={formData.mobile}
  onChange={(e) => handleInputChange('mobile', e.target.value)}
  isValid={mobileValid}
  validationError={validationErrors.mobile}
/>
```

## 🎣 Hooks

### useAuthForm
Custom hook for managing authentication form state with validation.

```jsx
import { useAuthForm } from '../hooks/useAuthForm';

const {
  formData,
  validationErrors,
  loading,
  mobileValid,
  passwordStrength,
  setLoading,
  handleInputChange
} = useAuthForm({
  name: '',
  email: '',
  mobile: '',
  password: ''
});
```

## 🔧 Services

### authService
Centralized authentication API service with consistent error handling.

```jsx
import { authService } from '../services/authService';

// Register user
const result = await authService.register({
  username: 'john_doe',
  email: 'john@example.com',
  phone: '1234567890',
  password: 'password123'
});

// Login user
const result = await authService.login({
  username: 'john_doe',
  password: 'password123'
});
```

## 🛠️ Utilities

### validation.js
Comprehensive validation utilities for form fields.

```jsx
import {
  validateEmail,
  validateMobile,
  calculatePasswordStrength,
  isFormValid
} from '../utils/validation';

// Validate email
const isValid = validateEmail('test@example.com');

// Check form validity
const formIsValid = isFormValid(formData, ['name', 'email'], validationErrors);
```

## 🎨 Styling

All components use the existing `AuthEnhanced.css` file, ensuring:
- ✅ Mobile-first responsive design
- ✅ Consistent visual styling
- ✅ Dark/light theme compatibility
- ✅ Accessibility support

## 📱 Responsive Features

- **PC**: Form width 400-500px centered
- **Tablet**: 70-80% width with proper spacing
- **Mobile**: 90-95% width with safe padding
- **Dynamic viewport height** for mobile browsers

## 🔄 Usage Examples

### Creating a New Auth Page

```jsx
import React from 'react';
import { useAuthForm } from '../hooks/useAuthForm';
import { authService } from '../services/authService';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';

export default function NewAuthPage() {
  const { formData, handleInputChange, loading, setLoading } = useAuthForm({
    email: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Your logic here
    setLoading(false);
  };

  const authLinks = [
    { to: "/login", icon: "bi-arrow-left", text: "Back to Login" }
  ];

  return (
    <AuthLayout authLinks={authLinks}>
      <h2 className="title">New Auth Page</h2>
      <form onSubmit={handleSubmit} className="form">
        <FormInput
          label="Email"
          icon="bi-envelope"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary btn-block">
          Submit
        </button>
      </form>
    </AuthLayout>
  );
}
```

## 🚀 Benefits

1. **Modularity**: Each component handles a single responsibility
2. **Reusability**: Components can be used across different pages
3. **Maintainability**: Centralized logic makes updates easier
4. **Consistency**: Uniform styling and behavior
5. **Scalability**: Easy to add new authentication flows
6. **Testing**: Components can be tested in isolation

## 🔧 Configuration

### API Endpoints
Update endpoints in `src/services/authService.js`:

```jsx
const API_ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  // ... other endpoints
};
```

### Validation Rules
Customize validation in `src/utils/validation.js`:

```jsx
export const validatePassword = (password) => {
  return password && password.length >= 8; // Change minimum length
};
```

This modular architecture ensures your authentication system is maintainable, scalable, and easy to extend for future requirements.