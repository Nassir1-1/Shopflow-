'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, addToCart } from '../../lib/api';
import API from '../../lib/api';

async function genAIBio(name, ctx) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514', max_tokens:220,
        messages:[{role:'user',content:
          `Write a professional 3-sentence biography for the author "${name}".
Context: ${ctx || 'No extra context.'}
Do not invent awards. Be concise and engaging.`}],
      }),
    });
    const d = await r.json();
    return d.content?.[0]?.text || null;
  } catch { return null; }
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [book,       setBook]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('details');
  const [adding,     setAdding]     = useState(false);
  const [toast,      setToast]      = useState('');
  const [bio,        setBio]        = useState('');
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    getProduct(params.id)
      .then(r => setBook(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handleRead = () => {
    if (!book?.pdfUrl) {
      showToast('No external URL available for this book.'); return;
    }
    window.open(book.pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAdd = async () => {
    setAdding(true);
    try { await addToCart(book.id, 1); showToast('📚 Added to cart!'); }
    catch { showToast('⚠️ Please login first'); }
    finally { setAdding(false); }
  };

  const handleAIBio = async () => {
    const name = book?.authorName || book?.description?.match(/Author:\s*(.+)/)?.[1]?.trim();
    if (!name) { showToast('No author name found.'); return; }
    setBioLoading(true);
    setBio(await genAIBio(name, book?.description) || 'Could not generate bio.');
    setBioLoading(false);
  };

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0a14',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:48, height:48, border:'4px solid rgba(59,130,246,0.2)',
        borderTopColor:'#3b82f6', borderRadius:'50%',
        animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!book) return (
    <div style={{ minHeight:'100vh', background:'#0a0a14', color:'white',
      display:'flex', flexDirection:'column', gap:16,
      alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontSize:64 }}>📚</span>
      <p>Book not found</p>
      <button onClick={() => router.push('/books')} style={{
        background:'transparent', border:'1px solid #3b82f6', color:'#3b82f6',
        padding:'8px 20px', borderRadius:8, cursor:'pointer' }}>← Library</button>
    </div>
  );

  const hasPromo  = book.prixPromo && book.prixPromo < book.prix;
  const price     = hasPromo ? book.prixPromo : book.prix;
  const tags      = book.bookTags || [];
  const cleanDesc = book.description
    ?.replace(/Author:.*\n?/g,'').replace(/Year:.*\n?/g,'')
    .replace(/Pages:.*\n?/g,'').replace(/Language:.*\n?/g,'').trim();

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a14',
      fontFamily:"'Segoe UI',sans-serif", color:'white', paddingBottom:60 }}>

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
          background:'rgba(20,20,30,0.95)', color:'white', padding:'14px 20px',
          borderRadius:12, fontSize:14, border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)', animation:'slideUp .3s ease' }}>
          {toast}
        </div>
      )}

      {/* Nav bar */}
      <div style={{ background:'rgba(255,255,255,0.03)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        padding:'13px 24px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => router.push('/books')} style={{
          background:'transparent', border:'1px solid rgba(59,130,246,0.4)',
          color:'#3b82f6', padding:'6px 14px', borderRadius:8,
          cursor:'pointer', fontSize:13 }}>← Library</button>
        <div style={{ flex:1 }}/>
        {/* Tab switcher */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.06)',
          borderRadius:10, padding:3, gap:2 }}>
          {[['details','📋 Details'],['read','📖 Read']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, transition:'all .2s',
              background: tab===k ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'transparent',
              color: tab===k ? 'white' : 'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 24px' }}>

        {/* ── DETAILS ── */}
        {tab==='details' && (
          <div style={{ display:'flex', gap:48, flexWrap:'wrap', alignItems:'flex-start' }}>

            {/* Cover */}
            <div style={{ flex:'0 0 240px', maxWidth:240 }}>
              <div style={{ borderRadius:10, overflow:'hidden',
                boxShadow:'0 20px 60px rgba(0,0,0,0.6), -3px 0 0 #6b5310',
                background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', aspectRatio:'2/3',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {book.images ? (
                  <img src={book.images.split(',')[0]?.trim()} alt={book.nom}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                ) : (
                  <div style={{ textAlign:'center', padding:20 }}>
                    <span style={{ fontSize:56 }}>📖</span>
                    <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:700,
                      marginTop:10 }}>{book.nom}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:14 }}>
                  {tags.map(t=>(
                    <span key={t} style={{ fontSize:11,
                      background:'rgba(59,130,246,0.15)', color:'#93c5fd',
                      padding:'3px 10px', borderRadius:20,
                      border:'1px solid rgba(59,130,246,0.2)' }}>{t}</span>
                  ))}
                </div>
              )}

              {/* Price + buy */}
              <div style={{ marginTop:20 }}>
                {hasPromo && (
                  <p style={{ color:'rgba(255,255,255,0.3)',
                    textDecoration:'line-through', fontSize:16, margin:'0 0 4px' }}>
                    {book.prix?.toLocaleString()} TND
                  </p>
                )}
                <p style={{ fontSize:30, fontWeight:800, color:'#3b82f6',
                  margin:'0 0 16px', textShadow:'0 0 20px rgba(59,130,246,0.4)' }}>
                  {price?.toLocaleString()} TND
                  {hasPromo && (
                    <span style={{ fontSize:11, background:'rgba(52,211,153,0.1)',
                      color:'#34d399', padding:'2px 8px', borderRadius:20, marginLeft:8 }}>
                      -{Math.round((1-book.prixPromo/book.prix)*100)}%
                    </span>
                  )}
                </p>

                <button onClick={handleAdd} disabled={adding} style={{
                  width:'100%', padding:'13px',
                  background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                  color:'white', border:'none', borderRadius:12,
                  fontSize:14, fontWeight:700, cursor:'pointer',
                  boxShadow:'0 8px 24px rgba(59,130,246,0.4)',
                  opacity:adding?0.7:1 }}>
                  {adding?'Adding...':'🛒 Add to Cart'}
                </button>

                {/* ── READ button — opens external URL ── */}
                <button onClick={handleRead}
                  disabled={!book.pdfUrl}
                  style={{
                    width:'100%', padding:'11px', marginTop:10,
                    background: book.pdfUrl
                      ? 'rgba(59,130,246,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${book.pdfUrl
                      ?'rgba(59,130,246,0.35)':'rgba(255,255,255,0.08)'}`,
                    color: book.pdfUrl ? '#3b82f6' : 'rgba(255,255,255,0.25)',
                    borderRadius:12, fontSize:14, fontWeight:600,
                    cursor:book.pdfUrl?'pointer':'not-allowed' }}>
                  {book.pdfUrl ? '📖 Read / Open Link ↗' : '📖 No link available'}
                </button>

                <p style={{ textAlign:'center', color:'rgba(255,255,255,0.18)',
                  fontSize:10, marginTop:8 }}>
                  Opens in a new tab · 10% platform fee on sales
                </p>
              </div>
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:280 }}>
              <h1 style={{ fontSize:26, fontWeight:800, color:'#f0f9ff',
                margin:'0 0 6px', lineHeight:1.2 }}>{book.nom}</h1>
              {book.authorName && (
                <p style={{ color:'#93c5fd', fontSize:16,
                  fontStyle:'italic', margin:'0 0 20px' }}>
                  by {book.authorName}
                </p>
              )}

              {/* Metadata */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:14, padding:18, marginBottom:20,
                background:'rgba(59,130,246,0.06)',
                border:'1px solid rgba(59,130,246,0.15)', borderRadius:12 }}>
                {[
                  ['Author', book.authorName || '—'],
                  ['Year',   book.bookYear   || '—'],
                  ['Pages',  book.pageCount  || '—'],
                  ['Language', book.description?.match(/Language:\s*(.+)/)?.[1]?.trim() || '—'],
                ].map(([l,v]) => (
                  <div key={l}>
                    <p style={{ margin:0, fontSize:10, textTransform:'uppercase',
                      letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', fontWeight:600 }}>{l}</p>
                    <p style={{ margin:'3px 0 0', fontSize:14,
                      color:'#e2e8f0', fontWeight:500 }}>{v}</p>
                  </div>
                ))}
              </div>

              <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'0 0 20px' }}/>

              <h3 style={{ color:'#3b82f6', fontSize:12, textTransform:'uppercase',
                letterSpacing:'0.1em', margin:'0 0 10px', fontWeight:600 }}>
                About this Book
              </h3>
              <p style={{ color:'rgba(255,255,255,0.7)',
                fontSize:14, lineHeight:1.8, margin:0 }}>
                {cleanDesc || 'No description available.'}
              </p>

              <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'20px 0' }}/>

              {/* Author bio */}
              <div style={{ background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:12, padding:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:10 }}>
                  <h3 style={{ margin:0, color:'#f0f9ff', fontSize:14, fontWeight:700 }}>
                    👤 About the Author
                  </h3>
                  {!bio && (
                    <button onClick={handleAIBio} disabled={bioLoading} style={{
                      padding:'5px 12px', background:'rgba(124,58,237,0.15)',
                      border:'1px solid rgba(124,58,237,0.35)', color:'#a78bfa',
                      borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:600,
                      opacity:bioLoading?0.6:1 }}>
                      {bioLoading?'⏳...':'🤖 AI Bio'}
                    </button>
                  )}
                </div>
                <p style={{ margin:0, color:'rgba(255,255,255,0.6)',
                  fontSize:13, lineHeight:1.7,
                  fontStyle: bio ? 'normal' : 'italic' }}>
                  {bio || (book.authorName
                    ? `${book.authorName} — click "AI Bio" to generate.`
                    : 'No author information.')}
                </p>
                {book.sellerEmail && (
                  <div onClick={() => router.push(
                      `/artist/${encodeURIComponent(book.sellerEmail)}`)}
                    style={{ marginTop:12, padding:'9px 13px',
                      background:'rgba(59,130,246,0.08)',
                      border:'1px solid rgba(59,130,246,0.2)',
                      borderRadius:9, cursor:'pointer', display:'flex',
                      alignItems:'center', gap:10, transition:'background .2s' }}
                    onMouseOver={e=>e.currentTarget.style.background='rgba(59,130,246,0.16)'}
                    onMouseOut={e=>e.currentTarget.style.background='rgba(59,130,246,0.08)'}>
                    <div style={{ width:32, height:32, borderRadius:'50%',
                      background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:13, fontWeight:800, color:'white' }}>
                      {book.sellerEmail[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin:0, color:'#3b82f6', fontSize:12, fontWeight:600 }}>
                        {book.sellerEmail.split('@')[0]}
                      </p>
                      <p style={{ margin:0, color:'rgba(255,255,255,0.3)', fontSize:10 }}>
                        View seller's books →
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── READ TAB — just opens the link ── */}
        {tab==='read' && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:80, marginBottom:20 }}>📖</div>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#f0f9ff', margin:'0 0 12px' }}>
              {book.nom}
            </h2>
            {book.authorName && (
              <p style={{ color:'#93c5fd', fontStyle:'italic', margin:'0 0 32px' }}>
                by {book.authorName}
              </p>
            )}
            {book.pdfUrl ? (
              <>
                <button onClick={handleRead} style={{
                  padding:'16px 48px',
                  background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                  color:'white', border:'none', borderRadius:14,
                  fontSize:17, fontWeight:700, cursor:'pointer',
                  boxShadow:'0 8px 32px rgba(59,130,246,0.5)',
                  transition:'all .2s' }}
                onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
                onMouseOut={e=>e.currentTarget.style.transform=''}>
                  📖 Open Book / PDF ↗
                </button>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, marginTop:16 }}>
                  Opens in a new tab · Link provided by the seller
                </p>
              </>
            ) : (
              <div style={{ padding:'24px 32px',
                background:'rgba(239,68,68,0.08)',
                border:'1px solid rgba(239,68,68,0.2)',
                borderRadius:12, display:'inline-block' }}>
                <p style={{ color:'#f87171', margin:0, fontSize:14 }}>
                  No reading link available for this book.
                </p>
                <p style={{ color:'rgba(255,255,255,0.35)', margin:'8px 0 0', fontSize:12 }}>
                  Contact the seller for access.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
    </div>
  );
}