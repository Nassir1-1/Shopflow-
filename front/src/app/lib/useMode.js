'use client';
import { useState, useEffect, useCallback } from 'react';

export const THEME = {
  classic: {
    accent:          '#C9952A',
    accentGrad:      'linear-gradient(135deg,#C9952A,#f0c040)',
    accentGlow:      'rgba(201,149,42,0.35)',
    textPrimary:     '#f0e6c8',
    cardBorder:      'rgba(201,149,42,0.15)',
    cardBorderHover: 'rgba(201,149,42,0.5)',
    cardBg:          'rgba(255,255,255,0.05)',
    cardRadius:      16,
    addBtnRadius:    '50%',

    // ── Fonts ─────────────────────────────────────────
    fontGalleryTitle: 'var(--font-classic-gallery-title)', // Brione
    fontTitle:        'var(--font-classic-title)',          // Moralana
    fontScript:       'var(--font-classic-script)',         // Symphonie Calligraphy
    fontBody:         'var(--font-classic-body)',           // Bidena / EB Garamond

    apiCategory: 'CLASSIC_ART',
    label:       '🎨 Classic Art',
    emptyIcon:   '🖼️',

    bgImages: [
      'https://upload.wikimedia.org/wikipedia/commons/f/fd/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg',
      'https://panoramadelart.com/sites/default/files/2023-01/a-botticelli-venus-naissance.jpg',
      'https://static-assets.artlogic.net/w_2000,h_2000,c_limit,f_auto,fl_lossy,q_auto/artlogicstorage/elmarsa/images/view/c97fe983f9851ca28fe682df6db7bd62/elmarsagallery-ammar-farhat-untitled-1962.jpg',
      'https://panoramadelart.com/sites/default/files/2026-01/a-friedrich-voyageur.jpg',
    ],
  },

  graphic: {
    accent:          '#e879f9',
    accentGrad:      'linear-gradient(135deg,#7c3aed,#e879f9)',
    accentGlow:      'rgba(124,58,237,0.4)',
    textPrimary:     '#ffffff',
    cardBorder:      'rgba(124,58,237,0.2)',
    cardBorderHover: 'rgba(232,121,249,0.55)',
    cardBg:          'rgba(255,255,255,0.04)',
    cardRadius:      10,
    addBtnRadius:    '6px',

    // ── Fonts ─────────────────────────────────────────
    fontGalleryTitle: 'var(--font-graphic-gallery-title)', // Cravelo
    fontTitle:        'var(--font-graphic-body)',           // Vintage Melinda
    fontScript:       'var(--font-graphic-artist)',         // Armelie
    fontBody:         'var(--font-graphic-body)',           // Vintage Melinda / Josefin Sans

    apiCategory: 'GRAPHIC_DESIGN',
    label:       '✏️ Graphic Design',
    emptyIcon:   '🎨',

    bgImages: [
      'https://i.pinimg.com/1200x/15/29/de/1529dec3f7e010bd71a3b02f4fe9e156.jpg',
      'https://i.pinimg.com/736x/5b/73/dc/5b73dc5cbc905047d88a7853ad24c06f.jpg',
      'https://cdna.artstation.com/p/assets/images/images/098/084/200/large/feres-ghzela1.jpg?1776091620',
      'https://i.pinimg.com/736x/25/ec/4d/25ec4d80a59b8f82efd4bd7e5dec3ec5.jpg',
    ],
  },
};

export function useMode() {
  const [mode, setMode] = useState('classic');

  useEffect(() => {
    const saved = localStorage.getItem('siteMode') || 'classic';
    setMode(saved);
    _applyBody(saved);

    const handler = (e) => {
      setMode(e.detail);
      _applyBody(e.detail);
    };
    window.addEventListener('shopflow:mode', handler);
    return () => window.removeEventListener('shopflow:mode', handler);
  }, []);

  const switchMode = useCallback((m) => {
    setMode(m);
    localStorage.setItem('siteMode', m);
    _applyBody(m);
    window.dispatchEvent(new CustomEvent('shopflow:mode', { detail: m }));
  }, []);

  return {
    mode,
    switchMode,
    isClassic: mode === 'classic',
    t: THEME[mode],
  };
}

function _applyBody(m) {
  if (typeof document === 'undefined') return;
  document.body.classList.remove('mode-classic', 'mode-graphic');
  document.body.classList.add(`mode-${m}`);
}