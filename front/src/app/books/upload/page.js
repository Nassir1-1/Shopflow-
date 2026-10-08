'use client';
import { useState, useEffect } from 'react';
import { createProduct } from '../../lib/api';
import { useRouter } from 'next/navigation';
import PageBg from '../../components/PageBg';

const BOOK_BG = [
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&auto=format&fit=crop',
];

const ALL_TAGS = [
  'Fiction','Non-Fiction','Science','History','Philosophy',
  'Art & Design','Children','Biography','Self-Help',
  'Technology','Religion','Poetry','Arabic Literature',
  'French Literature','Classic','Comics','Travel',
];

export default function BookUploadPage() {
  const router = useRouter();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState({ msg:'', type:'' });
  const [step,    setStep]    = useState(1);
  const [form, setForm] = useState({
    nom:'', author:'', year:'', pages:'', language:'', description:'',
    prix:'', prixPromo:'', stock:'1',
    coverUrl:'',
    // ── Single URL field — PDF, website, or any external link ──
    externalUrl:'',
    selectedTags:[],
  });

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) { router.push('/login'); return; }
    setUser({ email, username: localStorage.getItem('username') });
  }, []);

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (tag)  => set('selectedTags',
    form.selectedTags.includes(tag)
      ? form.selectedTags.filter(t => t !== tag)
      : [...form.selectedTags, tag]
  );

  const handleSubmit = async () => {
    if (!form.nom.trim() || !form.author.trim()) {
      showToast('Title and author are required.', 'error'); return;
    }
    if (!form.prix) {
      showToast('Please enter a price.', 'error'); return;
    }
    if (!form.externalUrl.trim() && !form.coverUrl.trim()) {
      showToast('Provide at least a PDF/website URL or a cover image.', 'error'); return;
    }

    setLoading(true);
    try {
      const desc = [
        form.description,
        `Author: ${form.author}`,
        form.year     ? `Year: ${form.year}`        : '',
        form.pages    ? `Pages: ${form.pages}`       : '',
        form.language ? `Language: ${form.language}` : '',
      ].filter(Boolean).join('\n');

      await createProduct({
        nom:         form.nom,
        description: desc,
        prix:        parseFloat(form.prix),
        prixPromo:   form.prixPromo ? parseFloat(form.prixPromo) : null,
        stock:       parseInt(form.stock) || 1,
        images:      form.coverUrl  || null,   // nullable — no crash
        pdfUrl:      form.externalUrl || null, // nullable
        authorName:  form.author     || null,
        bookYear:    form.year   ? parseInt(form.year)  : null,
        pageCount:   form.pages  ? parseInt(form.pages) : null,
        bookTags:    form.selectedTags.length ? form.selectedTags : null,
        artCategory: 'BOOK',
      });

      showToast('📚 Book listed successfully!', 'success');
      setTimeout(() => router.push('/books'), 1800);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed — check you are logged in.', 'error');
    } finally { setLoading(false); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'' }), 3500);
  };

  const canNext1 = form.nom.trim() && form.author.trim();
  const canNext2 = form.prix && parseFloat(form.prix) >= 0 && form.selectedTags.length > 0;
  const canPublish = (form.externalUrl.trim() || form.coverUrl.trim());

  const inp = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '11px 14px',
    color: 'white', fontSize: 14, outline: 'none',
    width: '100%', boxSizing: 'border-box',
    fontFamily: "'Segoe UI',sans-serif", transition: 'border-color .2s',
  };
  const focus = e => e.target.style.borderColor = '#3b82f6';
  const blur  = e => e.target.style.borderColor = 'rgba(255,255,255,0.12)';
  const btn   = {
    padding: '14px', background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    color: 'white', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(59,130,246,0.35)', transition: 'all .3s',
  };

  if (!user) return null;

  return (
    <div style={{ minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif",
      position:'relative', paddingBottom:60, color:'white' }}>

      <PageBg forceImages={BOOK_BG} />

      {toast.msg && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
          padding:'14px 22px', borderRadius:12, fontSize:14, fontWeight:600,
          animation:'slideUp .3s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          background: toast.type==='success' ? '#064e3b' : '#450a0a',
          color:       toast.type==='success' ? '#34d399' : '#f87171',
          border: `1px solid ${toast.type==='success' ? '#065f46' : '#7f1d1d'}` }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px',
        position:'relative', zIndex:2 }}>

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', gap:14,
          marginBottom:32, flexWrap:'wrap' }}>
          <button onClick={() => router.push('/books')} style={{
            background:'transparent', border:'1px solid rgba(59,130,246,0.4)',
            color:'#3b82f6', padding:'7px 16px', borderRadius:8,
            cursor:'pointer', fontSize:13 }}>← Library</button>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, margin:0, color:'#f0f9ff' }}>
              📤 List Your Book
            </h1>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, margin:'4px 0 0' }}>
              As <span style={{ color:'#3b82f6' }}>
                {user.username || user.email.split('@')[0]}
              </span>
              <span style={{ color:'rgba(255,255,255,0.2)', marginLeft:8 }}>
                · 10% platform fee on sales
              </span>
            </p>
          </div>
        </div>

        {/* Step pills */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:32 }}>
          {['Book Info', 'Tags & Price', 'URL & Cover'].map((title, i) => {
            const n = i+1, done = step>n, active = step===n;
            return (
              <div key={n} style={{ display:'flex', alignItems:'center', flex:i<2?1:'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  gap:4, cursor:done?'pointer':'default' }}
                  onClick={() => done && setStep(n)}>
                  <div style={{ width:34, height:34, borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:700,
                    background: done||active
                      ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)'
                      : 'rgba(255,255,255,0.08)',
                    color: done||active ? 'white' : 'rgba(255,255,255,0.3)',
                    boxShadow: active ? '0 0 16px rgba(59,130,246,0.5)' : 'none' }}>
                    {done ? '✓' : n}
                  </div>
                  <span style={{ fontSize:10, whiteSpace:'nowrap',
                    color: active ? '#3b82f6' : 'rgba(255,255,255,0.3)' }}>
                    {title}
                  </span>
                </div>
                {i<2 && <div style={{ flex:1, height:2, margin:'0 6px', marginBottom:18,
                  background: done ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                  transition:'background .3s' }}/>}
              </div>
            );
          })}
        </div>

        <div style={{ display:'flex', gap:32, flexWrap:'wrap', alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:300 }}>

            {/* STEP 1 — Book Info */}
            {step===1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:16,
                animation:'fadeIn .3s ease' }}>
                <F label="Title *">
                  <input style={inp} placeholder="e.g. L'Alchimiste"
                    value={form.nom} onChange={e=>set('nom',e.target.value)}
                    onFocus={focus} onBlur={blur}/>
                </F>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <F label="Author *" style={{ flex:1, minWidth:160 }}>
                    <input style={inp} placeholder="e.g. Paulo Coelho"
                      value={form.author} onChange={e=>set('author',e.target.value)}
                      onFocus={focus} onBlur={blur}/>
                  </F>
                  <F label="Year" style={{ flex:'0 0 100px' }}>
                    <input style={inp} placeholder="1988" type="number"
                      value={form.year} onChange={e=>set('year',e.target.value)}
                      onFocus={focus} onBlur={blur}/>
                  </F>
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <F label="Pages" style={{ flex:1 }}>
                    <input style={inp} placeholder="208" type="number"
                      value={form.pages} onChange={e=>set('pages',e.target.value)}
                      onFocus={focus} onBlur={blur}/>
                  </F>
                  <F label="Language" style={{ flex:1 }}>
                    <input style={inp} placeholder="Arabic / French / English"
                      value={form.language} onChange={e=>set('language',e.target.value)}
                      onFocus={focus} onBlur={blur}/>
                  </F>
                </div>
                <F label="Description / Synopsis">
                  <textarea style={{ ...inp, resize:'vertical', minHeight:90, lineHeight:1.6 }}
                    placeholder="What is this book about?"
                    value={form.description} onChange={e=>set('description',e.target.value)}
                    onFocus={focus} onBlur={blur}/>
                </F>
                <button disabled={!canNext1} onClick={() => setStep(2)} style={{
                  ...btn, opacity:canNext1?1:0.4,
                  cursor:canNext1?'pointer':'not-allowed' }}>
                  Continue →
                </button>
              </div>
            )}

            {/* STEP 2 — Tags & Price */}
            {step===2 && (
              <div style={{ display:'flex', flexDirection:'column', gap:20,
                animation:'fadeIn .3s ease' }}>

                <div>
                  <label style={lbl}>
                    Categories / Tags *
                    <span style={{ color:'rgba(255,255,255,0.3)', marginLeft:8, fontWeight:400 }}>
                      (pick all that apply)
                    </span>
                  </label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                    {ALL_TAGS.map(tag => {
                      const on = form.selectedTags.includes(tag);
                      return (
                        <button key={tag} onClick={() => toggle(tag)} style={{
                          padding:'6px 14px', borderRadius:20, border:'none',
                          cursor:'pointer', fontSize:13, fontWeight:600,
                          transition:'all .2s',
                          background: on
                            ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)'
                            : 'rgba(255,255,255,0.08)',
                          color: on ? 'white' : 'rgba(255,255,255,0.5)',
                          boxShadow: on ? '0 4px 12px rgba(59,130,246,0.4)' : 'none',
                        }}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  {form.selectedTags.length > 0 && (
                    <p style={{ fontSize:12, color:'#3b82f6', marginTop:8 }}>
                      ✓ {form.selectedTags.join(' · ')}
                    </p>
                  )}
                </div>

                <F label="Price (TND) *">
                  <input style={inp} placeholder="35" type="number" min="0" step="0.1"
                    value={form.prix} onChange={e=>set('prix',e.target.value)}
                    onFocus={focus} onBlur={blur}/>
                  {form.prix && (
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:'6px 0 0' }}>
                      Your earnings after 10% fee:{' '}
                      <strong style={{ color:'#34d399' }}>
                        {(parseFloat(form.prix)*0.9).toFixed(2)} TND
                      </strong>
                    </p>
                  )}
                </F>

                <F label="Sale Price (optional)">
                  <input style={inp} placeholder="Leave blank if no discount"
                    type="number" min="0" step="0.1"
                    value={form.prixPromo} onChange={e=>set('prixPromo',e.target.value)}
                    onFocus={focus} onBlur={blur}/>
                </F>

                <F label="Copies">
                  <input style={{ ...inp, maxWidth:120 }} type="number" min="1"
                    value={form.stock} onChange={e=>set('stock',e.target.value)}
                    onFocus={focus} onBlur={blur}/>
                </F>

                <div style={{ display:'flex', gap:12 }}>
                  <button onClick={() => setStep(1)} style={{
                    ...btn, background:'rgba(255,255,255,0.08)',
                    boxShadow:'none', flex:'0 0 auto' }}>← Back</button>
                  <button disabled={!canNext2} onClick={() => setStep(3)} style={{
                    ...btn, flex:1, opacity:canNext2?1:0.4,
                    cursor:canNext2?'pointer':'not-allowed' }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Single URL + Cover */}
            {step===3 && (
              <div style={{ display:'flex', flexDirection:'column', gap:16,
                animation:'fadeIn .3s ease' }}>

                {/* ── SINGLE EXTERNAL URL FIELD ── */}
                <div style={{ background:'rgba(59,130,246,0.07)',
                  border:'1px solid rgba(59,130,246,0.25)',
                  borderRadius:12, padding:'18px 20px' }}>
                  <label style={{ ...lbl, color:'#93c5fd', marginBottom:10 }}>
                    📎 PDF / Website URL *
                  </label>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)',
                    margin:'0 0 12px', lineHeight:1.6 }}>
                    Paste a single link — can be a Google Drive PDF, a personal website,
                    a Notion page, or any publicly accessible URL.
                    When a reader clicks "Read", this link opens in a new tab.
                  </p>
                  <input style={{ ...inp, border:'1px solid rgba(59,130,246,0.3)',
                    fontSize:15 }}
                    placeholder="https://drive.google.com/file/d/... or https://yoursite.com/book"
                    value={form.externalUrl}
                    onChange={e=>set('externalUrl',e.target.value)}
                    onFocus={e=>e.target.style.borderColor='#3b82f6'}
                    onBlur={e=>e.target.style.borderColor='rgba(59,130,246,0.3)'}/>
                </div>

                <F label="Cover Image URL (optional)"
                  hint="Direct link to a cover image (JPG/WebP). Use imgur.com or imgbb.com.">
                  <input style={inp}
                    placeholder="https://i.imgur.com/cover.jpg"
                    value={form.coverUrl} onChange={e=>set('coverUrl',e.target.value)}
                    onFocus={focus} onBlur={blur}/>
                </F>

                {!canPublish && (
                  <p style={{ color:'#f87171', fontSize:12, margin:0 }}>
                    ⚠️ At least one URL is required (PDF link or cover image).
                  </p>
                )}

                <div style={{ display:'flex', gap:12 }}>
                  <button onClick={() => setStep(2)} style={{
                    ...btn, background:'rgba(255,255,255,0.08)',
                    boxShadow:'none', flex:'0 0 auto' }}>← Back</button>
                  <button disabled={!canPublish || loading} onClick={handleSubmit} style={{
                    ...btn, flex:1,
                    opacity:canPublish&&!loading?1:0.4,
                    cursor:canPublish&&!loading?'pointer':'not-allowed' }}>
                    {loading ? '⏳ Publishing...' : '📚 List Book'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Preview sidebar ── */}
          <div style={{ flex:'0 0 200px', minWidth:180 }}>
            <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em',
              color:'rgba(255,255,255,0.3)', fontWeight:600, margin:'0 0 10px' }}>
              Preview
            </p>
            <div style={{ background:'rgba(59,130,246,0.05)',
              border:'1px solid rgba(59,130,246,0.15)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ height:180, background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
                overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {form.coverUrl ? (
                  <img src={form.coverUrl} alt="cover"
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => e.target.style.display='none'}/>
                ) : (
                  <div style={{ textAlign:'center' }}>
                    <span style={{ fontSize:36 }}>📖</span>
                    <p style={{ color:'rgba(255,255,255,0.25)', fontSize:10, margin:'6px 0 0' }}>
                      No cover yet
                    </p>
                  </div>
                )}
              </div>
              <div style={{ padding:12 }}>
                <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:13, color:'#f0f9ff',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {form.nom || 'Book Title'}
                </p>
                {form.author && (
                  <p style={{ margin:'0 0 6px', color:'#93c5fd',
                    fontSize:11, fontStyle:'italic' }}>
                    {form.author}{form.year ? `, ${form.year}` : ''}
                  </p>
                )}
                {form.selectedTags.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                    {form.selectedTags.slice(0,3).map(t=>(
                      <span key={t} style={{ fontSize:9,
                        background:'rgba(59,130,246,0.2)', color:'#93c5fd',
                        padding:'2px 6px', borderRadius:10 }}>{t}</span>
                    ))}
                  </div>
                )}
                {form.externalUrl && (
                  <p style={{ fontSize:10, color:'#34d399', margin:'0 0 6px' }}>
                    ✓ External URL set
                  </p>
                )}
                <div style={{ fontSize:14, fontWeight:800, color:'#3b82f6' }}>
                  {form.prix ? `${parseFloat(form.prix).toLocaleString()} TND` : '— TND'}
                </div>
              </div>
            </div>

            {form.prix && (
              <div style={{ marginTop:10, background:'rgba(52,211,153,0.06)',
                border:'1px solid rgba(52,211,153,0.2)',
                borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#34d399', margin:'0 0 6px' }}>
                  💰 Earnings
                </p>
                {[
                  ['List', `${parseFloat(form.prix||0).toFixed(2)} TND`, ''],
                  ['Fee 10%', `-${(parseFloat(form.prix||0)*0.1).toFixed(2)} TND`, '#f87171'],
                  ['Yours', `${(parseFloat(form.prix||0)*0.9).toFixed(2)} TND`, '#34d399'],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between',
                    fontSize:11, color:c||'rgba(255,255,255,0.45)',
                    fontWeight:c==='#34d399'?700:400,
                    borderTop:c==='#34d399'?'1px solid rgba(255,255,255,0.07)':'none',
                    paddingTop:c==='#34d399'?4:0, marginTop:c==='#34d399'?4:0 }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Required checklist */}
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
              {[
                ['Title',    !!form.nom],
                ['Author',   !!form.author],
                ['Tag(s)',   form.selectedTags.length>0],
                ['Price',    !!form.prix],
                ['URL/Cover',!!(form.externalUrl||form.coverUrl)],
              ].map(([l,done])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:7, fontSize:11 }}>
                  <span style={{ width:14, height:14, borderRadius:'50%', flexShrink:0,
                    background:done?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.05)',
                    border:`1px solid ${done?'#3b82f6':'rgba(255,255,255,0.1)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:8, color:done?'#3b82f6':'transparent' }}>✓</span>
                  <span style={{ color:done
                    ?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.25)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  );
}

const lbl = {
  display:'block', fontSize:11, textTransform:'uppercase',
  letterSpacing:'0.08em', color:'rgba(255,255,255,0.45)',
  fontWeight:600, marginBottom:6,
};

function F({ label, hint, children, style }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      <label style={lbl}>{label}</label>
      {children}
      {hint && <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', margin:0 }}>{hint}</p>}
    </div>
  );
}