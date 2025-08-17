'use client';
import React from 'react';
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

export function DataTable<T>({columns, rows}:{columns:{key:keyof T, label:string}[], rows:T[]}){
  return (
    <table className="table">
      <thead><tr>{columns.map(c=><th key={String(c.key)}>{c.label}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i)=>(
          <tr key={i}>
            {columns.map(c=>(<td key={String(c.key)}>{String(r[c.key])}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
