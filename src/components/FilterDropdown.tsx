'use client';
import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';

// Custom toggle for Dropdown - required for proper positioning
const CustomToggle = React.forwardRef<HTMLAnchorElement, any>(
  ({ children, onClick }, ref) => (
    <a
      href=""
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    >
      {children}
      {' '}\u25bc
    </a>
  )
);
CustomToggle.displayName = 'CustomToggle';

// Custom menu with a search box
const CustomMenu = React.forwardRef<HTMLDivElement, any>(
  ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
    const [value, setValue] = useState('');

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <Form.Control
          autoFocus
          className="mx-3 my-2 w-auto"
          placeholder="Type to filter..."
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <ul className="list-unstyled">
          {React.Children.toArray(children).filter(
            (child: any) =>
              !value ||
              child.props.children
                .toLowerCase()
                .startsWith(value.toLowerCase())
          )}
        </ul>
      </div>
    );
  }
);
CustomMenu.displayName = 'CustomMenu';

interface FilterDropdownProps {
  label: string;
  options: string[];
  onSelect?: (value: string | null) => void;
}

export function FilterDropdown({ label, options, onSelect }: FilterDropdownProps) {
  return (
    <Dropdown onSelect={onSelect}>
      <Dropdown.Toggle as={CustomToggle} id={`dropdown-${label}`}>
        {label}
      </Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu}>
        {options.map((opt) => (
          <Dropdown.Item eventKey={opt} key={opt}>
            {opt}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default FilterDropdown;
