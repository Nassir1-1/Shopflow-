'use client';
import { useState, useEffect } from 'react';
import { createProduct } from '../lib/api';
import { useRouter } from 'next/navigation';
import { useMode } from '../lib/useMode';
import PageBg from '../components/PageBg';

async function detectCategory(nom, description, imageUrl) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514', max_tokens:20,
        messages:[{role:'user',content:`Classify this artwork as CLASSIC_ART or GRAPHIC_DESIGN.
Name: ${nom}
Description: ${description}
Reply with ONLY one word: CLASSIC_ART or GRAPHIC_DESIGN`}],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim().toUpperCase();
    return text?.includes('GRAPHIC') ? 'GRAPHIC_DESIGN' : 'CLASSIC_ART';
  } catch { return null; }
}

export default function UploadPage() {
  const router = useRouter();
  const { t: siteT, isClassic: siteIsClassic } = useMode();

  const [user,        setUser]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiSuggestion,setAiSuggestion]= useState(null);
  const [toast,       setToast]       = useState({msg:'',type:''});
  const [preview,     setPreview]     = useState('');
  const [step,        setStep]        = useState(1);
  const [form, setForm] = useState({
    nom:'', artistName:'', year:'', movement:'',
    description:'', prix:'', prixPromo:'',
    stock:'0', images:'',
    artCategory: 'CLASSIC_ART',
  });

  useEffect(() => {
    const email    = localStorage.getItem('email');
    const username = localStorage.getItem('username');
    const role     = localStorage.getItem('role');
    if (!email) { router.push('/login'); return; }
    setUser({email, username, role});
    const savedMode = localStorage.getItem('siteMode') || 'classic';
    setForm(f=>({...f, artCategory: savedMode==='graphic'?'GRAPHIC_DESIGN':'CLASSIC_ART'}));
  }, []);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // The form's chosen category drives the background
  const formIsClassic = form.artCategory === 'CLASSIC_ART';
  // forceMode for PageBg: 'classic' or 'graphic' based on form selection
  const bgMode = formIsClassic ? 'classic' : 'graphic';

  // Accent colors based on FORM category (not site mode)
  const accent     = formIsClassic ? '#C9952A' : '#e879f9';
  const accentGrad = formIsClassic
    ? 'linear-gradient(135deg,#C9952A,#f0c040)'
    : 'linear-gradient(135deg,#7c3aed,#e879f9)';
  const accentGlow = formIsClassic
    ? 'rgba(201,149,42,0.35)' : 'rgba(124,58,237,0.35)';
  const btnColor   = formIsClassic ? '#1a0e00' : 'white';

  const fontTitle  = formIsClassic
    ? 'var(--font-classic-gallery-title)'
    : 'var(--font-graphic-gallery-title)';
  const fontBody   = formIsClassic
    ? 'var(--font-classic-body)'
    : 'var(--font-graphic-body)';
  const fontScript = formIsClassic
    ? 'var(--font-classic-script)'
    : 'var(--font-graphic-artist)';

  const inputStyle = {
    background:'rgba(255,255,255,0.06)',
    border:`1px solid rgba(255,255,255,0.12)`,
    borderRadius:10, padding:'11px 14px',
    color:'white', fontSize:14, outline:'none',
    width:'100%', boxSizing:'border-box',
    fontFamily:fontBody, transition:'border-color .2s',
  };
  const btnStyle = {
    padding:'14px 24px', background:accentGrad,
    color:btnColor, border:'none', borderRadius:12,
    fontSize:15, fontWeight:700, cursor:'pointer',
    transition:'all .3s', fontFamily:fontBody,
    boxShadow:`0 8px 24px ${accentGlow}`,
  };

  const handleAiDetect = async () => {
    if (!form.nom && !form.description && !form.images) {
      showToast('Fill name, description or image first.','error'); return;
    }
    setAiLoading(true); setAiSuggestion(null);
    const result = await detectCategory(form.nom, form.description, form.images);
    setAiLoading(false);
    if (result) {
      setAiSuggestion(result);
      set('artCategory', result);
      showToast(result==='CLASSIC_ART'?'🎨 AI: Classic Art':'✏️ AI: Graphic Design','success');
    } else {
      showToast('AI unavailable — select manually.','error');
    }
  };

  const handleSubmit = async () => {
    if (!form.nom||!form.prix||!form.images) {
      showToast('Fill name, price and image URL.','error'); return;
    }
    setLoading(true);
    try {
      const desc = [form.description,
        form.artistName?`Artist: ${form.artistName}`:'',
        form.year?`Year: ${form.year}`:'',
        form.movement?`Movement: ${form.movement}`:'',
      ].filter(Boolean).join('\n');

      await createProduct({
        nom:form.nom, description:desc,
        prix:parseFloat(form.prix),
        prixPromo:form.prixPromo?parseFloat(form.prixPromo):null,
        stock:parseInt(form.stock)||1,
        images:form.images,
        artCategory:form.artCategory,
      });
      showToast('🎨 Published!','success');
      setTimeout(()=>router.push('/products'),1600);
    } catch(err){
      showToast(err.response?.data?.error||'Failed. Make sure you are logged in.','error');
    } finally { setLoading(false); }
  };

  const showToast=(msg,type)=>{
    setToast({msg,type});
    setTimeout(()=>setToast({msg:'',type:''}),3500);
  };

  const canNext1=form.nom.trim()&&form.artistName.trim();
  const canNext2=form.prix&&parseFloat(form.prix)>0;
  const canPublish=form.images.trim();

  if (!user) return null;

  return (
    <div style={{minHeight:'100vh',fontFamily:fontBody,
      position:'relative',paddingBottom:60,color:'white'}}>

      {/* ── Background follows the FORM's chosen category ── */}
      <PageBg forceMode={bgMode} />

      {toast.msg&&(
        <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,
          padding:'14px 22px',borderRadius:12,fontSize:14,fontWeight:600,
          animation:'slideUp .3s ease',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          background:toast.type==='success'?'#064e3b':'#450a0a',
          color:toast.type==='success'?'#34d399':'#f87171',
          border:`1px solid ${toast.type==='success'?'#065f46':'#7f1d1d'}`,
          fontFamily:fontBody}}>
          {toast.msg}
        </div>
      )}

      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px',
        position:'relative',zIndex:2}}>

        {/* Top bar */}
        <div style={{display:'flex',alignItems:'center',gap:16,
          marginBottom:32,flexWrap:'wrap'}}>
          <button onClick={()=>router.push('/products')} style={{
            background:'transparent',border:`1px solid ${accent}66`,
            color:accent,padding:'7px 16px',borderRadius:8,
            cursor:'pointer',fontSize:13,fontFamily:fontBody}}>
            ← Back
          </button>
          <div>
            <h1 style={{fontSize:24,fontWeight:800,margin:0,
              color:'#f0e6c8',fontFamily:fontTitle}}>
              🎨 Upload Your Artwork
            </h1>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,
              margin:'4px 0 0',fontFamily:fontBody}}>
              As <span style={{color:accent}}>
                {user.username||user.email.split('@')[0]}
              </span>
            </p>
          </div>
        </div>

        {/* ── CATEGORY SELECTOR (changes background when switched) ── */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',
            justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:12}}>
            <p style={{fontSize:12,textTransform:'uppercase',letterSpacing:'0.1em',
              color:'rgba(255,255,255,0.4)',fontWeight:600,margin:0,fontFamily:fontBody}}>
              Category *
            </p>
            <button onClick={handleAiDetect} disabled={aiLoading} style={{
              padding:'6px 16px',background:'rgba(124,58,237,0.2)',
              border:'1px solid rgba(124,58,237,0.4)',color:'#a78bfa',
              borderRadius:20,cursor:'pointer',fontSize:12,fontWeight:600,
              fontFamily:fontBody,transition:'all .2s',opacity:aiLoading?0.6:1}}>
              {aiLoading?'⏳ Detecting...':'🤖 AI Auto-Detect'}
            </button>
          </div>
          {aiSuggestion&&(
            <p style={{fontSize:12,color:'#a78bfa',marginBottom:10,fontFamily:fontBody}}>
              🤖 AI: <strong>{aiSuggestion==='CLASSIC_ART'?'🎨 Classic Art':'✏️ Graphic Design'}</strong> — override below if needed.
            </p>
          )}
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            {[
              {key:'CLASSIC_ART',    icon:'🎨',title:'Classic Art',
               desc:'Paintings, sculptures, fine art, historical works'},
              {key:'GRAPHIC_DESIGN', icon:'✏️',title:'Graphic Design',
               desc:'Digital art, logos, posters, illustrations, UI'},
            ].map(({key,icon,title,desc})=>{
              const active=form.artCategory===key;
              const col=key==='CLASSIC_ART'?'#C9952A':'#e879f9';
              return (
                <div key={key} onClick={()=>set('artCategory',key)} style={{
                  flex:1,minWidth:200,padding:'14px 18px',borderRadius:12,
                  cursor:'pointer',
                  background:active?`${col}18`:'rgba(255,255,255,0.04)',
                  border:`2px solid ${active?col:'rgba(255,255,255,0.1)'}`,
                  transition:'all .3s',
                  boxShadow:active?`0 0 20px ${col}33`:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                    <span style={{fontSize:20}}>{icon}</span>
                    <span style={{fontWeight:700,fontSize:14,
                      color:active?col:'#f0e6c8',fontFamily:fontTitle}}>
                      {title}
                    </span>
                    {active&&(
                      <span style={{marginLeft:'auto',fontSize:10,background:col,
                        color:key==='CLASSIC_ART'?'#1a0e00':'#fff',
                        padding:'2px 8px',borderRadius:20,fontWeight:700,
                        fontFamily:fontBody}}>
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <p style={{margin:0,fontSize:11,color:'rgba(255,255,255,0.35)',
                    fontFamily:fontBody}}>{desc}</p>
                </div>
              );
            })}
          </div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.2)',marginTop:8,fontFamily:fontBody}}>
            ⚠️ Products only appear in their chosen category.
          </p>
        </div>

        {/* Steps + preview */}
        <div style={{display:'flex',gap:32,flexWrap:'wrap',alignItems:'flex-start'}}>

          <div style={{flex:1,minWidth:280}}>
            {/* Step indicator */}
            <div style={{display:'flex',alignItems:'center',marginBottom:28}}>
              {['Info','Pricing','Image'].map((title,i)=>{
                const n=i+1,done=step>n,active=step===n;
                return (
                  <div key={n} style={{display:'flex',alignItems:'center',flex:i<2?1:'none'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                      cursor:done?'pointer':'default'}}
                      onClick={()=>done&&setStep(n)}>
                      <div style={{width:32,height:32,borderRadius:'50%',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:12,fontWeight:700,
                        background:done||active?accentGrad:'rgba(255,255,255,0.08)',
                        color:(done||active)?btnColor:'rgba(255,255,255,0.3)',
                        boxShadow:active?`0 0 16px ${accentGlow}`:'none'}}>
                        {done?'✓':n}
                      </div>
                      <span style={{fontSize:10,whiteSpace:'nowrap',
                        color:active?accent:'rgba(255,255,255,0.3)',
                        fontFamily:fontBody}}>{title}</span>
                    </div>
                    {i<2&&<div style={{flex:1,height:2,margin:'0 6px',marginBottom:18,
                      background:done?accent:'rgba(255,255,255,0.08)',
                      transition:'background .3s'}}/>}
                  </div>
                );
              })}
            </div>

            {step===1&&(
              <div style={{display:'flex',flexDirection:'column',gap:16,animation:'fadeIn .3s ease'}}>
                <Field label="Artwork Title *" fontFamily={fontBody}>
                  <input style={inputStyle} placeholder="e.g. The Starry Night"
                    value={form.nom} onChange={e=>set('nom',e.target.value)}
                    onFocus={e=>e.target.style.borderColor=accent}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                </Field>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  <Field label="Artist Name *" fontFamily={fontBody} style={{flex:1,minWidth:160}}>
                    <input style={inputStyle} placeholder="e.g. Van Gogh"
                      value={form.artistName} onChange={e=>set('artistName',e.target.value)}
                      onFocus={e=>e.target.style.borderColor=accent}
                      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                  </Field>
                  <Field label="Year" fontFamily={fontBody} style={{flex:'0 0 100px'}}>
                    <input style={inputStyle} placeholder="2025" type="number"
                      value={form.year} onChange={e=>set('year',e.target.value)}
                      onFocus={e=>e.target.style.borderColor=accent}
                      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                  </Field>
                </div>
                <Field label={formIsClassic?'Art Movement':'Style / Medium'} fontFamily={fontBody}>
                  <input style={inputStyle}
                    placeholder={formIsClassic?'e.g. Post-Impressionism':'e.g. Digital Painting'}
                    value={form.movement} onChange={e=>set('movement',e.target.value)}
                    onFocus={e=>e.target.style.borderColor=accent}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                </Field>
                <Field label="Description" fontFamily={fontBody}>
                  <textarea style={{...inputStyle,resize:'vertical',minHeight:100,lineHeight:1.6}}
                    placeholder="Describe the artwork..."
                    value={form.description} onChange={e=>set('description',e.target.value)}
                    onFocus={e=>e.target.style.borderColor=accent}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                </Field>
                <button disabled={!canNext1} onClick={()=>setStep(2)} style={{
                  ...btnStyle,opacity:canNext1?1:0.4,
                  cursor:canNext1?'pointer':'not-allowed'}}>
                  Continue →
                </button>
              </div>
            )}

            {step===2&&(
              <div style={{display:'flex',flexDirection:'column',gap:16,animation:'fadeIn .3s ease'}}>
                <Field label="Price (TND) *" fontFamily={fontBody}>
                  <input style={inputStyle} placeholder="e.g. 5000" type="number" min="0" step="0.01"
                    value={form.prix} onChange={e=>set('prix',e.target.value)}
                    onFocus={e=>e.target.style.borderColor=accent}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                </Field>
                <Field label="Sale Price (TND)" hint="Leave blank if no discount" fontFamily={fontBody}>
                  <input style={inputStyle} placeholder="Optional" type="number" min="0" step="0.01"
                    value={form.prixPromo} onChange={e=>set('prixPromo',e.target.value)}
                    onFocus={e=>e.target.style.borderColor=accent}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                </Field>
                <Field label="Copies" hint="1 = one-of-a-kind" fontFamily={fontBody}>
                  <input style={{...inputStyle,maxWidth:120}} type="number" min="1"
                    value={form.stock} onChange={e=>set('stock',e.target.value)}
                    onFocus={e=>e.target.style.borderColor=accent}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                </Field>
                <div style={{display:'flex',gap:12}}>
                  <button onClick={()=>setStep(1)} style={{...btnStyle,
                    background:'rgba(255,255,255,0.08)',color:'white',
                    boxShadow:'none',flex:'0 0 auto'}}>← Back</button>
                  <button disabled={!canNext2} onClick={()=>setStep(3)} style={{
                    ...btnStyle,flex:1,opacity:canNext2?1:0.4,
                    cursor:canNext2?'pointer':'not-allowed'}}>Continue →</button>
                </div>
              </div>
            )}

            {step===3&&(
              <div style={{display:'flex',flexDirection:'column',gap:16,animation:'fadeIn .3s ease'}}>
                <Field label="Image URL *" hint="Paste a direct image link" fontFamily={fontBody}>
                  <input style={inputStyle}
                    placeholder="https://i.imgur.com/your-image.jpg"
                    value={form.images}
                    onChange={e=>{set('images',e.target.value);setPreview(e.target.value);}}
                    onFocus={e=>e.target.style.borderColor=accent}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
                </Field>
                <div style={{background:`${accent}11`,border:`1px solid ${accent}33`,
                  borderRadius:10,padding:'12px 16px'}}>
                  <p style={{color:accent,fontSize:12,fontWeight:700,margin:'0 0 6px',fontFamily:fontBody}}>
                    💡 Free hosting
                  </p>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {['imgur.com','imgbb.com','postimg.cc'].map(s=>(
                      <a key={s} href={`https://${s}`} target="_blank" rel="noreferrer"
                        style={{color:'rgba(255,255,255,0.45)',fontSize:11,
                          padding:'3px 8px',background:'rgba(255,255,255,0.06)',
                          borderRadius:6,textDecoration:'none',fontFamily:fontBody}}>
                        {s} ↗
                      </a>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',gap:12}}>
                  <button onClick={()=>setStep(2)} style={{...btnStyle,
                    background:'rgba(255,255,255,0.08)',color:'white',
                    boxShadow:'none',flex:'0 0 auto'}}>← Back</button>
                  <button disabled={!canPublish||loading} onClick={handleSubmit} style={{
                    ...btnStyle,flex:1,
                    opacity:canPublish&&!loading?1:0.4,
                    cursor:canPublish&&!loading?'pointer':'not-allowed'}}>
                    {loading?'⏳ Publishing...':'🚀 Publish'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live preview */}
          <div style={{flex:'0 0 210px',minWidth:190}}>
            <p style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',
              color:'rgba(255,255,255,0.3)',fontWeight:600,margin:'0 0 10px',fontFamily:fontBody}}>
              Preview
            </p>
            <div style={{background:'rgba(255,255,255,0.05)',
              border:`1px solid ${accent}33`,borderRadius:14,overflow:'hidden'}}>
              <div style={{height:150,overflow:'hidden',background:'rgba(255,255,255,0.03)'}}>
                {preview
                  ?<img src={preview} alt="preview" onError={()=>setPreview('')}
                     style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<div style={{height:'100%',display:'flex',flexDirection:'column',
                     alignItems:'center',justifyContent:'center',
                     color:'rgba(255,255,255,0.12)',gap:6}}>
                     <span style={{fontSize:28}}>{formIsClassic?'🖼️':'🎨'}</span>
                   </div>
                }
              </div>
              <div style={{padding:12}}>
                <span style={{fontSize:9,fontWeight:700,background:`${accent}22`,color:accent,
                  padding:'2px 8px',borderRadius:20,textTransform:'uppercase',
                  letterSpacing:'0.08em',display:'inline-block',marginBottom:8,fontFamily:fontBody}}>
                  {formIsClassic?'🎨 Classic':'✏️ Graphic'}
                </span>
                <p style={{margin:'0 0 3px',fontWeight:700,fontSize:13,
                  fontFamily:fontTitle,color:'#f0e6c8'}}>
                  {form.nom||'Title'}
                </p>
                {form.artistName&&(
                  <p style={{margin:'0 0 6px',color:accent,fontSize:11,
                    fontFamily:fontScript,fontStyle:'italic'}}>
                    {form.artistName}{form.year?`, ${form.year}`:''}
                  </p>
                )}
                <div style={{fontSize:14,fontWeight:800,color:accent,fontFamily:fontBody}}>
                  {form.prix?`${parseFloat(form.prix).toLocaleString()} TND`:'— TND'}
                </div>
              </div>
            </div>

            <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:5}}>
              {[['Category',true],['Title',!!form.nom],['Artist',!!form.artistName],
                ['Price',!!form.prix],['Image',!!form.images]].map(([l,done])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:7,fontSize:11}}>
                  <span style={{width:14,height:14,borderRadius:'50%',flexShrink:0,
                    background:done?`${accent}22`:'rgba(255,255,255,0.05)',
                    border:`1px solid ${done?accent:'rgba(255,255,255,0.1)'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:8,color:done?accent:'transparent'}}>✓</span>
                  <span style={{color:done?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.25)',
                    fontFamily:fontBody}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes slideUp {from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
    </div>
  );
}

function Field({label,hint,children,style,fontFamily}){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6,...style}}>
      <label style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',
        color:'rgba(255,255,255,0.45)',fontWeight:600,fontFamily}}>{label}</label>
      {children}
      {hint&&<p style={{fontSize:11,color:'rgba(255,255,255,0.22)',margin:0,fontFamily}}>{hint}</p>}
    </div>
  );
}