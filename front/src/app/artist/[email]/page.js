'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import API from '../../lib/api';
import { useMode } from '../../lib/useMode';
import PageBg from '../../components/PageBg';

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t, isClassic } = useMode();

  const rawEmail    = params?.email ?? '';
  const email       = decodeURIComponent(rawEmail);
  const displayName = email.split('@')[0];

  const [products,   setProducts]   = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');
  const [selfBio,    setSelfBio]    = useState('');
  const [avatarUrl,  setAvatarUrl]  = useState('');
  const [bio,        setBio]        = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioEdit,    setBioEdit]    = useState('');
  const [avatarEdit, setAvatarEdit] = useState('');
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [savingBio,  setSavingBio]  = useState(false);
  const [isOwner,    setIsOwner]    = useState(false);
  const [toast,      setToast]      = useState('');
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!email) return;
    const myEmail = localStorage.getItem('email');
    setIsOwner(myEmail === email);

    API.get('/api/products?page=0&size=200')
      .then(res => {
        const all  = res.data?.content || [];
        const mine = all.filter(p => p.sellerEmail === email);
        setProducts(mine);
        setFiltered(mine);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Try to load user profile
    API.get(`/api/users/profile?email=${encodeURIComponent(email)}`)
      .then(r => {
        if (r.data?.bio)       setSelfBio(r.data.bio);
        if (r.data?.avatarUrl) setAvatarUrl(r.data.avatarUrl);
      })
      .catch(() => {});
  }, [email]);

  useEffect(() => {
    let list = [...products];
    if (filter === 'art')   list = list.filter(p => p.artCategory !== 'BOOK');
    if (filter === 'books') list = list.filter(p => p.artCategory === 'BOOK');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.nom?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [products, filter, search]);

  const handleAIBio = async () => {
    if (!products.length) return;
    setBioLoading(true);
    try {
      const res = await API.post('/api/ai/bio', {
        name: displayName,
        context: products.slice(0, 5).map(w => w.nom).join(', '),
      });
      setBio(res.data?.bio || fallbackBio());
    } catch {
      setBio(fallbackBio());
    }
    setBioLoading(false);
  };

  const fallbackBio = () =>
    `${displayName} is a creative artist whose works — including "${products[0]?.nom || 'various pieces'}" — reflect remarkable skill and artistic vision. Their portfolio showcases a distinctive style that invites viewers into a world of creativity and expression.`;

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await API.put('/api/books/portfolio/bio', {
        bio:       bioEdit,
        avatarUrl: avatarEdit || avatarUrl,
      });
      setSelfBio(bioEdit);
      if (avatarEdit) setAvatarUrl(avatarEdit);
      setEditingBio(false);
      setEditingAvatar(false);
      showToast('✓ Profile updated!');
    } catch { showToast('Failed — are you logged in?'); }
    finally  { setSavingBio(false); }
  };

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const artCount  = products.filter(p => p.artCategory !== 'BOOK').length;
  const bookCount = products.filter(p => p.artCategory === 'BOOK').length;

  if (!mounted) return null;

  return (
    <div style={{ minHeight:'100vh', position:'relative',
      fontFamily:t.fontBody, color:'white', paddingBottom:80 }}>

      {/* Blurred background */}
      <PageBg />

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
          background:'rgba(20,20,30,0.95)', backdropFilter:'blur(12px)',
          color:'white', padding:'13px 20px', borderRadius:12, fontSize:14,
          border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)', animation:'slideUp .3s ease',
          fontFamily:t.fontBody }}>
          {toast}
        </div>
      )}

      {/* ── Hero banner ──────────────────────────────────── */}
      <div style={{
        position:'relative', zIndex:2,
        background:'linear-gradient(180deg,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.3) 100%)',
        backdropFilter:'blur(2px)',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        padding:'48px 32px 40px',
      }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>

          <button onClick={() => router.push('/')} style={{
            background:'transparent', border:`1px solid ${t.accent}55`,
            color:t.accent, padding:'6px 16px', borderRadius:8,
            cursor:'pointer', fontSize:13, marginBottom:28,
            fontFamily:t.fontBody }}>
            ← Home
          </button>

          <div style={{ display:'flex', alignItems:'flex-start',
            gap:28, flexWrap:'wrap' }}>

            {/* ── Avatar ── */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:96, height:96, borderRadius:'50%',
                overflow:'hidden',
                background: avatarUrl ? 'transparent'
                  : `linear-gradient(135deg,${t.accent},${t.accent}88)`,
                boxShadow:`0 0 0 3px ${t.accent}44, 0 0 32px ${t.accentGlow}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:38, fontWeight:900, color: isClassic?'#1a0e00':'white',
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar"
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => e.target.style.display='none'}/>
                  : displayName[0]?.toUpperCase()
                }
              </div>
              {isOwner && (
                <button onClick={() => { setEditingAvatar(v=>!v); setAvatarEdit(avatarUrl); }}
                  title="Change profile picture"
                  style={{
                    position:'absolute', bottom:0, right:0,
                    width:28, height:28, borderRadius:'50%',
                    background:t.accentGrad, border:'2px solid rgba(0,0,0,0.5)',
                    color:isClassic?'#1a0e00':'white',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', fontSize:13,
                  }}>
                  📷
                </button>
              )}
            </div>

            {/* Avatar URL editor */}
            {isOwner && editingAvatar && (
              <div style={{ position:'absolute', top:160, left:32, zIndex:100,
                background:'rgba(10,10,20,0.96)', backdropFilter:'blur(20px)',
                border:`1px solid ${t.cardBorder}`, borderRadius:14,
                padding:20, minWidth:340,
                boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
                <p style={{ margin:'0 0 10px', fontWeight:700, fontSize:14,
                  color:t.textPrimary, fontFamily:t.fontTitle }}>
                  📷 Profile Picture URL
                </p>
                <p style={{ margin:'0 0 10px', color:'rgba(255,255,255,0.4)',
                  fontSize:12, fontFamily:t.fontBody }}>
                  Upload your photo to <a href="https://imgur.com" target="_blank" rel="noreferrer"
                    style={{ color:t.accent }}>imgur.com</a> or{' '}
                  <a href="https://imgbb.com" target="_blank" rel="noreferrer"
                    style={{ color:t.accent }}>imgbb.com</a> and paste the link:
                </p>
                <input value={avatarEdit}
                  onChange={e=>setAvatarEdit(e.target.value)}
                  placeholder="https://i.imgur.com/your-photo.jpg"
                  style={{ width:'100%', padding:'10px 14px', boxSizing:'border-box',
                    background:'rgba(255,255,255,0.07)',
                    border:`1px solid ${t.cardBorder}`,
                    borderRadius:9, color:'white', fontSize:13,
                    outline:'none', fontFamily:t.fontBody }}
                  onFocus={e=>e.target.style.borderColor=t.accent}
                  onBlur={e=>e.target.style.borderColor=t.cardBorder}/>
                {avatarEdit && (
                  <img src={avatarEdit} alt="preview"
                    style={{ width:60, height:60, borderRadius:'50%',
                      objectFit:'cover', marginTop:10, border:`2px solid ${t.accent}` }}
                    onError={e=>e.target.style.display='none'}/>
                )}
                <div style={{ display:'flex', gap:10, marginTop:12 }}>
                  <button onClick={handleSaveBio} disabled={savingBio} style={{
                    flex:1, padding:'9px', background:t.accentGrad,
                    color:isClassic?'#1a0e00':'white', border:'none', borderRadius:8,
                    cursor:'pointer', fontWeight:700, fontSize:13,
                    fontFamily:t.fontBody, opacity:savingBio?0.6:1 }}>
                    {savingBio?'Saving...':'✓ Save'}
                  </button>
                  <button onClick={() => setEditingAvatar(false)} style={{
                    padding:'9px 16px', background:'rgba(255,255,255,0.08)',
                    color:'rgba(255,255,255,0.5)', border:'none',
                    borderRadius:8, cursor:'pointer', fontSize:13,
                    fontFamily:t.fontBody }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Name + stats ── */}
            <div style={{ flex:1 }}>
              <h1 style={{ fontSize:26, fontWeight:900, color:t.textPrimary,
                margin:'0 0 4px', fontFamily:t.fontGalleryTitle }}>
                {displayName}
              </h1>
              <p style={{ color:'rgba(255,255,255,0.3)', margin:'0 0 16px', fontSize:12,
                fontFamily:t.fontBody }}>
                {email}
              </p>

              {/* Stats */}
              <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginBottom:16 }}>
                {[
                  [products.length, 'Works'],
                  [artCount,        'Artworks'],
                  [bookCount,       'Books'],
                ].map(([v, l]) => (
                  <div key={l} style={{ textAlign:'center' }}>
                    <p style={{ margin:0, fontSize:22, fontWeight:900, color:t.accent,
                      fontFamily:t.fontBody,
                      textShadow:`0 0 20px ${t.accentGlow}` }}>{v}</p>
                    <p style={{ margin:0, fontSize:10, color:'rgba(255,255,255,0.35)',
                      fontFamily:t.fontBody }}>{l}</p>
                  </div>
                ))}
              </div>

              {/* Self bio display */}
              {selfBio && !editingBio && (
                <p style={{ color:'rgba(255,255,255,0.72)', fontSize:14,
                  lineHeight:1.75, maxWidth:600, margin:'0 0 12px',
                  fontFamily:t.fontBody }}>{selfBio}</p>
              )}

              {/* AI bio */}
              {bio && (
                <div style={{ background:`${t.accent}0e`,
                  border:`1px solid ${t.accent}22`,
                  borderRadius:10, padding:'12px 16px', maxWidth:580, marginBottom:12 }}>
                  <p style={{ margin:'0 0 4px', color:t.accent, fontSize:10,
                    fontWeight:700, fontFamily:t.fontBody }}>✨ AI BIO</p>
                  <p style={{ margin:0, color:'rgba(255,255,255,0.72)',
                    fontSize:13, lineHeight:1.75, fontFamily:t.fontBody }}>{bio}</p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {!bio && products.length > 0 && (
                  <button onClick={handleAIBio} disabled={bioLoading} style={{
                    padding:'6px 16px', background:'rgba(124,58,237,0.2)',
                    border:'1px solid rgba(124,58,237,0.4)', color:'#a78bfa',
                    borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600,
                    opacity:bioLoading?0.6:1, fontFamily:t.fontBody,
                    transition:'all .2s' }}>
                    {bioLoading ? '⏳ Generating...' : '🤖 AI Generate Bio'}
                  </button>
                )}
                {isOwner && !editingBio && (
                  <button onClick={() => { setEditingBio(true); setBioEdit(selfBio); }} style={{
                    padding:'6px 16px', background:`${t.accent}18`,
                    border:`1px solid ${t.accent}44`, color:t.accent,
                    borderRadius:20, cursor:'pointer', fontSize:12,
                    fontWeight:600, fontFamily:t.fontBody }}>
                    ✏️ Edit Description
                  </button>
                )}
              </div>

              {/* Bio editor */}
              {isOwner && editingBio && (
                <div style={{ marginTop:14, maxWidth:560 }}>
                  <textarea value={bioEdit}
                    onChange={e => setBioEdit(e.target.value)} rows={4}
                    placeholder="Introduce yourself to buyers..."
                    style={{ width:'100%', padding:'12px 14px', boxSizing:'border-box',
                      background:'rgba(255,255,255,0.07)',
                      border:`1px solid ${t.cardBorder}`,
                      borderRadius:10, color:'white', fontSize:13,
                      resize:'vertical', outline:'none', fontFamily:t.fontBody }}
                    onFocus={e=>e.target.style.borderColor=t.accent}
                    onBlur={e=>e.target.style.borderColor=t.cardBorder}/>
                  <div style={{ display:'flex', gap:10, marginTop:10 }}>
                    <button onClick={handleSaveBio} disabled={savingBio} style={{
                      padding:'9px 22px', background:t.accentGrad,
                      color:isClassic?'#1a0e00':'white', border:'none',
                      borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13,
                      fontFamily:t.fontBody, opacity:savingBio?0.6:1 }}>
                      {savingBio ? 'Saving...' : '✓ Save'}
                    </button>
                    <button onClick={() => setEditingBio(false)} style={{
                      padding:'9px 18px', background:'rgba(255,255,255,0.08)',
                      color:'rgba(255,255,255,0.5)', border:'none',
                      borderRadius:8, cursor:'pointer', fontSize:13,
                      fontFamily:t.fontBody }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Portfolio grid ────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:2,
        maxWidth:960, margin:'28px auto', padding:'0 24px' }}>

        {/* Filter + search */}
        <div style={{ display:'flex', gap:10, marginBottom:24,
          flexWrap:'wrap', alignItems:'center' }}>
          {[['all','All'],['art','🎨 Art'],['books','📚 Books']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding:'7px 18px', borderRadius:30, border:'none',
              cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .2s',
              background: filter===k ? t.accentGrad : 'rgba(255,255,255,0.08)',
              color: filter===k ? (isClassic?'#1a0e00':'white') : 'rgba(255,255,255,0.45)',
              boxShadow: filter===k ? `0 4px 12px ${t.accentGlow}` : 'none',
              fontFamily:t.fontBody }}>
              {l}
            </button>
          ))}
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search works..."
            style={{ flex:1, minWidth:160, padding:'9px 14px',
              background:'rgba(255,255,255,0.07)',
              border:`1px solid ${t.cardBorder}`,
              borderRadius:10, color:'white', fontSize:13,
              outline:'none', fontFamily:t.fontBody }}
            onFocus={e=>e.target.style.borderColor=t.accent}
            onBlur={e=>e.target.style.borderColor=t.cardBorder}/>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:0,
            fontFamily:t.fontBody }}>
            {filtered.length} work{filtered.length!==1?'s':''}
          </p>
        </div>

        {loading ? (
          <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{ width:200, height:250, borderRadius:14,
                background:'rgba(255,255,255,0.05)', animation:'pulse 1.5s infinite' }}/>
            ))}
          </div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 0',
            color:'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>{t.emptyIcon}</div>
            <p style={{ fontFamily:t.fontBody }}>
              {search ? 'No works match.' : 'Nothing uploaded yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:20 }}>
            {filtered.map(p => {
              const isBook   = p.artCategory === 'BOOK';
              const isFree   = !p.prix || parseFloat(p.prix) === 0;
              const hasPromo = p.prixPromo && p.prixPromo < p.prix;
              return (
                <div key={p.id}
                  onClick={() => router.push(isBook?`/books/${p.id}`:`/products/${p.id}`)}
                  style={{ width:200, cursor:'pointer',
                    background:t.cardBg,
                    border:`1px solid ${t.cardBorder}`,
                    borderRadius:t.cardRadius, overflow:'hidden',
                    transition:'all .3s' }}
                  onMouseOver={e=>{
                    e.currentTarget.style.transform='translateY(-8px)';
                    e.currentTarget.style.borderColor=t.cardBorderHover;
                    e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.5)';
                  }}
                  onMouseOut={e=>{
                    e.currentTarget.style.transform='';
                    e.currentTarget.style.borderColor=t.cardBorder;
                    e.currentTarget.style.boxShadow='';
                  }}>
                  <div style={{ height:isBook?180:130, overflow:'hidden',
                    background:isBook?'linear-gradient(135deg,#1e3a5f,#1d4ed8)'
                      :'rgba(255,255,255,0.03)', position:'relative' }}>
                    {p.images ? (
                      <img src={p.images.split(',')[0]?.trim()} alt={p.nom}
                        style={{ width:'100%', height:'100%', objectFit:'cover',
                          transition:'transform .4s' }}
                        onMouseOver={e=>e.target.style.transform='scale(1.08)'}
                        onMouseOut={e=>e.target.style.transform='scale(1)'}/>
                    ) : (
                      <div style={{ height:'100%', display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:36 }}>
                        {isBook?'📖':t.emptyIcon}
                      </div>
                    )}
                    {isFree && (
                      <div style={{ position:'absolute', top:8, left:8,
                        background:'rgba(99,102,241,0.85)',
                        color:'white', fontSize:9, fontWeight:700,
                        padding:'3px 8px', borderRadius:10,
                        fontFamily:t.fontBody }}>
                        🏛️ DISPLAY
                      </div>
                    )}
                  </div>
                  <div style={{ padding:12 }}>
                    <span style={{ fontSize:9, fontWeight:700,
                      background:`${t.accent}20`, color:t.accent,
                      padding:'2px 8px', borderRadius:20,
                      textTransform:'uppercase', display:'inline-block',
                      marginBottom:6, fontFamily:t.fontBody }}>
                      {isBook?'📚 Book':'🎨 Art'}
                    </span>
                    <p style={{ margin:'0 0 4px', fontWeight:700, color:t.textPrimary,
                      fontSize:13, whiteSpace:'nowrap', overflow:'hidden',
                      textOverflow:'ellipsis', fontFamily:t.fontTitle }}>
                      {p.nom}
                    </p>
                    <div style={{ fontSize:13, fontWeight:800,
                      color: isFree ? '#818cf8' : t.accent,
                      fontFamily:t.fontBody }}>
                      {isFree ? '🏛️ Display only' : `${(hasPromo?p.prixPromo:p.prix)?.toLocaleString()} TND`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pulse   {0%,100%{opacity:.3}50%{opacity:.6}}
      `}</style>
    </div>
  );
}