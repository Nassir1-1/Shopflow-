'use client';
import { useEffect, useState } from 'react';
import { getCart, removeFromCart, placeOrder } from '../lib/api';
import { useRouter } from 'next/navigation';
import { useMode } from '../lib/useMode';
import PageBg from '../components/PageBg';

export default function CartPage() {
  const { t, isClassic } = useMode();
  const [cart,        setCart]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [address,     setAddress]     = useState('');
  const [card, setCard] = useState({ number:'', name:'', expiry:'', cvv:'' });
  const router = useRouter();

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try   { const r = await getCart(); setCart(r.data); }
    catch { showToast('Please login to view cart'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (id) => { await removeFromCart(id); fetchCart(); };

  const handleOrder = async () => {
    if (!address) return showToast('Please enter delivery address');
    try {
      await placeOrder({ adresseLivraison: address });
      showToast('🎉 Order placed!');
      setTimeout(() => router.push('/orders'), 2000);
    } catch { showToast('Error — please login first'); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const total = cart?.lignes?.reduce((s,i) => s+(i.product?.prix*i.quantite),0)||0;

  return (
    <div style={{ minHeight:'100vh', fontFamily:t.fontBody,
      position:'relative', color:t.textPrimary }}>

      {/* ── Shared blurred background — mode-aware ── */}
      <PageBg />

      <div style={{ position:'relative', zIndex:2,
        maxWidth:900, margin:'0 auto', padding:'40px 24px' }}>

        {toast && <div className="toast">{toast}</div>}

        <button onClick={()=>router.push('/products')} style={{
          background:'transparent', border:`1px solid ${t.accent}66`,
          color:t.accent, padding:'8px 20px', borderRadius:8,
          cursor:'pointer', fontSize:13, marginBottom:32,
          fontFamily:t.fontBody, transition:'all .2s',
        }}
        onMouseOver={e=>e.currentTarget.style.background=`${t.accent}18`}
        onMouseOut={e=>e.currentTarget.style.background='transparent'}>
          ← Back to {isClassic?'Gallery':'Studio'}
        </button>

        <h1 style={{ fontSize:28, fontWeight:800, margin:'0 0 32px',
          fontFamily:t.fontGalleryTitle, color:t.textPrimary,
          textShadow:`0 0 40px ${t.accentGlow}` }}>
          🛒 Your Cart
        </h1>

        {loading ? (
          <p style={{color:'rgba(255,255,255,0.4)',fontFamily:t.fontBody}}>Loading...</p>
        ) : !cart?.lignes?.length ? (
          <div style={{textAlign:'center',padding:'80px 0',color:'rgba(255,255,255,0.35)'}}>
            <div style={{fontSize:72,marginBottom:16}}>🛒</div>
            <p style={{fontSize:18,marginBottom:24,color:t.textPrimary,fontFamily:t.fontTitle}}>
              Your cart is empty
            </p>
            <button onClick={()=>router.push('/products')} style={{
              padding:'12px 32px',background:t.accentGrad,
              color:isClassic?'#1a0e00':'white',border:'none',borderRadius:12,
              fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:t.fontBody}}>
              Browse {isClassic?'Gallery':'Studio'} →
            </button>
          </div>
        ) : (
          <div style={{display:'flex',gap:32,flexWrap:'wrap',alignItems:'flex-start'}}>

            <div style={{flex:1,minWidth:300}}>
              {cart.lignes.map(item=>(
                <div key={item.id} style={{
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:20, background:t.cardBg, backdropFilter:'blur(14px)',
                  border:`1px solid ${t.cardBorder}`, borderRadius:t.cardRadius,
                  marginBottom:12, transition:'border-color .2s',
                }}
                onMouseOver={e=>e.currentTarget.style.borderColor=t.cardBorderHover}
                onMouseOut={e=>e.currentTarget.style.borderColor=t.cardBorder}>
                  <div style={{display:'flex',gap:14,alignItems:'center'}}>
                    {item.product?.images&&(
                      <img src={item.product.images} alt={item.product.nom}
                        style={{width:60,height:60,borderRadius:isClassic?8:4,
                          objectFit:'cover',border:`1px solid ${t.cardBorder}`}}/>
                    )}
                    <div>
                      <p style={{margin:0,fontWeight:700,color:t.textPrimary,
                        fontSize:14,fontFamily:t.fontTitle}}>{item.product?.nom}</p>
                      <p style={{margin:'3px 0 0',color:'rgba(255,255,255,0.4)',
                        fontSize:12,fontFamily:t.fontBody}}>
                        Qty: {item.quantite} × {item.product?.prix?.toLocaleString()} TND
                      </p>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <span style={{fontWeight:700,color:t.accent,fontSize:16,fontFamily:t.fontBody}}>
                      {(item.product?.prix*item.quantite).toFixed(2)} TND
                    </span>
                    <button onClick={()=>handleRemove(item.id)} style={{
                      padding:'6px 14px',background:'rgba(239,68,68,0.15)',
                      color:'#f87171',border:'1px solid rgba(239,68,68,0.3)',
                      borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,
                      transition:'all .2s',fontFamily:t.fontBody}}
                    onMouseOver={e=>{e.currentTarget.style.background='rgba(239,68,68,0.35)';e.currentTarget.style.color='#fff'}}
                    onMouseOut={e=>{e.currentTarget.style.background='rgba(239,68,68,0.15)';e.currentTarget.style.color='#f87171'}}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div style={{background:t.cardBg,backdropFilter:'blur(16px)',
                border:`1px solid ${t.cardBorder}`,borderRadius:t.cardRadius,padding:24,marginTop:8}}>
                {[['Subtotal',`${total.toFixed(2)} TND`],['Delivery','7.00 TND']].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                    <span style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:t.fontBody}}>{l}</span>
                    <span style={{color:t.textPrimary,fontSize:14,fontFamily:t.fontBody}}>{v}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',
                  borderTop:`1px solid ${t.cardBorder}`,paddingTop:14,marginTop:4}}>
                  <span style={{fontWeight:700,fontSize:18,color:t.textPrimary,fontFamily:t.fontTitle}}>Total</span>
                  <span style={{fontWeight:800,fontSize:22,color:t.accent,fontFamily:t.fontBody,
                    textShadow:`0 0 20px ${t.accentGlow}`}}>
                    {(total+7).toFixed(2)} TND
                  </span>
                </div>

                <input placeholder="Delivery address..." value={address}
                  onChange={e=>setAddress(e.target.value)}
                  style={{width:'100%',padding:'12px 16px',borderRadius:10,marginTop:18,
                    border:`1px solid ${t.cardBorder}`,background:'rgba(255,255,255,0.06)',
                    color:'white',fontSize:14,outline:'none',boxSizing:'border-box',
                    fontFamily:t.fontBody,transition:'border-color .2s'}}
                  onFocus={e=>e.target.style.borderColor=t.accent}
                  onBlur={e=>e.target.style.borderColor=t.cardBorder}/>

                <button onClick={()=>setShowPayment(true)} style={{
                  width:'100%',marginTop:14,padding:'14px',background:t.accentGrad,
                  color:isClassic?'#1a0e00':'white',border:'none',borderRadius:12,
                  fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:t.fontBody,
                  boxShadow:`0 8px 24px ${t.accentGlow}`,transition:'all .2s'}}
                onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
                onMouseOut={e=>e.currentTarget.style.transform=''}>
                  Proceed to Payment 💳
                </button>
              </div>
            </div>

            {showPayment&&(
              <div style={{minWidth:300,maxWidth:360}}>
                <div style={{background:'rgba(10,10,20,0.88)',backdropFilter:'blur(20px)',
                  border:`1px solid ${t.cardBorder}`,borderRadius:t.cardRadius+4,
                  padding:'28px 24px',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
                  <p style={{textAlign:'center',color:t.textPrimary,fontSize:17,
                    fontWeight:700,margin:'0 0 20px',fontFamily:t.fontTitle}}>
                    💳 Payment Details
                  </p>
                  {[{p:'Card number',m:19,ty:'text',v:card.number,k:'number'},
                    {p:'Cardholder name',m:50,ty:'text',v:card.name,k:'name'}].map(f=>(
                    <input key={f.k} placeholder={f.p} maxLength={f.m} type={f.ty} value={f.v}
                      onChange={e=>setCard({...card,[f.k]:e.target.value})}
                      style={{width:'100%',padding:'11px 14px',marginBottom:12,
                        background:'rgba(255,255,255,0.07)',border:`1px solid ${t.cardBorder}`,
                        borderRadius:10,color:'white',fontSize:14,outline:'none',
                        boxSizing:'border-box',fontFamily:t.fontBody,transition:'border-color .2s'}}
                      onFocus={e=>e.target.style.borderColor=t.accent}
                      onBlur={e=>e.target.style.borderColor=t.cardBorder}/>
                  ))}
                  <div style={{display:'flex',gap:10,marginBottom:20}}>
                    {[{p:'MM/YY',m:5,ty:'text',v:card.expiry,k:'expiry'},
                      {p:'CVV',m:3,ty:'password',v:card.cvv,k:'cvv'}].map(f=>(
                      <input key={f.k} placeholder={f.p} maxLength={f.m} type={f.ty} value={f.v}
                        onChange={e=>setCard({...card,[f.k]:e.target.value})}
                        style={{flex:1,padding:'11px 14px',background:'rgba(255,255,255,0.07)',
                          border:`1px solid ${t.cardBorder}`,borderRadius:10,color:'white',
                          fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:t.fontBody}}
                        onFocus={e=>e.target.style.borderColor=t.accent}
                        onBlur={e=>e.target.style.borderColor=t.cardBorder}/>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setShowPayment(false)} style={{
                      flex:1,padding:'12px',background:'rgba(255,255,255,0.08)',
                      border:`1px solid ${t.cardBorder}`,color:'rgba(255,255,255,0.6)',
                      borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:14,
                      fontFamily:t.fontBody}}>Cancel</button>
                    <button onClick={handleOrder} style={{
                      flex:2,padding:'12px',background:t.accentGrad,
                      color:isClassic?'#1a0e00':'white',border:'none',borderRadius:10,
                      fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:t.fontBody,
                      boxShadow:`0 6px 20px ${t.accentGlow}`}}>
                      Pay {(total+7).toFixed(2)} TND
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}