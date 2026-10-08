'use client';
import { useState, useEffect } from 'react';
import { login, register } from '../lib/api';
import { useRouter } from 'next/navigation';

const BG_IMAGES = [
  'https://panoramadelart.com/sites/default/files/2023-01/a-botticelli-venus-naissance.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/f/fd/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg',
  'https://static-assets.artlogic.net/w_2000,h_2000,c_limit,f_auto,fl_lossy,q_auto/artlogicstorage/elmarsa/images/view/c97fe983f9851ca28fe682df6db7bd62/elmarsagallery-ammar-farhat-untitled-1962.jpg',
  'https://panoramadelart.com/sites/default/files/2026-01/a-friedrich-voyageur.jpg',
];

// ── FIX 3: centralised auth persistence function ────────
function persistAuth(data, prenom) {
  localStorage.setItem('token',    data.accessToken);
  localStorage.setItem('role',     data.role);
  localStorage.setItem('email',    data.email);
  localStorage.setItem('username', prenom || data.email.split('@')[0]);
  // Notify Header immediately — no reload required
  window.dispatchEvent(new Event('shopflow:auth'));
}

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [bgIdx,      setBgIdx]      = useState(0);
  const [bgVisible,  setBgVisible]  = useState(true);
  const [form, setForm] = useState({
    email:'', motDePasse:'', prenom:'', nom:'', role:'CUSTOMER'
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Cycle background
  useEffect(() => {
    const t = setInterval(() => {
      setBgVisible(false);
      setTimeout(() => { setBgIdx(i => (i+1) % BG_IMAGES.length); setBgVisible(true); }, 600);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = isRegister ? await register(form) : await login(form);

      // ── FIX 3: persist immediately, no page reload needed ──
      persistAuth(res.data, form.prenom);

      // Small delay so Header state can update before navigation
      setTimeout(() => router.push('/'), 80);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      position:'relative', overflow:'hidden',
      fontFamily:"'Segoe UI',sans-serif" }}>

      {/* Cycling blurred background */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:`url(${BG_IMAGES[bgIdx]})`,
        backgroundSize:'cover', backgroundPosition:'center',
        filter:'blur(8px) brightness(0.45)',
        transform:'scale(1.05)',
        opacity:bgVisible?1:0, transition:'opacity .6s ease',
      }}/>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)' }}/>

      {/* Card */}
      <div className="card" style={{ position:'relative', zIndex:2 }}>

        <div style={{ textAlign:'center', marginBottom:8 }}>
          <p style={{ fontSize:22, fontWeight:900, color:'#000',
            letterSpacing:2, textTransform:'uppercase', margin:0 }}>
            Shop<span style={{ color:'#7c3aed' }}>Flow</span>
          </p>
          <p className="login">{isRegister ? 'Create Account' : 'Sign In'}</p>
        </div>

        {error && (
          <div style={{ width:250, padding:'10px 14px',
            background:'rgba(239,68,68,0.1)', border:'1px solid #ef4444',
            borderRadius:8, color:'#dc2626', fontSize:12, textAlign:'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handle} style={{ display:'flex', flexDirection:'column',
          alignItems:'center', gap:18, width:'100%' }}>

          {isRegister && (
            <>
              <div className="inputBox">
                <input value={form.prenom} onChange={e=>set('prenom',e.target.value)}
                  required type="text"/>
                <span>First Name</span>
              </div>
              <div className="inputBox">
                <input value={form.nom} onChange={e=>set('nom',e.target.value)}
                  required type="text"/>
                <span>Last Name</span>
              </div>
              <div style={{ width:250 }}>
                <label style={{ fontSize:10, textTransform:'uppercase',
                  letterSpacing:2, color:'#555', display:'block', marginBottom:6 }}>
                  Account Type
                </label>
                <select value={form.role} onChange={e=>set('role',e.target.value)}
                  style={{ width:'100%', padding:10, border:'none',
                    borderLeft:'2px solid #000', borderBottom:'2px solid #000',
                    borderBottomLeftRadius:8, background:'transparent',
                    outline:'none', fontSize:13, color:'#000',
                    fontFamily:'inherit', cursor:'pointer' }}>
                  <option value="CUSTOMER">Customer / Reader</option>
                  <option value="SELLER">Seller / Artist / Author</option>
                </select>
              </div>
            </>
          )}

          <div className="inputBox">
            <input type="email" value={form.email}
              onChange={e=>set('email',e.target.value)} required/>
            <span>Email</span>
          </div>
          <div className="inputBox">
            <input type="password" value={form.motDePasse}
              onChange={e=>set('motDePasse',e.target.value)} required/>
            <span>Password</span>
          </div>

          <button type="submit" className="enter" disabled={loading}>
            {loading ? '...' : isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p style={{ fontSize:12, color:'#555', textAlign:'center',
          letterSpacing:1, marginTop:-8 }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span onClick={() => { setIsRegister(r=>!r); setError(''); }}
            style={{ fontWeight:700, color:'#000', cursor:'pointer',
              textDecoration:'underline' }}>
            {isRegister ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
      </div>

      <style>{`
        .login {
          color:#000;text-transform:uppercase;letter-spacing:2px;
          display:block;font-weight:bold;font-size:x-large;margin:0;
        }
        .card {
          display:flex;justify-content:center;align-items:center;
          min-height:360px;width:320px;flex-direction:column;gap:18px;
          background:#e3e3e3;
          box-shadow:16px 16px 32px #0a0000,-16px -16px 32px #060101;
          border-radius:8px;padding:32px 20px;
        }
        .inputBox{position:relative;width:250px;}
        .inputBox input{
          width:100%;padding:10px;outline:none;border:none;
          color:#000;font-size:1em;background:transparent;
          border-left:2px solid #000;border-bottom:2px solid #000;
          transition:.1s;border-bottom-left-radius:8px;box-sizing:border-box;
        }
        .inputBox span{
          margin-top:5px;position:absolute;left:0;
          transform:translateY(-4px);margin-left:10px;padding:10px;
          pointer-events:none;font-size:12px;color:#000;
          text-transform:uppercase;transition:.5s;letter-spacing:3px;
          border-radius:8px;top:0;
        }
        .inputBox input:valid~span,
        .inputBox input:focus~span{
          transform:translateX(113px) translateY(-15px);font-size:.8em;
          padding:5px 10px;background:#000;letter-spacing:.2em;color:#fff;
        }
        .inputBox input:valid,
        .inputBox input:focus{border:2px solid #efefef;border-radius:8px;}
        .enter{
          height:45px;width:120px;border-radius:5px;border:2px solid #000;
          cursor:pointer;background-color:transparent;transition:.5s;
          text-transform:uppercase;font-size:11px;letter-spacing:2px;font-weight:700;
        }
        .enter:hover:not(:disabled){background:rgb(0,0,0);color:white;}
        .enter:disabled{opacity:.5;cursor:not-allowed;}
        @media(max-width:450px){.card{width:90vw;padding:28px 18px;}}
      `}</style>
    </div>
  );
}