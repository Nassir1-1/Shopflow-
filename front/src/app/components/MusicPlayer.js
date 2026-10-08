'use client';
import { useEffect, useRef, useState } from 'react';

/*
  Why music didn't switch before:
  The iframe src was set once on first click. When mode changed, the handler
  read stale values from the closure. Now everything lives in refs so the
  event handler always sees the current values.
*/

const TRACKS = {
  classic: 'https://www.youtube.com/embed/1-Au_oI3iBM?autoplay=1&loop=1&playlist=1-Au_oI3iBM',
  graphic: 'https://www.youtube.com/embed/NzUBrieK6fc?autoplay=1&loop=1&playlist=NzUBrieK6fc',
};

export default function MusicPlayer() {
  const iframeRef  = useRef(null);
  const startedRef = useRef(false);   // has user clicked ▶ yet?
  const mutedRef   = useRef(false);
  const modeRef    = useRef(
    typeof window !== 'undefined'
      ? (localStorage.getItem('siteMode') || 'classic')
      : 'classic'
  );

  const [uiState, setUiState] = useState('idle');  // idle | playing | muted
  const [visible, setVisible] = useState(true);

  const buildSrc = (m, muted) =>
    `${TRACKS[m] || TRACKS.classic}${muted ? '&mute=1' : '&mute=0'}`;

  const reloadIframe = () => {
    if (!iframeRef.current) return;
    iframeRef.current.src = buildSrc(modeRef.current, mutedRef.current);
  };

  useEffect(() => {
    // Sync initial mode
    const saved = localStorage.getItem('siteMode') || 'classic';
    modeRef.current = saved;

    // Listen for mode changes fired from home page / header
    const onMode = (e) => {
      const next = e.detail || 'classic';
      if (next === modeRef.current) return;   // no change, skip reload
      modeRef.current = next;

      // Only swap the track if music is already playing
      if (startedRef.current) {
        reloadIframe();
      }
    };

    window.addEventListener('shopflow:mode', onMode);
    return () => window.removeEventListener('shopflow:mode', onMode);
  }, []); // empty — handler reads refs, never stale

  const handleClick = () => {
    if (!startedRef.current) {
      // First click → start
      startedRef.current = true;
      mutedRef.current   = false;
      reloadIframe();
      setUiState('playing');
    } else {
      // Toggle mute
      mutedRef.current = !mutedRef.current;
      reloadIframe();
      setUiState(mutedRef.current ? 'muted' : 'playing');
    }
  };

  const icon  = { idle:'▶', playing:'🎵', muted:'🔇' }[uiState];
  const title = { idle:'Play music', playing:'Mute', muted:'Unmute' }[uiState];

  return (
    <>
      <iframe
        ref={iframeRef}
        src=""             // empty until first click — required for autoplay policy
        width="0" height="0"
        title="background music"
        frameBorder="0"
        allow="autoplay"
        style={{ position:'fixed', opacity:0, pointerEvents:'none' }}
      />

      {visible && (
        <div style={{
          position:'fixed', bottom:24, left:24, zIndex:9000,
          display:'flex', alignItems:'center', gap:6,
        }}>
          <button onClick={handleClick} title={title} style={{
            width:40, height:40, borderRadius:'50%',
            background: uiState==='playing'
              ? 'rgba(124,58,237,0.75)' : 'rgba(0,0,0,0.65)',
            backdropFilter:'blur(8px)',
            border:`1px solid ${uiState==='playing' ? '#a78bfa' : 'rgba(255,255,255,0.2)'}`,
            color:'white', fontSize:16, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all .25s',
            boxShadow: uiState==='playing' ? '0 0 16px rgba(124,58,237,0.5)' : 'none',
          }}
          onMouseOver={e=>e.currentTarget.style.transform='scale(1.12)'}
          onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
            {icon}
          </button>
          <button onClick={() => setVisible(false)} title="Hide"
            style={{ width:18, height:18, borderRadius:'50%',
              background:'rgba(0,0,0,0.5)',
              border:'1px solid rgba(255,255,255,0.15)',
              color:'rgba(255,255,255,0.4)', fontSize:9,
              cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>
      )}
    </>
  );
}