'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useMode } from '../lib/useMode';

export default function Header() {
  // ── FIX 1 + FIX 3: mounted guard, no SSR localStorage ─
  const [mounted, setMounted] = useState(false);
  const [user,    setUser]    = useState(null);
  // FIX 5: topCat drives Gallery/Library swap instantly
  const [topCat,  setTopCat]  = useState('art');
  const { isClassic } = useMode();

  const readUser = useCallback(() => {
    const email    = localStorage.getItem('email');
    const role     = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (email) setUser({ email, role, username });
    else       setUser(null);
  }, []);

  useEffect(() => {
    // Read everything from localStorage only on client
    readUser();
    setTopCat(localStorage.getItem('topCat') || 'art');
    setMounted(true);

    // FIX 3: listen for auth events (login fires this)
    window.addEventListener('shopflow:auth',   readUser);
    window.addEventListener('storage',         readUser);

    // FIX 5: listen for topCat changes from home page
    const onTopCat = (e) => setTopCat(e.detail || 'art');
    window.addEventListener('shopflow:topcat', onTopCat);

    // Also sync on window focus (e.g. user navigated away and back)
    const onFocus = () => {
      setTopCat(localStorage.getItem('topCat') || 'art');
      readUser();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('shopflow:auth',   readUser);
      window.removeEventListener('storage',         readUser);
      window.removeEventListener('shopflow:topcat', onTopCat);
      window.removeEventListener('focus',           onFocus);
    };
  }, [readUser]);

  const handleLogout = () => {
    ['token','role','email','username'].forEach(k => localStorage.removeItem(k));
    setUser(null);
    window.dispatchEvent(new Event('shopflow:auth'));
    window.location.href = '/login';
  };

  const isBooks = mounted && topCat === 'books';

  const NavBtn = ({ children, ...props }) => (
    <button className="uv-btn" {...props}>
      <span/><span/><span/><span/><span/>
      <span>{children}</span>
    </button>
  );

  // SSR: render a shell with no user-specific content
  if (!mounted) {
    return (
      <nav className="sf-nav">
        <div className="sf-nav__side sf-nav__left"/>
        <div className="sf-nav__center">
          <span style={{color:'rgba(255,255,255,0.3)',fontSize:13}}>ShopFlow</span>
        </div>
        <div className="sf-nav__side sf-nav__right"/>
        <NavStyle/>
      </nav>
    );
  }

  return (
    <>
      <nav className="sf-nav">

        {/* LEFT: user chip → portfolio */}
        <div className="sf-nav__side sf-nav__left">
          {user && (
            <div className="sf-chip"
              onClick={() => window.location.href=`/artist/${encodeURIComponent(user.email)}`}
              title="Your portfolio">
              👤 {user.username || user.email.split('@')[0]}
              <span className="sf-chip__role">{user.role}</span>
            </div>
          )}
        </div>

        {/* CENTER: FIX 5 — instant Gallery / Library swap */}
        <div className="sf-nav__center">
          <Link href="/"><NavBtn>Home</NavBtn></Link>

          {/* ── THE SWAP ── */}
          {isBooks
            ? <Link href="/books"><NavBtn>📚 Library</NavBtn></Link>
            : <Link href="/products"><NavBtn>🎨 Gallery</NavBtn></Link>
          }

          <Link href="/cart"><NavBtn>Cart</NavBtn></Link>

          {/* Upload routes to the correct form */}
          <Link href={isBooks ? '/books/upload' : '/order'}>
            <NavBtn>Upload</NavBtn>
          </Link>
        </div>

        {/* RIGHT: auth */}
        <div className="sf-nav__side sf-nav__right">
          {user
            ? <button className="logout-btn" onClick={handleLogout}>Logout</button>
            : <Link href="/login"><NavBtn>Login</NavBtn></Link>
          }
        </div>
      </nav>
      <NavStyle/>
    </>
  );
}

function NavStyle() {
  return (
    <style>{`
      .sf-nav {
        position:sticky; top:0; z-index:1000;
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 16px;
        background:rgba(10,10,20,0.97);
        backdrop-filter:blur(14px);
        border-bottom:1px solid rgba(255,255,255,0.08);
        min-height:60px; gap:8px;
      }
      .sf-nav__side{display:flex;align-items:center;gap:8px;flex-shrink:0;}
      .sf-nav__left {justify-content:flex-start;}
      .sf-nav__right{justify-content:flex-end;}
      .sf-nav__center{flex:1;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;}

      .sf-chip{
        display:flex;align-items:center;gap:6px;
        color:rgb(217,176,255);font-size:11px;font-weight:bold;
        background:rgba(100,61,136,0.35);
        border:1px solid rgba(217,176,255,0.3);
        border-radius:1em;padding:5px 11px;
        white-space:nowrap;cursor:pointer;transition:background .2s;
      }
      .sf-chip:hover{background:rgba(100,61,136,0.65);}
      .sf-chip__role{
        font-size:8px;background:rgba(217,176,255,0.18);
        padding:2px 5px;border-radius:8px;text-transform:uppercase;
      }

      .uv-btn{
        font-family:Arial,sans-serif;font-weight:bold;
        color:white;background:rgba(23,23,23,0.85);
        padding:0.55em 1.1em;border:none;border-radius:.6rem;
        position:relative;cursor:pointer;overflow:hidden;font-size:12px;
      }
      .uv-btn span:not(:nth-child(6)){
        position:absolute;left:50%;top:50%;
        transform:translate(-50%,-50%);
        height:28px;width:28px;
        background:#0c66ed;border-radius:50%;transition:.6s ease;
      }
      .uv-btn span:nth-child(6){position:relative;}
      .uv-btn span:nth-child(1){transform:translate(-3.3em,-4em);}
      .uv-btn span:nth-child(2){transform:translate(-6em,1.3em);}
      .uv-btn span:nth-child(3){transform:translate(-.2em,1.8em);}
      .uv-btn span:nth-child(4){transform:translate(3.5em,1.4em);}
      .uv-btn span:nth-child(5){transform:translate(3.5em,-3.8em);}
      .uv-btn:hover span:not(:nth-child(6)){
        transform:translate(-50%,-50%) scale(4);transition:1.5s ease;
      }

      .logout-btn{
        padding:0.55em 1.3em;background:#7f1d1d;color:white;
        font-weight:bold;font-size:12px;
        border:1px solid #991b1b;border-radius:.6rem;
        cursor:pointer;transition:background .2s;
      }
      .logout-btn:hover{background:#b91c1c;}

      @media(max-width:640px){
        .sf-nav{flex-wrap:wrap;padding:8px 10px;}
        .sf-nav__center{order:3;width:100%;}
        .sf-nav__side{flex:none;}
        .uv-btn{padding:.45em .8em;font-size:11px;}
      }
    `}</style>
  );
}