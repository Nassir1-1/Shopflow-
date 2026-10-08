'use client';
import { useState, useEffect } from 'react';
import { createProduct } from '../lib/api';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState({ msg:'', type:'' });
  const [preview, setPreview] = useState('');
  const [step,    setStep]    = useState(1); // 1=artwork info, 2=pricing, 3=preview
  const [form,    setForm]    = useState({
    nom:'', artistName:'', year:'', movement:'',
    description:'', prix:'', prixPromo:'',
    stock:'1', images:''
  });

  useEffect(() => {
    const email    = localStorage.getItem('email');
    const username = localStorage.getItem('username');
    const role     = localStorage.getItem('role');
    if (!email) { router.push('/login'); return; }
    // Any logged-in user can upload
    setUser({ email, username, role });
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.nom || !form.prix || !form.images) {
      showToast('Please fill artwork name, price and image URL.', 'error');
      return;
    }
    setLoading(true);
    try {
      const lines = [form.description];
      if (form.artistName) lines.push(`Artist: ${form.artistName}`);
      if (form.year)       lines.push(`Year: ${form.year}`);
      if (form.movement)   lines.push(`Movement: ${form.movement}`);
      const fullDesc = lines.filter(Boolean).join('\n');

      await createProduct({
        nom:         form.nom,
        description: fullDesc,
        prix:        parseFloat(form.prix),
        prixPromo:   form.prixPromo ? parseFloat(form.prixPromo) : null,
        stock:       parseInt(form.stock) || 1,
        images:      form.images,
      });
      showToast('🎨 Artwork published!', 'success');
      setTimeout(() => router.push('/products'), 1600);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed. Make sure you are logged in.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'' }), 3500);
  };

  const canNext1 = form.nom.trim() && form.artistName.trim();
  const canNext2 = form.prix && parseFloat(form.prix) > 0;
  const canPublish = form.images.trim();

  if (!user) return null;

  const stepTitles = ['Artwork Info', 'Pricing', 'Preview & Publish'];

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',
      fontFamily:"'Segoe UI',sans-serif",paddingBottom:60}}>

      {toast.msg && (
        <div style={{
          position:'fixed',bottom:24,right:24,zIndex:9999,
          padding:'14px 22px',borderRadius:12,fontSize:14,fontWeight:600,
          animation:'slideUp 0.3s ease',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          background: toast.type==='success' ? '#064e3b' : '#450a0a',
          color:       toast.type==='success' ? '#34d399' : '#f87171',
          border: `1px solid ${toast.type==='success'?'#065f46':'#7f1d1d'}`,
        }}>{toast.msg}</div>
      )}

      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px'}}>

        {/* Top bar */}
        <div style={{display:'flex',alignItems:'center',
          justifyContent:'space-between',marginBottom:36,flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <button onClick={()=>router.push('/products')} style={{
              background:'transparent',border:'1px solid rgba(167,139,250,0.4)',
              color:'#a78bfa',padding:'7px 16px',borderRadius:8,
              cursor:'pointer',fontSize:13}}>← Gallery</button>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:'#f0e6c8',margin:0}}>
                🎨 Upload Your Artwork
              </h1>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,margin:'4px 0 0'}}>
                Publishing as <span style={{color:'#a78bfa'}}>
                  {user.username || user.email.split('@')[0]}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:40}}>
          {stepTitles.map((title, i) => {
            const n = i + 1;
            const done   = step > n;
            const active = step === n;
            return (
              <div key={n} style={{display:'flex',alignItems:'center',flex: i<2?1:'auto'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,
                  cursor: done?'pointer':'default'}}
                  onClick={()=>done&&setStep(n)}>
                  <div style={{
                    width:36,height:36,borderRadius:'50%',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:14,fontWeight:700,transition:'all 0.3s',
                    background: done ? '#7c3aed' : active
                      ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.08)',
                    color: (done||active) ? 'white' : 'rgba(255,255,255,0.3)',
                    boxShadow: active ? '0 0 20px rgba(124,58,237,0.5)' : 'none',
                  }}>
                    {done ? '✓' : n}
                  </div>
                  <span style={{fontSize:11,color: active?'#a78bfa':'rgba(255,255,255,0.35)',
                    fontWeight:active?700:400,whiteSpace:'nowrap'}}>
                    {title}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{flex:1,height:2,margin:'0 10px',marginBottom:22,
                    background: done ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                    transition:'background 0.3s'}}/>
                )}
              </div>
            );
          })}
        </div>

        <div style={{display:'flex',gap:32,flexWrap:'wrap',alignItems:'flex-start'}}>

          {/* ── STEP 1: Artwork Info ── */}
          {step === 1 && (
            <div style={{flex:1,minWidth:300,display:'flex',flexDirection:'column',gap:20,
              animation:'fadeIn 0.3s ease'}}>
              <Field label="Artwork Title *" hint="The official name of the piece">
                <input style={inputStyle} placeholder="e.g. The Starry Night"
                  value={form.nom} onChange={e=>set('nom',e.target.value)}/>
              </Field>
              <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                <Field label="Artist Name *" style={{flex:1,minWidth:180}}>
                  <input style={inputStyle} placeholder="e.g. Vincent van Gogh"
                    value={form.artistName} onChange={e=>set('artistName',e.target.value)}/>
                </Field>
                <Field label="Year" style={{flex:'0 0 120px'}}>
                  <input style={inputStyle} placeholder="e.g. 1889" type="number"
                    value={form.year} onChange={e=>set('year',e.target.value)}/>
                </Field>
              </div>
              <Field label="Art Movement" hint="e.g. Impressionism, Cubism, Abstract...">
                <input style={inputStyle} placeholder="e.g. Post-Impressionism"
                  value={form.movement} onChange={e=>set('movement',e.target.value)}/>
              </Field>
              <Field label="Description" hint="Tell the story behind your artwork">
                <textarea style={{...inputStyle,resize:'vertical',minHeight:120,lineHeight:1.6}}
                  placeholder="Materials used, inspiration, dimensions, history..."
                  value={form.description} onChange={e=>set('description',e.target.value)}/>
              </Field>
              <button disabled={!canNext1} onClick={()=>setStep(2)} style={{
                ...btnStyle,opacity:canNext1?1:0.4,cursor:canNext1?'pointer':'not-allowed'}}>
                Continue to Pricing →
              </button>
            </div>
          )}

          {/* ── STEP 2: Pricing ── */}
          {step === 2 && (
            <div style={{flex:1,minWidth:300,display:'flex',flexDirection:'column',gap:20,
              animation:'fadeIn 0.3s ease'}}>
              <Field label="Selling Price (TND) *" hint="Set a fair price for your artwork">
                <input style={inputStyle} placeholder="e.g. 5000" type="number" min="0"
                  value={form.prix} onChange={e=>set('prix',e.target.value)}/>
              </Field>
              <Field label="Sale / Promo Price (TND)" hint="Optional — leave blank if no discount">
                <input style={inputStyle} placeholder="e.g. 4000 (leave blank if none)"
                  type="number" min="0"
                  value={form.prixPromo} onChange={e=>set('prixPromo',e.target.value)}/>
                {form.prixPromo && form.prix && parseFloat(form.prixPromo) < parseFloat(form.prix) && (
                  <p style={{color:'#34d399',fontSize:12,margin:'6px 0 0'}}>
                    ✓ Discount: {Math.round((1-parseFloat(form.prixPromo)/parseFloat(form.prix))*100)}% off
                  </p>
                )}
              </Field>
              <Field label="Number of Copies" hint="1 = one-of-a-kind original">
                <input style={{...inputStyle,maxWidth:120}} type="number" min="1"
                  value={form.stock} onChange={e=>set('stock',e.target.value)}/>
              </Field>
              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>setStep(1)} style={{...btnStyle,
                  background:'rgba(255,255,255,0.08)',flex:'0 0 auto'}}>
                  ← Back
                </button>
                <button disabled={!canNext2} onClick={()=>setStep(3)} style={{
                  ...btnStyle,flex:1,opacity:canNext2?1:0.4,
                  cursor:canNext2?'pointer':'not-allowed'}}>
                  Continue to Preview →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Image + Publish ── */}
          {step === 3 && (
            <div style={{flex:1,minWidth:300,display:'flex',flexDirection:'column',gap:20,
              animation:'fadeIn 0.3s ease'}}>
              <Field label="Image URL *"
                hint="Paste a direct image URL. Upload to imgur.com or imgbb.com first.">
                <input style={inputStyle}
                  placeholder="https://i.imgur.com/your-image.jpg"
                  value={form.images}
                  onChange={e=>{set('images',e.target.value);setPreview(e.target.value);}}/>
              </Field>
              <div style={{
                background:'rgba(167,139,250,0.06)',
                border:'1px solid rgba(167,139,250,0.15)',
                borderRadius:12,padding:'14px 18px',
              }}>
                <p style={{color:'#a78bfa',fontSize:13,fontWeight:700,margin:'0 0 8px'}}>
                  💡 Free image hosting
                </p>
                <div style={{display:'flex',gap:12}}>
                  {['imgur.com','imgbb.com','postimg.cc'].map(site=>(
                    <a key={site} href={`https://${site}`} target="_blank" rel="noreferrer"
                      style={{color:'rgba(255,255,255,0.5)',fontSize:12,
                        textDecoration:'none',padding:'4px 10px',
                        background:'rgba(255,255,255,0.06)',borderRadius:6}}>
                      {site} ↗
                    </a>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>setStep(2)} style={{...btnStyle,
                  background:'rgba(255,255,255,0.08)',flex:'0 0 auto'}}>
                  ← Back
                </button>
                <button disabled={!canPublish||loading} onClick={handleSubmit} style={{
                  ...btnStyle,flex:1,
                  opacity:canPublish&&!loading?1:0.4,
                  cursor:canPublish&&!loading?'pointer':'not-allowed',
                }}>
                  {loading ? '⏳ Publishing...' : '🚀 Publish Artwork'}
                </button>
              </div>
            </div>
          )}

          {/* ── Live preview (always visible on right) ── */}
          <div style={{flex:'0 0 220px',minWidth:200}}>
            <p style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',
              color:'rgba(255,255,255,0.3)',fontWeight:600,margin:'0 0 12px'}}>
              Live Preview
            </p>
            <div style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:16,overflow:'hidden',
            }}>
              <div style={{height:160,background:'rgba(255,255,255,0.03)',overflow:'hidden'}}>
                {preview ? (
                  <img src={preview} alt="preview"
                    style={{width:'100%',height:'100%',objectFit:'cover'}}
                    onError={()=>setPreview('')}/>
                ) : (
                  <div style={{height:'100%',display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center',
                    color:'rgba(255,255,255,0.15)',gap:6}}>
                    <span style={{fontSize:32}}>🎨</span>
                    <span style={{fontSize:11}}>Image preview</span>
                  </div>
                )}
              </div>
              <div style={{padding:14}}>
                <p style={{margin:'0 0 3px',fontWeight:700,color:'#f0e6c8',fontSize:13}}>
                  {form.nom||'Artwork Title'}
                </p>
                {form.artistName && (
                  <p style={{margin:'0 0 6px',color:'#C9952A',fontSize:11,fontStyle:'italic'}}>
                    {form.artistName}{form.year?`, ${form.year}`:''}
                  </p>
                )}
                {form.movement && (
                  <p style={{margin:'0 0 8px',color:'rgba(255,255,255,0.3)',fontSize:10}}>
                    {form.movement}
                  </p>
                )}
                <p style={{margin:'0 0 10px',fontSize:11,color:'rgba(255,255,255,0.35)',
                  lineHeight:1.5,
                  overflow:'hidden',display:'-webkit-box',
                  WebkitLineClamp:3,WebkitBoxOrient:'vertical'}}>
                  {form.description||'Description...'}
                </p>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:14,fontWeight:800,color:'#C9952A'}}>
                    {form.prix?`${parseFloat(form.prix).toLocaleString()} TND`:'— TND'}
                  </span>
                  {form.prixPromo&&parseFloat(form.prixPromo)<parseFloat(form.prix)&&(
                    <span style={{fontSize:10,color:'#34d399',
                      background:'rgba(52,211,153,0.1)',
                      padding:'2px 6px',borderRadius:10}}>
                      -{Math.round((1-parseFloat(form.prixPromo)/parseFloat(form.prix))*100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress summary */}
            <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:6}}>
              {[
                ['Title',   !!form.nom],
                ['Artist',  !!form.artistName],
                ['Price',   !!form.prix],
                ['Image',   !!form.images],
              ].map(([label,done])=>(
                <div key={label} style={{display:'flex',alignItems:'center',
                  gap:8,fontSize:12}}>
                  <span style={{
                    width:16,height:16,borderRadius:'50%',flexShrink:0,
                    background:done?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.05)',
                    border:`1px solid ${done?'#34d399':'rgba(255,255,255,0.1)'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:9,color:done?'#34d399':'transparent',
                  }}>✓</span>
                  <span style={{color:done?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.25)'}}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes slideUp  { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @media(max-width:640px){ .form-right{display:none} }
      `}</style>
    </div>
  );
}

// ── Small helper components ──
const inputStyle = {
  background:'rgba(255,255,255,0.05)',
  border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:10, padding:'11px 14px',
  color:'white', fontSize:14, outline:'none',
  width:'100%', boxSizing:'border-box',
  fontFamily:"'Segoe UI',sans-serif",
  transition:'border-color 0.2s',
};

const btnStyle = {
  padding:'14px 24px',
  background:'linear-gradient(135deg,#7c3aed,#a855f7)',
  color:'white', border:'none', borderRadius:12,
  fontSize:15, fontWeight:700, cursor:'pointer',
  transition:'all 0.3s',
  boxShadow:'0 8px 24px rgba(124,58,237,0.35)',
};

function Field({ label, hint, children, style }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:7,...style}}>
      <label style={{fontSize:12,textTransform:'uppercase',letterSpacing:'0.08em',
        color:'rgba(255,255,255,0.5)',fontWeight:600}}>
        {label}
      </label>
      {children}
      {hint && <p style={{fontSize:12,color:'rgba(255,255,255,0.25)',margin:0}}>{hint}</p>}
    </div>
  );
}