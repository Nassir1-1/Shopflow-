'use client';
import { useEffect, useState, useCallback } from 'react';
import { getProducts, searchProducts, addToCart, deleteProduct } from '../lib/api';
import { useRouter } from 'next/navigation';
import { useMode } from '../lib/useMode';
import PageBg from '../components/PageBg';



export default function ProductsPage() {
  const router = useRouter();
  const { t, isClassic } = useMode();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [toast,    setToast]    = useState('');
  const [userRole, setUserRole] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts(0, t.apiCategory);
      setProducts(res.data || []);
    } catch { setProducts([]); }
    finally   { setLoading(false); }
  }, [t.apiCategory]);

  useEffect(() => {
    setUserRole(localStorage.getItem('role') || '');
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const h = () => fetchProducts();
    window.addEventListener('shopflow:mode', h);
    return () => window.removeEventListener('shopflow:mode', h);
  }, [fetchProducts]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return fetchProducts();
    setLoading(true);
    try {
      const res = await searchProducts(search, t.apiCategory);
      setProducts(res.data || []);
    } catch { setProducts([]); }
    finally   { setLoading(false); }
  };

  const handleAdd = async (e, id) => {
    e.stopPropagation();
    try { await addToCart(id, 1); showToast('✅ Added to cart!'); }
    catch { showToast('⚠️ Please login first!'); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(p => p.filter(x => x.id !== id));
      showToast('🗑️ Deleted');
    } catch { showToast('❌ Delete failed'); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const isSeller = ['SELLER','ADMIN'].includes(userRole);

  return (
    <div style={{ minHeight:'100vh', fontFamily: t.fontBody,
      position:'relative', color: t.textPrimary }}>
      <PageBg />

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
          background:'rgba(20,20,30,0.95)', backdropFilter:'blur(12px)',
          color:'white', padding:'13px 20px', borderRadius:12, fontSize:14,
          border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
          animation:'slideUp .3s ease', fontFamily: t.fontBody }}>
          {toast}
        </div>
      )}

      <div style={{ position:'relative', zIndex:2,
        maxWidth:1200, margin:'0 auto', padding:'40px 24px' }}>

        {/* ── Section header ── */}
        <div style={{ marginBottom:32 }}>
          <p style={{ fontSize:13, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'0.12em', color: t.accent, margin:'0 0 6px',
            fontFamily: t.fontBody }}>
            {t.label}
          </p>

          {/* ══ BIG TITLE — Brione for Classic, Cravelo for Graphic ══ */}
          <h1 style={{
            fontSize: 36, fontWeight: 800, margin:'0 0 6px',
            color: t.textPrimary,
            fontFamily: t.fontGalleryTitle,   // ← Brione / Cravelo here
            letterSpacing: isClassic ? '0.02em' : '0.05em',
          }}>
            {isClassic ? 'Fine Art Gallery' : 'Graphic Design Studio'}
          </h1>

          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, margin:0,
            fontFamily: t.fontBody }}>
            {isClassic
              ? 'Timeless masterpieces from artists around the world'
              : 'Modern digital art, logos, posters and illustrations'}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch}
          style={{ display:'flex', gap:12, marginBottom:36 }}>
          <input
            placeholder={isClassic ? 'Search artworks...' : 'Search designs...'}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              flex:1, padding:'12px 18px',
              background:'rgba(255,255,255,0.07)',
              border:`1px solid rgba(255,255,255,0.12)`,
              borderRadius:12, color:'white', fontSize:14,
              outline:'none', fontFamily: t.fontBody,
              transition:'border-color .2s',
            }}
            onFocus={e => e.target.style.borderColor = t.accent}
            onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <button type="submit" style={{
            padding:'12px 24px', background: t.accentGrad,
            color: isClassic ? '#1a0e00' : 'white',
            border:'none', borderRadius:12,
            fontSize:14, fontWeight:700, cursor:'pointer',
            fontFamily: t.fontBody,
            boxShadow:`0 4px 16px ${t.accentGlow}`,
          }}>
            Search
          </button>
        </form>

        {/* Product grid */}
        {loading ? (
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ width:200, height:270, borderRadius:16,
                background:'rgba(255,255,255,0.05)',
                animation:'pulse 1.5s infinite' }}/>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0',
            color:'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>{t.emptyIcon}</div>
            <h3 style={{ color: t.textPrimary, marginBottom:8,
              fontFamily: t.fontGalleryTitle }}>
              No {isClassic ? 'artworks' : 'designs'} yet
            </h3>
            <p style={{ marginBottom:24, fontFamily: t.fontBody }}>
              {isClassic
                ? 'Be the first to upload a classic painting.'
                : 'Be the first to upload a graphic design.'}
            </p>
            <button onClick={() => router.push('/order')} style={{
              padding:'12px 28px', background: t.accentGrad,
              color: isClassic ? '#1a0e00' : 'white',
              border:'none', borderRadius:12,
              fontSize:14, fontWeight:700, cursor:'pointer',
              fontFamily: t.fontBody,
            }}>
              Upload {isClassic ? 'Artwork' : 'Design'} →
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:24 }}>
            {products.map(p => {
              const hasPromo = p.prixPromo && p.prixPromo < p.prix;
              return (
                <div key={p.id}
                  onClick={() => router.push(`/products/${p.id}`)}
                  style={{
                    width:200,
                    background: t.cardBg,
                    border:`1px solid ${t.cardBorder}`,
                    borderRadius: t.cardRadius,
                    overflow:'hidden', cursor:'pointer',
                    backdropFilter:'blur(10px)',
                    transition:'all .3s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-10px)';
                    e.currentTarget.style.borderColor = t.cardBorderHover;
                    e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.borderColor = t.cardBorder;
                    e.currentTarget.style.boxShadow = '';
                  }}>
                  <div style={{ height:130, overflow:'hidden',
                    background:'rgba(255,255,255,0.03)' }}>
                    {p.images
                      ? <img src={p.images} alt={p.nom}
                          style={{ width:'100%', height:'100%', objectFit:'cover',
                            transition:'transform .5s' }}
                          onMouseOver={e => e.target.style.transform='scale(1.1)'}
                          onMouseOut={e  => e.target.style.transform='scale(1)'}/>
                      : <div style={{ height:'100%', display:'flex',
                          alignItems:'center', justifyContent:'center',
                          fontSize:36 }}>{t.emptyIcon}</div>
                    }
                  </div>
                  <div style={{ padding:14 }}>
                    <p style={{ margin:'0 0 4px', fontWeight:700,
                      color: t.textPrimary, fontSize:13,
                      fontFamily: t.fontTitle,
                      whiteSpace:'nowrap', overflow:'hidden',
                      textOverflow:'ellipsis' }}>
                      {p.nom}
                    </p>
                    {/* Artist + year from description */}
                    {(() => {
                      const am = p.description?.match(/Artist:\s*(.+)/);
                      const ym = p.description?.match(/Year:\s*(\d{4})/);
                      return am ? (
                        <p style={{ margin:'0 0 6px', fontSize:11,
                          color: t.accent, fontStyle:'italic',
                          fontFamily: t.fontScript }}>
                          {am[1].trim()}{ym ? `, ${ym[1]}` : ''}
                        </p>
                      ) : null;
                    })()}
                    <p style={{ margin:'0 0 12px', fontSize:11,
                      color:'rgba(255,255,255,0.35)', lineHeight:1.5,
                      overflow:'hidden', display:'-webkit-box',
                      WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                      fontFamily: t.fontBody }}>
                      {p.description?.replace(/Artist:.*|Year:.*|Movement:.*/g,'').trim()}
                    </p>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center' }}>
                      <span style={{ fontSize:14, fontWeight:800,
                        color: t.accent, fontFamily: t.fontBody }}>
                        {(hasPromo ? p.prixPromo : p.prix)?.toLocaleString()} TND
                      </span>
                      <div onClick={e => handleAdd(e, p.id)} style={{
                        width:28, height:28,
                        borderRadius: t.addBtnRadius,
                        background: t.accentGrad,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color: isClassic ? '#1a0e00' : 'white',
                        cursor:'pointer', fontSize:18, fontWeight:700,
                        boxShadow:`0 4px 12px ${t.accentGlow}`,
                        transition:'transform .2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.transform='scale(1.2)'}
                      onMouseOut={e  => e.currentTarget.style.transform='scale(1)'}>
                        +
                      </div>
                    </div>
                    {isSeller && (
                      <button onClick={e => handleDelete(e, p.id)} style={{
                        marginTop:8, width:'100%', padding:'5px 0',
                        background:'rgba(239,68,68,0.15)', color:'#f87171',
                        border:'1px solid rgba(239,68,68,0.3)',
                        borderRadius:8, fontSize:11, fontWeight:700,
                        cursor:'pointer', transition:'all .2s',
                        fontFamily: t.fontBody,
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background='rgba(239,68,68,0.35)';
                        e.currentTarget.style.color='#fff';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background='rgba(239,68,68,0.15)';
                        e.currentTarget.style.color='#f87171';
                      }}>
                        🗑️ Delete
                      </button>
                    )}
                    <p style={{ textAlign:'center', color: t.accent,
                      fontSize:10, margin:'8px 0 0', opacity:0.6,
                      fontFamily: t.fontBody }}>
                      Click to view →
                    </p>
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