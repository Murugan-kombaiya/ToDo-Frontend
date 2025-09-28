import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ResponsiveDropdown.css';

/**
 * ResponsiveDropdown - A fully responsive dropdown component
 *
 * Features:
 * - Mobile responsive with proper touch targets
 * - Auto-positioning to prevent overflow
 * - Scrollable options list for long lists
 * - Keyboard navigation support
 * - Custom styling support
 * - Icon support in options
 *
 * Props:
 * - value: Current selected value
 * - onChange: Callback when value changes
 * - options: Array of {value, label, icon?, disabled?}
 * - placeholder: Placeholder text
 * - disabled: Whether dropdown is disabled
 * - className: Additional CSS class
 * - size: 'sm' | 'md' | 'lg'
 * - maxHeight: Maximum height for options (default: 200px)
 * - searchable: Enable search/filter functionality
 */
const ResponsiveDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  size = 'md',
  maxHeight = 200,
  searchable = false,
  error = false,
  helperText = '',
  label = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Find selected option
  const selectedOption = options.find(option => option.value === value) || null;

  // Calculate dropdown position to prevent overflow
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // If not enough space below, show above
    if (spaceBelow < dropdownRect.height && spaceAbove > dropdownRect.height) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      calculatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, calculatePosition]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            handleOptionSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Tab':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(-1);
      setSearchTerm('');
    }
  };

  const handleOptionSelect = (option) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
  };

  return (
    <div className={`responsive-dropdown-container ${className}`} ref={containerRef}>
      {label && (
        <label className="responsive-dropdown-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div
        className={`
          responsive-dropdown
          responsive-dropdown--${size}
          ${isOpen ? 'responsive-dropdown--open' : ''}
          ${disabled ? 'responsive-dropdown--disabled' : ''}
          ${error ? 'responsive-dropdown--error' : ''}
        `}
      >
        <button
          ref={triggerRef}
          type="button"
          className="responsive-dropdown__trigger"
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={label || placeholder}
        >
          <div className="responsive-dropdown__value">
            {selectedOption ? (
              <>
                {selectedOption.icon && (
                  <span className="responsive-dropdown__icon">
                    {selectedOption.icon}
                  </span>
                )}
                <span className="responsive-dropdown__text">
                  {selectedOption.label}
                </span>
              </>
            ) : (
              <span className="responsive-dropdown__placeholder">
                {placeholder}
              </span>
            )}
          </div>
          <div className="responsive-dropdown__chevron">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={isOpen ? 'rotate-180' : ''}
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className={`
              responsive-dropdown__menu
              responsive-dropdown__menu--${dropdownPosition}
            `}
            style={{ maxHeight: `${maxHeight}px` }}
            role="listbox"
          >
            {searchable && (
              <div className="responsive-dropdown__search">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="responsive-dropdown__search-input"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="responsive-dropdown__options">
              {filteredOptions.length === 0 ? (
                <div className="responsive-dropdown__no-options">
                  {searchable && searchTerm ? 'No matching options' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    className={`
                      responsive-dropdown__option
                      ${option.value === value ? 'responsive-dropdown__option--selected' : ''}
                      ${index === highlightedIndex ? 'responsive-dropdown__option--highlighted' : ''}
                      ${option.disabled ? 'responsive-dropdown__option--disabled' : ''}
                    `}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.icon && (
                      <span className="responsive-dropdown__option-icon">
                        {option.icon}
                      </span>
                    )}
                    <span className="responsive-dropdown__option-text">
                      {option.label}
                    </span>
                    {option.value === value && (
                      <span className="responsive-dropdown__check">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M13.5 4.5L6 12L2.5 8.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {(error || helperText) && (
        <div className={`responsive-dropdown-helper ${error ? 'error' : ''}`}>
          {error ? error : helperText}
        </div>
      )}
    </div>
  );
};

export default ResponsiveDropdown;