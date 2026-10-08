'use client';
import { useEffect, useState } from 'react';
import { THEME } from '../lib/useMode';

export default function PageBg({ forceMode, forceImages }) {
  const [mode, setMode] = useState(() =>
    typeof window!=='undefined' ? (localStorage.getItem('siteMode')||'classic') : 'classic'
  );
  const [idx, setIdx] = useState(0);

  const images = forceImages || THEME[forceMode||mode]?.bgImages || THEME.classic.bgImages;

  useEffect(() => {
    if (forceMode || forceImages) return; // static mode, no listener needed
    const handler = (e) => { setMode(e.detail||'classic'); setIdx(0); };
    window.addEventListener('shopflow:mode', handler);
    return () => window.removeEventListener('shopflow:mode', handler);
  }, [forceMode, forceImages]);

  useEffect(() => { setIdx(0); }, [images]);

  useEffect(() => {
    const t = setInterval(() => setIdx(i=>(i+1)%images.length), 7000);
    return () => clearInterval(t);
  }, [images]);

  return (
    <>
      {images.map((url, i) => (
        <div key={url} style={{
          position:'fixed', inset:0, zIndex:0,
          backgroundImage:`url(${url})`,
          backgroundSize:'cover', backgroundPosition:'center',
          filter:'blur(4px) brightness(0.49)',
          transform:'scale(1.02)',
          opacity: i===idx ? 1 : 0,
          transition:'opacity 1.5s ease',
          pointerEvents:'none',
        }}/>
      ))}
      <div style={{position:'fixed',inset:0,zIndex:1,
        background:'rgba(5,5,12,0.45)',pointerEvents:'none'}}/>
    </>
  );
}