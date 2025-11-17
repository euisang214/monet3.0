'use client';
import React, {createContext, useContext, useState, useCallback, useEffect, ReactNode} from 'react';

interface StatusState{
  message: string;
  state: 'processing' | 'success' | 'error';
}

interface StatusContextValue{
  start: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  clear: () => void;
}

const StatusContext = createContext<StatusContextValue | undefined>(undefined);

export function StatusProvider({children}:{children:ReactNode}){
  const [status, setStatus] = useState<StatusState | null>(null);

  const start = useCallback((message: string)=>{
    setStatus({message, state: 'processing'});
  },[]);

  const success = useCallback((message: string)=>{
    setStatus({message, state: 'success'});
  },[]);

  const error = useCallback((message: string)=>{
    setStatus({message, state: 'error'});
  },[]);

  const clear = useCallback(()=> setStatus(null), []);

  useEffect(()=>{
    if(status && status.state !== 'processing'){
      const timer = setTimeout(()=> setStatus(null), 3000);
      return ()=> clearTimeout(timer);
    }
  },[status]);

  useEffect(()=>{
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof originalFetch>) => {
      start('Processing...');
      try{
        const res = await originalFetch(...args);
        if(!res.ok){
          let msg = res.statusText;
          try{
            const data = await res.clone().json();
            msg = (data.error || data.message || msg) as string;
          }catch{
            const text = await res.clone().text();
            if(text) msg = text;
          }
          error(msg);
        }else{
          success('Success');
        }
        return res;
      }catch(err:any){
        error(err?.message || 'Request failed');
        throw err;
      }
    };
    return ()=>{ window.fetch = originalFetch; };
  },[start, success, error]);

  return (
    <StatusContext.Provider value={{start, success, error, clear}}>
      {children}
      <StatusPopup status={status} />
    </StatusContext.Provider>
  );
}

export function useStatus(){
  const ctx = useContext(StatusContext);
  if(!ctx) throw new Error('useStatus must be used within a StatusProvider');
  return ctx;
}

function StatusPopup({status}:{status:StatusState | null}){
  if(!status) return null;
  const color =
    status.state === 'processing'
      ? 'var(--warning)'
      : status.state === 'success'
        ? 'var(--success)'
        : 'var(--error)';
  return (
    <div style={{
      position:'fixed',
      top:10,
      left:'50%',
      transform:'translateX(-50%)',
      background:color,
      color:'white',
      padding:'8px 16px',
      borderRadius:'var(--radius)',
      boxShadow:'var(--shadow)',
      display:'flex',
      alignItems:'center',
      gap:8,
      zIndex:1000
    }}>
      {status.state === 'processing' && <div className="status-spinner" />}
      <span>{status.state === 'error' ? 'Error' : status.message}</span>
    </div>
  );
}
