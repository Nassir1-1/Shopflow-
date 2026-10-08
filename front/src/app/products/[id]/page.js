'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, addToCart } from '../../lib/api';
import { useMode } from '../../lib/useMode';
import PageBg from '../../components/PageBg';
import API from '../../lib/api';

export default function ProductDetailPage() {
  const params = useParams();
  const router  = useRouter();
  const { t, isClassic } = useMode();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [revealed,setRevealed]  = useState(false);
  const [adding,  setAdding]    = useState(false);
  const [zoomed,  setZoomed]    = useState(false);
  const [zoomPos, setZoomPos]   = useState({ x: 50, y: 50 });
  const [toast,   setToast]     = useState('');
  const [bio,     setBio]       = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!params?.id) return;
    getProduct(params.id)
      .then(r => {
        setProduct(r.data);
        setTimeout(() => setRevealed(true), 150);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  // ── AI bio via backend proxy ──────────────────────────────────────
  const handleAIBio = async () => {
    const name = product?.sellerName || product?.sellerEmail?.split('@')[0];
    if (!name) return;
    setBioLoading(true);
    try {
      const res = await API.post('/api/ai/bio', {
        name,
        context: `${product.nom}. ${product.description || ''}`.substring(0, 300),
      });
      setBio(res.data?.bio || 'Could not generate biography.');
    } catch {
      // fallback — try inline if backend not ready
      setBio(`${name} is a talented creator whose work "${product.nom}" reflects remarkable skill and artistic vision. Their pieces invite viewers into a world of creativity and expression.`);
    }
    setBioLoading(false);
  };

  const handleAdd = async () => {
    setAdding(true);
    try { await addToCart(product.id, 1); showToast('✅ Added to cart!'); }
    catch { showToast('⚠️ Please login first'); }
    finally { setAdding(false); }
  };

  const handleMouseMove = (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:44, height:44, border:`3px solid ${t?.accent || '#C9952A'}44`,
        borderTopColor: t?.accent || '#C9952A', borderRadius:'50%',
        animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!product) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'white',
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:16 }}>
      <span style={{ fontSize:64 }}>🖼️</span>
      <p>Product not found</p>
      <button onClick={() => router.push('/products')} style={{
        background:'transparent', border:`1px solid ${t.accent}`,
        color:t.accent, padding:'8px 20px', borderRadius:8, cursor:'pointer' }}>
        ← Back
      </button>
    </div>
  );

  const hasPromo  = product.prixPromo && product.prixPromo < product.prix;
  const price     = hasPromo ? product.prixPromo : product.prix;
  const isFree    = !price || parseFloat(price) === 0;   // ← "Not for sale" flag
  const authorM   = product.description?.match(/Artist:\s*(.+)/);
  const yearM     = product.description?.match(/Year:\s*(\d{4})/);
  const movementM = product.description?.match(/Movement:\s*(.+)/);
  const cleanDesc = product.description
    ?.replace(/Artist:.*\n?/g, '').replace(/Year:.*\n?/g, '')
    .replace(/Movement:.*\n?/g, '').trim();

  return (
    <div style={{ minHeight:'100vh', fontFamily:t.fontBody,
      position:'relative', color:t.textPrimary, paddingBottom:60 }}>

      <PageBg />

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
          background:'rgba(20,20,30,0.95)', backdropFilter:'blur(12px)',
          color:'white', padding:'13px 20px', borderRadius:12, fontSize:14,
          border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
          animation:'slideUp .3s ease', fontFamily:t.fontBody }}>
          {toast}
        </div>
      )}

      <div style={{ position:'relative', zIndex:2,
        maxWidth:1100, margin:'0 auto', padding:'32px 24px' }}>

        <button onClick={() => router.push('/products')} style={{
          background:'transparent', border:`1px solid ${t.accent}66`,
          color:t.accent, padding:'7px 16px', borderRadius:8,
          cursor:'pointer', fontSize:13, marginBottom:32,
          fontFamily:t.fontBody, transition:'all .2s' }}
        onMouseOver={e=>e.currentTarget.style.background=`${t.accent}18`}
        onMouseOut={e=>e.currentTarget.style.background='transparent'}>
          ← {isClassic ? 'Gallery' : 'Studio'}
        </button>

        <div style={{ display:'flex', gap:48, flexWrap:'wrap', alignItems:'flex-start',
          opacity: revealed?1:0, transform: revealed?'translateX(0)':'translateX(-28px)',
          transition:'opacity .6s ease, transform .6s ease' }}>

          {/* ── Image with zoom ── */}
          <div style={{ flex:'0 0 420px', maxWidth:'min(420px,100%)' }}>
            <div
              ref={imgRef}
              onClick={() => setZoomed(z => !z)}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setZoomed(false)}
              style={{
                borderRadius: isClassic ? 8 : 12,
                overflow:'hidden',
                cursor: zoomed ? 'zoom-out' : 'zoom-in',
                boxShadow: isClassic
                  ? `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px ${t.cardBorder}`
                  : `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${t.accentGlow}`,
                position:'relative',
              }}>
              {product.images ? (
                <img src={product.images.split(',')[0]?.trim()} alt={product.nom}
                  style={{
                    width:'100%', display:'block',
                    transformOrigin:`${zoomPos.x}% ${zoomPos.y}%`,
                    transform: zoomed ? 'scale(2.8)' : 'scale(1)',
                    transition: zoomed ? 'none' : 'transform .4s ease',
                  }}/>
              ) : (
                <div style={{ height:360, background:t.cardBg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:72 }}>{t.emptyIcon}</div>
              )}
              <div style={{ position:'absolute', bottom:10, right:10,
                background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
                color:'rgba(255,255,255,0.6)', fontSize:11, padding:'4px 10px',
                borderRadius:20, pointerEvents:'none',
                fontFamily:t.fontBody }}>
                {zoomed ? 'Click to zoom out' : '🔍 Click to zoom'}
              </div>
            </div>

            {/* Category badge */}
            <div style={{ marginTop:16, display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:11, fontWeight:700,
                background:`${t.accent}18`, color:t.accent,
                padding:'4px 12px', borderRadius:20, fontFamily:t.fontBody,
                textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {product.artCategory === 'CLASSIC_ART' ? '🖼️ Classic Art'
                  : product.artCategory === 'GRAPHIC_DESIGN' ? '✏️ Graphic Design'
                  : '📚 Book'}
              </span>
              {/* "Display only" badge */}
              {isFree && (
                <span style={{ fontSize:11, fontWeight:700,
                  background:'rgba(99,102,241,0.15)', color:'#818cf8',
                  padding:'4px 12px', borderRadius:20, fontFamily:t.fontBody,
                  border:'1px solid rgba(99,102,241,0.3)' }}>
                  🏛️ Display Only
                </span>
              )}
            </div>
          </div>

          {/* ── Info panel ── */}
          <div style={{ flex:1, minWidth:280 }}>

            {authorM && (
              <p style={{ fontSize:14, color:t.accent, fontStyle:'italic',
                margin:'0 0 8px', fontFamily:t.fontScript }}>
                {authorM[1].trim()}{yearM ? ` · ${yearM[1]}` : ''}
                {movementM ? ` · ${movementM[1].trim()}` : ''}
              </p>
            )}

            <h1 style={{ fontSize:'clamp(22px,3vw,34px)', fontWeight:900,
              color:t.textPrimary, margin:'0 0 20px', lineHeight:1.2,
              fontFamily:t.fontTitle,
              textShadow:`0 0 40px ${t.accentGlow}` }}>
              {product.nom}
            </h1>

            {/* ── PRICE / BUY section ── */}
            {isFree ? (
              /* Not for sale */
              <div style={{ padding:'20px 24px',
                background:'rgba(99,102,241,0.08)',
                border:'1px solid rgba(99,102,241,0.25)',
                borderRadius:14, marginBottom:24 }}>
                <p style={{ margin:'0 0 8px', fontSize:22, fontWeight:800,
                  color:'#818cf8', fontFamily:t.fontBody }}>
                  🏛️ Not For Sale
                </p>
                <p style={{ margin:0, color:'rgba(255,255,255,0.5)',
                  fontSize:13, lineHeight:1.6, fontFamily:t.fontBody }}>
                  This artwork is part of our permanent collection,
                  displayed for appreciation. It is not available for purchase.
                </p>
              </div>
            ) : (
              /* Normal pricing */
              <div style={{ marginBottom:24 }}>
                {hasPromo && (
                  <p style={{ color:'rgba(255,255,255,0.35)',
                    textDecoration:'line-through', fontSize:18, margin:'0 0 4px',
                    fontFamily:t.fontBody }}>
                    {product.prix?.toLocaleString()} TND
                  </p>
                )}
                <p style={{ fontSize:36, fontWeight:900, color:t.accent,
                  margin:'0 0 20px', fontFamily:t.fontBody,
                  textShadow:`0 0 24px ${t.accentGlow}` }}>
                  {price?.toLocaleString()} TND
                  {hasPromo && (
                    <span style={{ fontSize:13, background:'rgba(52,211,153,0.12)',
                      color:'#34d399', padding:'3px 10px', borderRadius:20,
                      marginLeft:10, fontWeight:600 }}>
                      -{Math.round((1 - product.prixPromo/product.prix)*100)}%
                    </span>
                  )}
                </p>

                <button onClick={handleAdd} disabled={adding} style={{
                  width:'100%', maxWidth:320, padding:'15px 0',
                  background: t.accentGrad, color: isClassic ? '#1a0e00' : 'white',
                  border:'none', borderRadius:12, fontSize:16, fontWeight:700,
                  cursor:adding?'wait':'pointer', fontFamily:t.fontBody,
                  boxShadow:`0 8px 32px ${t.accentGlow}`,
                  transition:'all .2s', display:'block',
                  opacity:adding?0.7:1 }}
                onMouseOver={e=>!adding&&(e.currentTarget.style.transform='translateY(-2px)')}
                onMouseOut={e=>(e.currentTarget.style.transform='')}>
                  {adding ? '⏳ Adding...' : '🛒 Add to Cart'}
                </button>

                <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11,
                  margin:'10px 0 0', fontFamily:t.fontBody }}>
                  🚚 Delivery available · 🔒 Secure payment · 10% platform fee
                </p>
              </div>
            )}

            {/* Description */}
            {cleanDesc && (
              <>
                <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'0 0 20px' }}/>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:15,
                  lineHeight:1.9, margin:'0 0 24px', fontFamily:t.fontBody }}>
                  {cleanDesc}
                </p>
              </>
            )}

            {/* Artist bio */}
            {product.sellerEmail && (
              <div style={{ background:'rgba(255,255,255,0.04)',
                border:`1px solid ${t.cardBorder}`,
                borderRadius:14, padding:20 }}>
                <div style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                  <h3 style={{ margin:0, color:t.textPrimary,
                    fontSize:14, fontWeight:700, fontFamily:t.fontTitle }}>
                    👤 About the Creator
                  </h3>
                  {!bio && (
                    <button onClick={handleAIBio} disabled={bioLoading} style={{
                      padding:'5px 12px', background:'rgba(124,58,237,0.18)',
                      border:'1px solid rgba(124,58,237,0.4)', color:'#a78bfa',
                      borderRadius:20, cursor:'pointer', fontSize:11,
                      fontWeight:600, opacity:bioLoading?0.6:1,
                      fontFamily:t.fontBody }}>
                      {bioLoading ? '⏳ Generating...' : '🤖 AI Generate Bio'}
                    </button>
                  )}
                </div>

                {bio ? (
                  <p style={{ margin:'0 0 14px', color:'rgba(255,255,255,0.7)',
                    fontSize:13, lineHeight:1.75, fontFamily:t.fontBody }}>
                    {bio}
                  </p>
                ) : (
                  <p style={{ margin:'0 0 14px', color:'rgba(255,255,255,0.35)',
                    fontSize:13, fontStyle:'italic', fontFamily:t.fontBody }}>
                    Click "AI Generate Bio" for an auto-generated artist biography.
                  </p>
                )}

                {/* Artist link */}
                <div onClick={() => router.push(`/artist/${encodeURIComponent(product.sellerEmail)}`)}
                  style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'10px 14px', borderRadius:10, cursor:'pointer',
                    background:`${t.accent}0e`,
                    border:`1px solid ${t.accent}22`,
                    transition:'background .2s' }}
                  onMouseOver={e=>e.currentTarget.style.background=`${t.accent}1e`}
                  onMouseOut={e=>e.currentTarget.style.background=`${t.accent}0e`}>
                  <div style={{ width:36, height:36, borderRadius:'50%',
                    background:t.accentGrad, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:15, fontWeight:900,
                    color:isClassic?'#1a0e00':'white', flexShrink:0 }}>
                    {product.sellerEmail[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin:0, color:t.accent, fontSize:13,
                      fontWeight:700, fontFamily:t.fontBody }}>
                      {product.sellerEmail.split('@')[0]}
                    </p>
                    <p style={{ margin:0, color:'rgba(255,255,255,0.3)',
                      fontSize:11, fontFamily:t.fontBody }}>
                      View full portfolio →
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
    </div>
  );
}