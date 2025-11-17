'use client';
import React, { memo } from 'react';
import clsx from 'clsx';

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary'|'danger'|'muted'}){
  const {variant='primary', className, ...rest} = props;
  return <button {...rest} className={clsx('btn', {
    'btn-primary': variant==='primary',
    'btn-danger': variant==='danger',
    'btn-muted': variant==='muted',
  }, className)} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>){
  return <input {...props} className={clsx('input', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>){
  return <select {...props} className={clsx('input', props.className)} />;
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>){
  return <div {...props} className={clsx('card', props.className)} />;
}

export function Badge({children}:{children:React.ReactNode}){
  return <span className="badge">{children}</span>
}

function DataTableComponent<T extends Record<string, React.ReactNode>>({
  columns,
  rows,
}: {
  columns: { key: keyof T; label: string }[];
  rows: T[];
}) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={String(c.key)}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={String(c.key)}>{r[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;

export function Modal({
  isOpen,
  onClose,
  children,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        {title && (
          <h2 style={{ marginTop: 0, marginBottom: '16px' }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
