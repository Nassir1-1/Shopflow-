'use client';
import { useEffect, useState, useCallback } from 'react';
import { getProducts, addToCart } from '../lib/api';
import { useRouter } from 'next/navigation';
import PageBg from '../components/PageBg';

const BOOK_BG = [
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&auto=format&fit=crop',
  
];

const CATEGORIES = [
  {key:'all',label:'All Books',icon:'📚'},
  {key:'novel',label:'Novels',icon:'📖'},
  {key:'science',label:'Science',icon:'🔬'},
  {key:'history',label:'History',icon:'🏛️'},
  {key:'art',label:'Art Books',icon:'🎨'},
  {key:'children',label:'Children',icon:'🧒'},
];

export default function BooksPage() {
  const router = useRouter();
  const [books,    setBooks]    = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [cat,      setCat]      = useState('all');
  const [toast,    setToast]    = useState('');
  const [sort,     setSort]     = useState('newest');

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await getProducts(0, 'BOOK');
      setBooks(res.data || []);
      setFiltered(res.data || []);
    } catch { setBooks([]); }
    finally   { setLoading(false); }
  };

  /* Filter + sort */
  useEffect(() => {
    let list = [...books];
    if (cat !== 'all') {
      list = list.filter(b => b.description?.toLowerCase().includes(cat));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.nom?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      );
    }
    if (sort === 'price-asc')  list.sort((a,b) => a.prix - b.prix);
    if (sort === 'price-desc') list.sort((a,b) => b.prix - a.prix);
    if (sort === 'newest')     list.sort((a,b) => new Date(b.dateCreation) - new Date(a.dateCreation));
    setFiltered(list);
  }, [books, search, cat, sort]);

  const handleAdd = async (e, id) => {
    e.stopPropagation();
    try { await addToCart(id, 1); showToast('📚 Added to cart!'); }
    catch { showToast('⚠️ Login first'); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),2500); };

  return (
    <div style={{minHeight:'100vh',fontFamily:"'Segoe UI',sans-serif",
      position:'relative',color:'white'}}>

      {/* Books-specific background */}
      <PageBg forceImages={BOOK_BG} />

      {toast && <div className="toast">{toast}</div>}

      <div style={{position:'relative',zIndex:2,
        maxWidth:1200,margin:'0 auto',padding:'40px 24px'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32,flexWrap:'wrap'}}>
          <button onClick={()=>router.push('/')} style={{
            background:'transparent',border:'1px solid rgba(59,130,246,0.4)',
            color:'#3b82f6',padding:'7px 16px',borderRadius:8,
            cursor:'pointer',fontSize:13}}>
            ← Home
          </button>
          <div>
            <p style={{fontSize:12,textTransform:'uppercase',letterSpacing:'0.12em',
              color:'#3b82f6',margin:'0 0 4px',fontWeight:700}}>📚 SHOPFLOW LIBRARY</p>
            <h1 style={{fontSize:32,fontWeight:900,margin:0,color:'#f0f9ff',
              textShadow:'0 0 40px rgba(59,130,246,0.3)'}}>
              Book Collection
            </h1>
          </div>
          <button onClick={()=>router.push('/books/upload')} style={{
            marginLeft:'auto',padding:'10px 24px',
            background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
            color:'white',border:'none',borderRadius:12,
            fontSize:14,fontWeight:700,cursor:'pointer',
            boxShadow:'0 4px 16px rgba(59,130,246,0.4)'}}>
            📤 Sell a Book
          </button>
        </div>

        {/* Category pills */}
        <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
          {CATEGORIES.map(({key,label,icon})=>(
            <button key={key} onClick={()=>setCat(key)} style={{
              padding:'7px 18px',borderRadius:30,border:'none',cursor:'pointer',
              fontSize:13,fontWeight:600,transition:'all .2s',
              background:cat===key?'linear-gradient(135deg,#1d4ed8,#3b82f6)':'rgba(255,255,255,0.08)',
              color:cat===key?'white':'rgba(255,255,255,0.5)',
              boxShadow:cat===key?'0 4px 12px rgba(59,130,246,0.4)':'none',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Search + sort bar */}
        <div style={{display:'flex',gap:12,marginBottom:32,flexWrap:'wrap'}}>
          <input
            placeholder="Search by title, author, ISBN..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{flex:1,minWidth:200,padding:'12px 18px',
              background:'rgba(255,255,255,0.07)',
              border:'1px solid rgba(255,255,255,0.12)',
              borderRadius:12,color:'white',fontSize:14,outline:'none',
              transition:'border-color .2s'}}
            onFocus={e=>e.target.style.borderColor='#3b82f6'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}
          />
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{
            padding:'12px 16px',background:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:12,color:'white',fontSize:13,outline:'none',cursor:'pointer'}}>
            <option value="newest" style={{background:'#111'}}>Newest First</option>
            <option value="price-asc" style={{background:'#111'}}>Price: Low → High</option>
            <option value="price-desc" style={{background:'#111'}}>Price: High → Low</option>
          </select>
          <button style={{
            padding:'12px 24px',background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
            color:'white',border:'none',borderRadius:12,
            fontSize:14,fontWeight:700,cursor:'pointer'}}>
            Search
          </button>
        </div>

        <p style={{color:'rgba(255,255,255,0.35)',fontSize:13,marginBottom:24}}>
          {filtered.length} book{filtered.length!==1?'s':''} found
        </p>

        {/* Grid */}
        {loading ? (
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {[1,2,3,4,5,6].map(i=>(
              <div key={i} style={{width:180,height:280,borderRadius:12,
                background:'rgba(255,255,255,0.05)',animation:'pulse 1.5s infinite'}}/>
            ))}
          </div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:'center',padding:'80px 0',color:'rgba(255,255,255,0.35)'}}>
            <div style={{fontSize:72,marginBottom:16}}>📚</div>
            <h3 style={{color:'#f0f9ff',marginBottom:8}}>No books found</h3>
            <p style={{marginBottom:24}}>
              {search?'Try a different search term':'Be the first to list a book!'}
            </p>
            <button onClick={()=>router.push('/books/upload')} style={{
              padding:'12px 28px',
              background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
              color:'white',border:'none',borderRadius:12,
              fontSize:14,fontWeight:700,cursor:'pointer'}}>
              List Your Book →
            </button>
          </div>
        ) : (
          <div style={{display:'flex',flexWrap:'wrap',gap:20}}>
            {filtered.map(book=>{
              const hasPromo=book.prixPromo&&book.prixPromo<book.prix;
              const authorM=book.description?.match(/Author:\s*(.+)/);
              const yearM  =book.description?.match(/Year:\s*(\d{4})/);
              const pagesM =book.description?.match(/Pages:\s*(\d+)/);
              return (
                <div key={book.id}
                  onClick={()=>router.push(`/books/${book.id}`)}
                  style={{
                    width:180,background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(59,130,246,0.15)',
                    borderRadius:12,overflow:'hidden',cursor:'pointer',
                    backdropFilter:'blur(10px)',transition:'all .3s',
                    display:'flex',flexDirection:'column'}}
                  onMouseOver={e=>{
                    e.currentTarget.style.transform='translateY(-8px)';
                    e.currentTarget.style.borderColor='rgba(59,130,246,0.5)';
                    e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.5)';
                  }}
                  onMouseOut={e=>{
                    e.currentTarget.style.transform='';
                    e.currentTarget.style.borderColor='rgba(59,130,246,0.15)';
                    e.currentTarget.style.boxShadow='';
                  }}>
                  {/* Book cover */}
                  <div style={{height:200,overflow:'hidden',
                    background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
                    position:'relative'}}>
                    {book.images?(
                      <img src={book.images.split(',')[0]?.trim()} alt={book.nom}
                        style={{width:'100%',height:'100%',objectFit:'cover',
                          transition:'transform .4s'}}
                        onMouseOver={e=>e.target.style.transform='scale(1.05)'}
                        onMouseOut={e=>e.target.style.transform='scale(1)'}/>
                    ):(
                      <div style={{height:'100%',display:'flex',flexDirection:'column',
                        alignItems:'center',justifyContent:'center',gap:8,padding:12}}>
                        <span style={{fontSize:40}}>📖</span>
                        <p style={{color:'rgba(255,255,255,0.6)',fontSize:11,
                          textAlign:'center',fontWeight:700}}>{book.nom}</p>
                      </div>
                    )}
                    {hasPromo&&(
                      <div style={{position:'absolute',top:8,right:8,
                        background:'#ef4444',color:'white',
                        fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:12}}>
                        SALE
                      </div>
                    )}
                    {pagesM&&(
                      <div style={{position:'absolute',bottom:8,right:8,
                        background:'rgba(0,0,0,0.7)',color:'rgba(255,255,255,0.7)',
                        fontSize:10,padding:'2px 7px',borderRadius:8}}>
                        {pagesM[1]} pp
                      </div>
                    )}
                  </div>

                  <div style={{padding:12,flex:1,display:'flex',flexDirection:'column',gap:6}}>
                    <p style={{margin:0,fontWeight:700,fontSize:13,color:'#f0f9ff',
                      display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',
                      overflow:'hidden',lineHeight:1.4}}>
                      {book.nom}
                    </p>
                    {authorM&&(
                      <p style={{margin:0,fontSize:11,color:'#93c5fd',fontStyle:'italic'}}>
                        {authorM[1].trim()}{yearM?`, ${yearM[1]}`:''}
                      </p>
                    )}
                    <div style={{display:'flex',justifyContent:'space-between',
                      alignItems:'center',marginTop:'auto'}}>
                      <span style={{fontSize:13,fontWeight:800,color:'#3b82f6'}}>
                        {(hasPromo?book.prixPromo:book.prix)?.toLocaleString()} TND
                      </span>
                      <div onClick={e=>handleAdd(e,book.id)} style={{
                        width:26,height:26,borderRadius:6,
                        background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        color:'white',cursor:'pointer',fontSize:16,fontWeight:700,
                        transition:'transform .2s'}}
                      onMouseOver={e=>e.currentTarget.style.transform='scale(1.2)'}
                      onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
                        +
                      </div>
                    </div>
                    <p style={{textAlign:'center',color:'#3b82f6',fontSize:10,
                      margin:'4px 0 0',opacity:0.6}}>
                      📖 Read preview →
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .toast{position:fixed;bottom:24px;right:24px;background:rgba(20,20,30,0.95);
          backdrop-filter:blur(12px);color:white;padding:14px 20px;border-radius:12px;
          font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:9999;
          border:1px solid rgba(255,255,255,0.1);animation:slideUp .3s ease;}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:.3}50%{opacity:.6}}
      `}</style>
    </div>
  );
}