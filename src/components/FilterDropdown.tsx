'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FilterDropdownProps {
  label: string;
  options: string[];
  /**
   * Called whenever the selection changes.
   */
  onChange?: (values: string[]) => void;
}

/**
 * A searchable multi-select dropdown.
 *
 * Features:
 * - Search within options
 * - Multi-select with checkboxes and "Select all"
 * - Selected options appear at the top of the list and inside the toggle
 */
export default function FilterDropdown({
  label,
  options,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleOption = (opt: string) => {
    setSelected((prev) => {
      const next = prev.includes(opt)
        ? prev.filter((o) => o !== opt)
        : [...prev, opt];
      onChange?.(next);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = prev.length === options.length ? [] : options;
      onChange?.(next);
      return next;
    });
  };

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  // show selected options at the top
  const ordered = [...filtered].sort((a, b) => {
    const aSel = selected.includes(a);
    const bSel = selected.includes(b);
    if (aSel && !bSel) return -1;
    if (!aSel && bSel) return 1;
    return a.localeCompare(b);
  });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 4,
          minWidth: 160,
        }}
      >
        {selected.length === 0 ? (
          <span>{label}</span>
        ) : (
          selected.map((opt) => (
            <span key={opt} className="badge">
              {opt}
            </span>
          ))
        )}
        <span style={{ marginLeft: 'auto' }}>▾</span>
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            zIndex: 1000,
            padding: 8,
            width: 220,
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          <input
            className="input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 8, width: '100%' }}
          />

          <label
            className="row"
            style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}
          >
            <input
              type="checkbox"
              checked={selected.length === options.length}
              onChange={toggleAll}
            />
            <span>Select all</span>
          </label>

          <div className="col" style={{ gap: 4 }}>
            {ordered.map((opt) => (
              <label
                key={opt}
                className="row"
                style={{ alignItems: 'center', gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

