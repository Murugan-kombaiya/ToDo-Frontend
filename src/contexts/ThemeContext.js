import React, { createContext, useState, useContext, useEffect } from 'react';

// Create Theme Context
const ThemeContext = createContext();

// Theme Context Provider
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Set specific theme
  const setSpecificTheme = (themeName) => {
    if (themeName === 'light' || themeName === 'dark') {
      setTheme(themeName);
      localStorage.setItem('theme-manual', 'true');
    } else if (themeName === 'auto') {
      localStorage.removeItem('theme-manual');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  };

  // Effect to apply theme changes
  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme);

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content',
        theme === 'dark' ? '#0f172a' : '#ffffff'
      );
    } else {
      // Create meta theme-color if it doesn't exist
      const newMetaThemeColor = document.createElement('meta');
      newMetaThemeColor.name = 'theme-color';
      newMetaThemeColor.content = theme === 'dark' ? '#0f172a' : '#ffffff';
      document.getElementsByTagName('head')[0].appendChild(newMetaThemeColor);
    }

    // Dispatch custom event for theme change
    const themeChangeEvent = new CustomEvent('themeChanged', {
      detail: { theme, previousTheme: theme === 'light' ? 'dark' : 'light' }
    });
    window.dispatchEvent(themeChangeEvent);

    // Update body class for additional styling hooks
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);

  }, [theme]);

  // Initialize theme on first mount
  useEffect(() => {
    // Check for system preference if no saved theme
    if (!localStorage.getItem('theme')) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme('dark');
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem('theme-manual')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Enhanced toggle that marks as manual preference
  const toggleThemeManually = () => {
    localStorage.setItem('theme-manual', 'true');
    toggleTheme();
  };

  // Reset to system preference
  const useSystemTheme = () => {
    localStorage.removeItem('theme-manual');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  };

  const contextValue = {
    theme,
    toggleTheme: toggleThemeManually,
    setTheme: setSpecificTheme,
    useSystemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isAuto: !localStorage.getItem('theme-manual')
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// HOC for components that need theme
export const withTheme = (Component) => {
  return function ThemedComponent(props) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

export default ThemeContext;