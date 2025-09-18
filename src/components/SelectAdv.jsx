import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/*
  SelectAdv: Custom select with icon support inside options

  Props:
  - value: current value
  - onChange: (newValue) => void
  - options: Array<{ value: string|number, label: string, iconClass?: string }>
  - placeholder?: string
  - size?: 'sm' | 'md' | 'lg'
  - className?: string
  - disabled?: boolean
*/
export default function SelectAdv({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  size = 'md',
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  const selected = useMemo(() => options.find(o => String(o.value) === String(value)) || null, [options, value]);

  useEffect(() => {
    const onClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelect = useCallback((opt) => {
    onChange && onChange(opt.value);
    setOpen(false);
    setHighlightIndex(-1);
    // Restore focus to trigger for accessibility
    if (triggerRef.current) triggerRef.current.focus();
  }, [onChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'Tab') { setOpen(false); return; }
      const max = options.length - 1;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex(i => Math.min(max, i < 0 ? 0 : i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex(i => Math.max(0, i < 0 ? max : i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex <= max) {
          const opt = options[highlightIndex];
          if (opt) { handleSelect(opt); }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, options, highlightIndex, handleSelect]);

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      const idx = Math.max(0, options.findIndex(o => String(o.value) === String(value)));
      setHighlightIndex(idx);
    }
  };

  return (
    <div ref={wrapRef} className={`select-adv2 ${className} ${disabled ? 'is-disabled' : ''} size-${size}`}>
      <button
        type="button"
        ref={triggerRef}
        className={`select-trigger ${open ? 'is-open' : ''}`}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="select-value">
          {selected ? (
            <>
              {selected.iconClass ? <i className={`select-icon ${selected.iconClass}`} /> : null}
              <span className="select-label">{selected.label}</span>
            </>
          ) : (
            <span className="select-placeholder">{placeholder}</span>
          )}
        </div>
        <i className="select-chevron bi bi-chevron-down" aria-hidden="true" />
      </button>

      {open && (
        <div className="select-menu" role="listbox">
          {options.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            const isHighlighted = idx === highlightIndex;
            return (
              <div
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                className={`select-option ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                onMouseEnter={() => setHighlightIndex(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}
                tabIndex={-1}
              >
                {opt.iconClass ? <i className={`select-option-icon ${opt.iconClass}`} /> : null}
                <span className="select-option-label">{opt.label}</span>
                {isSelected ? <i className="select-check bi bi-check2" /> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
