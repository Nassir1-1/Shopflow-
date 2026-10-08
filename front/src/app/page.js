'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getProducts, addToCart } from './lib/api';
import { useRouter } from 'next/navigation';
import { useMode, THEME } from './lib/useMode';

const SLIDES = {
  classic: [
    { image:'https://panoramadelart.com/sites/default/files/2023-01/a-botticelli-venus-naissance.jpg',
      title:'La Naissance de Vénus', artist:'Sandro Botticelli', year:'1484',
      desc:'Venus rises from the sea — an eternal symbol of beauty and the Renaissance.' },
    { image:'https://upload.wikimedia.org/wikipedia/commons/f/fd/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg',
      title:'Bonaparte franchissant les Alpes', artist:'Jacques-Louis David', year:'1801',
      desc:'Napoleon astride a rearing horse — power and legend frozen in oils.' },
    { image:'https://static-assets.artlogic.net/w_2000,h_2000,c_limit,f_auto,fl_lossy,q_auto/artlogicstorage/elmarsa/images/view/c97fe983f9851ca28fe682df6db7bd62/elmarsagallery-ammar-farhat-untitled-1962.jpg',
      title:'Untitled', artist:'Ammar Farhat', year:'1962',
      desc:'A cornerstone of Tunisian modernism.' },
    { image:'https://panoramadelart.com/sites/default/files/2026-01/a-friedrich-voyageur.jpg',
      title:'Le Voyageur', artist:'Caspar David Friedrich', year:'1818',
      desc:'Romanticism at its most sublime.' },
  ],
  graphic: [
    { image:'https://i.pinimg.com/1200x/15/29/de/1529dec3f7e010bd71a3b02f4fe9e156.jpg',
      title:'Modern Architecture Concept', artist:'Modern Studio', year:'2024',
      desc:'Where pixels meet purpose — graphic design that communicates and inspires.' },
    { image:'https://i.pinimg.com/736x/5b/73/dc/5b73dc5cbc905047d88a7853ad24c06f.jpg',
      title:'The Lone Voyage', artist:'Creative Lab', year:'2024',
      desc:'A conceptual minimalist design — solitude and the vast journey.' },
    { image:'https://cdna.artstation.com/p/assets/images/images/098/084/200/large/feres-ghzela1.jpg?1776091620',
      title:'Eyes of the Truth', artist:'Fares Klai', year:'2024',
      desc:'Intensity and introspection — light, text and gaze.' },
    { image:'https://i.pinimg.com/736x/25/ec/4d/25ec4d80a59b8f82efd4bd7e5dec3ec5.jpg',
      title:'Parallel Dimensions', artist:'Minimalist Digital Collective', year:'2024',
      desc:'A lone silhouette before a cosmic portal.' },
  ],
  books: [
    { image:'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop',
      title:'The World of Books', artist:'ShopFlow Library', year:'2024',
      desc:'Explore thousands of titles — from classic literature to modern masterpieces.' },
    { image:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&auto=format&fit=crop',
      title:'Knowledge is Power', artist:'ShopFlow Library', year:'2024',
      desc:'Every page is a new world. Every chapter, a new beginning.' },
    { image:'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&auto=format&fit=crop',
      title:'Stories that Last Forever', artist:'ShopFlow Library', year:'2024',
      desc:"Humanity's greatest stories, preserved forever." },
  ],
};

export default function Home() {
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const { mode, switchMode, isClassic, t } = useMode();

  const [topCat,   setTopCat]   = useState('art');
  const [current,  setCurrent]  = useState(0);
  const [prevSlide,setPrevSlide]= useState(null);
  const [fading,   setFading]   = useState(false);
  const [textShow, setTextShow] = useState(true);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    const savedTopCat = localStorage.getItem('topCat') || 'art';
    setTopCat(savedTopCat);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    setProducts([]);
    getProducts(0)
      .then(r => {
        const all = r.data || [];
        const filtered = all.filter(p => {
          if (topCat === 'books') return p.artCategory === 'BOOK';
          if (isClassic)          return p.artCategory === 'CLASSIC_ART';
          return                         p.artCategory === 'GRAPHIC_DESIGN';
        });
        setProducts(filtered);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [topCat, mode, isClassic, mounted]);

  const switchTopCat = useCallback((cat) => {
    setTopCat(cat);
    localStorage.setItem('topCat', cat);
    setCurrent(0);
    setTextShow(false);
    setTimeout(() => setTextShow(true), 300);
    window.dispatchEvent(new CustomEvent('shopflow:topcat', { detail: cat }));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setCurrent(0);
    setTextShow(false);
    setTimeout(() => setTextShow(true), 350);
  }, [topCat, mode, mounted]);

  const slideKey = topCat === 'books' ? 'books' : mode;
  const slides   = SLIDES[slideKey] || SLIDES.classic;
  const slide    = slides[current] || slides[0];

  const goTo = useCallback((idx) => {
    if (fading) return;
    setFading(true); setTextShow(false); setPrevSlide(current);
    setTimeout(() => {
      setCurrent(idx % slides.length);
      setPrevSlide(null); setFading(false);
      setTimeout(() => setTextShow(true), 80);
    }, 700);
  }, [fading, current, slides.length]);

  const goNext = useCallback(() => goTo((current+1) % slides.length), [current,goTo,slides.length]);
  const goPrev = useCallback(() => goTo((current-1+slides.length)%slides.length),[current,goTo,slides.length]);

  useEffect(() => {
    timerRef.current = setTimeout(goNext, 5500);
    return () => clearTimeout(timerRef.current);
  }, [current, goNext]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleAdd = async (e, id) => {
    e.stopPropagation();
    try { await addToCart(id, 1); showToast('✅ Added!'); }
    catch { showToast('⚠️ Login first'); }
  };

  const curAccent = topCat==='books' ? '#3b82f6'    : t.accent;
  const curGrad   = topCat==='books' ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : t.accentGrad;
  const curGlow   = topCat==='books' ? 'rgba(59,130,246,0.4)' : t.accentGlow;

  if (!mounted) return null;

  return (
    <div style={{ minHeight:'100vh', fontFamily:t.fontBody, color:t.textPrimary }}>

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
          background:'rgba(20,20,30,0.95)', backdropFilter:'blur(12px)',
          color:'white', padding:'13px 20px', borderRadius:12, fontSize:14,
          border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)', animation:'slideUp .3s ease' }}>
          {toast}
        </div>
      )}

      {/* ══ TOP CATEGORY SWITCHER ══════════════════════════ */}
      <div style={{ position:'relative', zIndex:10,
        display:'flex', justifyContent:'center',
        padding:'20px 16px 0', gap:14, flexWrap:'wrap' }}>

        <div style={{ display:'inline-flex',
          background:'rgba(0,0,0,0.6)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:40, padding:5, gap:4,
          boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {[
            { key:'art',   icon:'🎨', label:'Paint & Design' },
            { key:'books', icon:'📚', label:'Books' },
          ].map(({ key, icon, label }) => {
            const active = topCat === key;
            const col  = key==='books' ? '#3b82f6' : '#C9952A';
            const grad = key==='books'
              ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)'
              : 'linear-gradient(135deg,#C9952A,#f0c040)';
            return (
              <button key={key} onClick={() => switchTopCat(key)} style={{
                padding:'10px 28px', borderRadius:36, border:'none',
                cursor:'pointer', fontSize:14, fontWeight:700,
                letterSpacing:'0.04em', transition:'all .35s',
                fontFamily: t.fontBody,
                background:  active ? grad        : 'transparent',
                color:       active ? (key==='books'?'white':'#1a0e00') : 'rgba(255,255,255,0.45)',
                boxShadow:   active ? `0 4px 20px ${col}88` : 'none',
                transform:   active ? 'scale(1.04)' : 'scale(1)',
              }}>
                {icon} {label}
              </button>
            );
          })}
        </div>

        {topCat === 'art' && (
          <div style={{ display:'inline-flex',
            background:'rgba(0,0,0,0.55)', backdropFilter:'blur(16px)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:40, padding:4, gap:3 }}>
            {[
              { key:'classic', icon:'🖼️', label:'Classic Art',     col:'#C9952A', grad:'linear-gradient(135deg,#C9952A,#f0c040)' },
              { key:'graphic', icon:'✏️', label:'Graphic Design',  col:'#e879f9', grad:'linear-gradient(135deg,#7c3aed,#e879f9)' },
            ].map(({ key, icon, label, col, grad }) => {
              const active = mode === key;
              return (
                <button key={key} onClick={() => switchMode(key)} style={{
                  padding:'8px 22px', borderRadius:36, border:'none',
                  cursor:'pointer', fontSize:13, fontWeight:600,
                  transition:'all .3s', fontFamily:t.fontBody,
                  background: active ? grad : 'transparent',
                  color: active ? (key==='classic'?'#1a0e00':'#fff') : 'rgba(255,255,255,0.4)',
                  boxShadow: active ? `0 4px 16px ${col}66` : 'none',
                }}>
                  {icon} {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ HERO SLIDESHOW ═════════════════════════════════ */}
      <section style={{ position:'relative', height:'100vh',
        marginTop:-70, overflow:'hidden', cursor:'pointer' }}
        onDoubleClick={() => router.push(topCat==='books' ? '/books' : '/products')}>

        {prevSlide !== null && (
          <div style={{ position:'absolute', inset:0, zIndex:1,
            backgroundImage:`url(${slides[prevSlide]?.image})`,
            backgroundSize:'cover', backgroundPosition:'center',
            opacity:fading?0:1, transition:'opacity .7s ease' }}/>
        )}
        <div style={{ position:'absolute', inset:0, zIndex:2,
          backgroundImage:`url(${slide.image})`,
          backgroundSize:'cover', backgroundPosition:'center',
          opacity:fading?0:1, transition:'opacity .7s ease' }}/>
        <div style={{ position:'absolute', inset:0, zIndex:3,
          background: topCat==='books'
            ? 'linear-gradient(to right,rgba(0,0,10,0.88) 0%,rgba(0,0,10,0.35) 55%,transparent 100%)'
            : isClassic
              ? 'linear-gradient(to right,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.3) 55%,transparent 100%)'
              : 'linear-gradient(to right,rgba(5,0,20,0.88) 0%,rgba(5,0,20,0.35) 55%,transparent 100%)' }}/>

        <div style={{ position:'absolute', left:0, top:0, bottom:0, zIndex:4,
          display:'flex', alignItems:'center',
          padding:'0 clamp(24px,6vw,80px)', maxWidth:680,
          opacity:textShow?1:0, transform:textShow?'translateX(0)':'translateX(-28px)',
          transition:'opacity .5s ease, transform .5s ease' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8,
              background:`${curAccent}22`,
              border:`1px solid ${curAccent}88`,
              borderRadius:20, padding:'5px 16px', marginBottom:20 }}>
              <span style={{ fontSize:13, fontWeight:700, color:curAccent,
                fontFamily:topCat==='books'?t.fontBody:t.fontScript,
                fontStyle:isClassic&&topCat!=='books'?'italic':'normal' }}>
                {slide.artist}
              </span>
              <span style={{ width:4,height:4,borderRadius:'50%',background:'rgba(255,255,255,0.3)'}}/>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:t.fontBody }}>
                {slide.year}
              </span>
            </div>

            <h1 style={{ fontSize:'clamp(26px,5vw,58px)', fontWeight:900,
              color:t.textPrimary, margin:'0 0 16px', lineHeight:1.1,
              fontFamily:topCat==='books'?t.fontBody:t.fontTitle,
              textShadow:'0 4px 24px rgba(0,0,0,0.7)' }}>
              {slide.title}
            </h1>

            <p style={{ fontSize:'clamp(14px,1.5vw,16px)',
              color:'rgba(255,255,255,0.65)',
              margin:'0 0 36px', lineHeight:1.8, maxWidth:500,
              fontFamily:t.fontBody }}>
              {slide.desc}
            </p>

            <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
              <button
                onClick={e=>{e.stopPropagation();router.push(topCat==='books'?'/books':'/products');}}
                style={{ padding:'13px 32px', background:curGrad,
                  color:topCat==='books'?'white':isClassic?'#1a0e00':'white',
                  border:'none', borderRadius:12, fontSize:15, fontWeight:700,
                  cursor:'pointer', fontFamily:t.fontBody,
                  boxShadow:`0 8px 32px ${curGlow}`, transition:'transform .2s' }}
                onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
                onMouseOut={e=>e.currentTarget.style.transform=''}>
                {topCat==='books'?'Browse Library →':isClassic?'Browse Gallery →':'Explore Studio →'}
              </button>
            </div>
          </div>
        </div>

        {[{s:{left:16},l:'‹',fn:goPrev},{s:{right:16},l:'›',fn:goNext}].map(({s,l,fn})=>(
          <button key={l} onClick={e=>{e.stopPropagation();fn();}} style={{
            position:'absolute',top:'50%',transform:'translateY(-50%)',
            zIndex:5,...s,width:48,height:48,borderRadius:'50%',
            background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.15)',
            color:'white',fontSize:22,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            transition:'background .2s'}}
          onMouseOver={e=>e.currentTarget.style.background=`${curAccent}88`}
          onMouseOut={e=>e.currentTarget.style.background='rgba(0,0,0,0.4)'}>
            {l}
          </button>
        ))}

        <div style={{position:'absolute',bottom:32,left:'50%',
          transform:'translateX(-50%)',zIndex:5,display:'flex',gap:8}}>
          {slides.map((_,i)=>(
            <button key={i} onClick={e=>{e.stopPropagation();goTo(i);}} style={{
              width:i===current?30:10,height:10,borderRadius:5,
              border:'none',padding:0,cursor:'pointer',
              background:i===current?curAccent:'rgba(255,255,255,0.25)',
              transition:'all .4s ease'}}/>
          ))}
        </div>

        <div style={{position:'absolute',bottom:0,right:0,zIndex:5,
          display:'flex',gap:4,padding:'0 8px 8px 0'}}>
          {slides.map((s,i)=>(
            <div key={i} onClick={e=>{e.stopPropagation();goTo(i);}} style={{
              width:52,height:36,borderRadius:6,overflow:'hidden',
              cursor:'pointer',flexShrink:0,opacity:i===current?1:0.4,
              border:`2px solid ${i===current?curAccent:'transparent'}`,
              transition:'all .3s'}}>
              <img src={s.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
          ))}
        </div>

        <div style={{position:'absolute',bottom:20,left:'50%',
          transform:'translateX(-50%)',zIndex:5,
          color:'rgba(255,255,255,0.25)',fontSize:20,
          animation:'bounce 2s infinite',pointerEvents:'none'}}>↓</div>
      </section>

      {/* ══ FEATURED PRODUCTS ══════════════════════════════ */}
      <section style={{padding:'60px 32px',maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:36}}>
          <p style={{fontSize:13,fontWeight:700,textTransform:'uppercase',
            letterSpacing:'0.12em',color:curAccent,margin:'0 0 8px',fontFamily:t.fontBody}}>
            {topCat==='books'?'📚 Library':''}
            {topCat==='art' && isClassic  ? '🎨 Classic Collection' : ''}
            {topCat==='art' && !isClassic ? '✏️ Graphic Studio' : ''}
          </p>
          <h2 style={{fontSize:28,fontWeight:800,margin:'0 0 8px',
            color:t.textPrimary,fontFamily:topCat==='books'?t.fontBody:t.fontGalleryTitle}}>
            {topCat==='books'?'Featured Books':isClassic?'Featured Artworks':'Featured Designs'}
          </h2>
          <p style={{color:'rgba(255,255,255,0.35)',fontSize:14,margin:0,fontFamily:t.fontBody}}>
            {topCat==='books'
              ?'Curated reads from independent authors'
              :isClassic?'Timeless masterpieces from artists worldwide'
              :'Modern digital art, logos and illustrations'}
          </p>
        </div>

        {loading ? (
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{width:200,height:270,borderRadius:16,
                background:'rgba(255,255,255,0.04)',animation:'pulse 1.5s infinite'}}/>
            ))}
          </div>
        ) : products.length===0 ? (
          <div style={{textAlign:'center',padding:'80px 0',color:'rgba(255,255,255,0.35)'}}>
            <div style={{fontSize:64,marginBottom:16}}>
              {topCat==='books'?'📚':t.emptyIcon}
            </div>
            <h3 style={{color:t.textPrimary,marginBottom:8,
              fontFamily:topCat==='books'?t.fontBody:t.fontGalleryTitle}}>
              No {topCat==='books'?'books':isClassic?'artworks':'designs'} yet
            </h3>
            <button onClick={()=>router.push(topCat==='books'?'/books/upload':'/order')} style={{
              padding:'12px 28px',background:curGrad,
              color:topCat==='books'?'white':isClassic?'#1a0e00':'white',
              border:'none',borderRadius:12,fontSize:14,fontWeight:700,
              cursor:'pointer',fontFamily:t.fontBody,marginTop:16}}>
              Upload →
            </button>
          </div>
        ) : (
          <>
            <div style={{display:'flex',flexWrap:'wrap',gap:24}}>
              {products.map(p=>{
                const hasPromo=p.prixPromo&&p.prixPromo<p.prix;
                const isBook=p.artCategory==='BOOK';
                return (
                  <div key={p.id}
                    onClick={()=>router.push(isBook?`/books/${p.id}`:`/products/${p.id}`)}
                    style={{width:200,background:t.cardBg,
                      border:`1px solid ${isBook?'rgba(59,130,246,0.15)':t.cardBorder}`,
                      borderRadius:t.cardRadius,overflow:'hidden',cursor:'pointer',
                      backdropFilter:'blur(8px)',transition:'all .35s'}}
                    onMouseOver={e=>{
                      e.currentTarget.style.transform='translateY(-10px)';
                      e.currentTarget.style.borderColor=isBook?'rgba(59,130,246,0.5)':t.cardBorderHover;
                      e.currentTarget.style.boxShadow='0 20px 50px rgba(0,0,0,0.5)';
                    }}
                    onMouseOut={e=>{
                      e.currentTarget.style.transform='';
                      e.currentTarget.style.borderColor=isBook?'rgba(59,130,246,0.15)':t.cardBorder;
                      e.currentTarget.style.boxShadow='';
                    }}>
                    
                    {/* Safe Image Check Block (Fixed lines) */}
                    <div style={{height:130,overflow:'hidden',
                      background:isBook?'linear-gradient(135deg,#1e3a5f,#1d4ed8)':'rgba(255,255,255,0.03)'}}>
                      {p.images && p.images.trim() !== "" ? (
                        <img src={p.images.split(',')[0]?.trim()} alt={p.nom}
                           style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .5s'}}
                           onMouseOver={e=>e.target.style.transform='scale(1.1)'}
                           onMouseOut={e=>e.target.style.transform='scale(1)'}/>
                      ) : (
                        <div style={{height:'100%',display:'flex',alignItems:'center',
                           justifyContent:'center',fontSize:36}}>
                           {isBook?'📖':'🎨'}
                         </div>
                      )}
                    </div>

                    <div style={{padding:14}}>
                      <p style={{margin:'0 0 3px',fontWeight:700,fontSize:13,
                        color:t.textPrimary,fontFamily:t.fontTitle,
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {p.nom}
                      </p>
                      {(()=>{
                        const am=p.description?.match(/Artist:\s*(.+)/)||p.description?.match(/Author:\s*(.+)/);
                        const ym=p.description?.match(/Year:\s*(\d{4})/);
                        return am?(
                          <p style={{margin:'0 0 6px',fontSize:11,color:curAccent,
                            fontStyle:'italic',fontFamily:t.fontScript}}>
                            {am[1].trim()}{ym?`, ${ym[1]}`:''}
                          </p>
                        ):null;
                      })()}
                      <div style={{display:'flex',justifyContent:'space-between',
                        alignItems:'center',marginTop:6}}>
                        <span style={{fontSize:13,fontWeight:800,color:curAccent,
                          fontFamily:t.fontBody}}>
                          {(hasPromo?p.prixPromo:p.prix)?.toLocaleString()} TND
                        </span>
                        <div onClick={e=>handleAdd(e,p.id)} style={{
                          width:28,height:28,borderRadius:t.addBtnRadius,
                          background:curGrad,display:'flex',
                          alignItems:'center',justifyContent:'center',
                          color:topCat==='books'?'white':isClassic?'#1a0e00':'white',
                          cursor:'pointer',fontSize:18,fontWeight:700,
                          boxShadow:`0 4px 12px ${curGlow}`,transition:'transform .2s'}}
                        onMouseOver={e=>e.currentTarget.style.transform='scale(1.2)'}
                        onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>+</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{textAlign:'center',marginTop:48}}>
              <button onClick={()=>router.push(topCat==='books'?'/books':'/products')} style={{
                padding:'13px 40px',background:'transparent',
                border:`1px solid ${curAccent}66`,color:curAccent,
                borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer',
                fontFamily:t.fontBody,transition:'all .3s'}}
              onMouseOver={e=>{
                e.currentTarget.style.background=`${curAccent}18`;
                e.currentTarget.style.borderColor=curAccent;
              }}
              onMouseOut={e=>{
                e.currentTarget.style.background='transparent';
                e.currentTarget.style.borderColor=`${curAccent}66`;
              }}>
                View Full {topCat==='books'?'Library':isClassic?'Gallery':'Studio'} →
              </button>
            </div>
          </>
        )}
      </section>

      <style>{`
        @keyframes bounce  {0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(10px)}}
        @keyframes slideUp {from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pulse   {0%,100%{opacity:.3}50%{opacity:.6}}
      `}</style>
    </div>
  );
}