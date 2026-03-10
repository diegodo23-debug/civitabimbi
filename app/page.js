'use client'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function Home() {
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriaSelezionata, setCategoriaSelezionata] = useState(null)
  const [categorie, setCategorie] = useState([])
  const [utente, setUtente] = useState(null)
  const [ricerca, setRicerca] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUtente(data?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUtente(session?.user ?? null)
    })
    fetchCategorie()
    fetchAnnunci()
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetchAnnunci()
  }, [categoriaSelezionata])

  async function fetchCategorie() {
    const { data } = await supabase.from('categorie').select('*').order('ordine')
    if (data) setCategorie(data)
  }

  async function fetchAnnunci() {
    setLoading(true)
    let query = supabase
      .from('annunci_completi')
      .select('*')
      .order('created_at', { ascending: false })
    if (categoriaSelezionata) {
      query = query.eq('categoria_id', categoriaSelezionata)
    }
    const { data } = await query
    if (data) setAnnunci(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUtente(null)
  }

  // Emoji override per passeggini
  
  function getEmoji(cat) {
    return cat.emoji
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FFFAF8', fontFamily: "'Baloo 2', sans-serif" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* HEADER */}
      <header style={{
        background: 'white',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(145deg, #FF7575, #FF5252)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 3px 10px rgba(255,82,82,0.3)',
            }}>🏠</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FF6262', lineHeight: 1.1, letterSpacing: -0.5 }}>CivitaBimbi</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#AAA', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1 }}>Civitavecchia</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#FFF5F5', border: 'none', cursor: 'pointer',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🔔</button>
            {utente ? (
              <button onClick={handleLogout} style={{
                fontSize: 12, fontWeight: 800, color: '#AAA',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Baloo 2', sans-serif",
              }}>Esci</button>
            ) : (
              <button onClick={() => window.location.href = '/login'} style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#FFF5F5', border: 'none', cursor: 'pointer',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>👤</button>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

        {/* HERO */}
        <div style={{
          background: 'linear-gradient(135deg, #FF7575 0%, #FF8A50 100%)',
          borderRadius: 24, padding: '20px',
          marginTop: 16, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
              📍 Civitavecchia & dintorni
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>
              {utente ? 'Bentornato! 👋' : 'Scambia, vendi e regala'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 16 }}>
              Il mercatino dei bambini di Civitavecchia
            </div>
            {!utente && (
              <button
                onClick={() => window.location.href = '/login'}
                style={{
                  background: 'white', color: '#FF6262',
                  border: 'none', borderRadius: 50,
                  padding: '8px 20px', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                }}
              >Inizia gratis →</button>
            )}
          </div>
          {/* Orsacchiotto più visibile */}
          <div style={{
            position: 'absolute', right: -5, top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 80, opacity: 0.4, lineHeight: 1,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
          }}>🧸</div>
        </div>

        {/* SEARCH */}
        <div style={{
          background: 'white', borderRadius: 16,
          padding: '12px 16px', marginTop: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: 18, color: '#CCC' }}>🔍</span>
          <input
  type="text"
  placeholder="Cerca vestiti, giochi, libri..."
  value={ricerca}
  onChange={e => setRicerca(e.target.value)}
  style={{
    flex: 1, border: 'none', outline: 'none',
    fontSize: 14, fontWeight: 600, color: '#2D2D2D',
    background: 'transparent', fontFamily: "'Baloo 2', sans-serif",
  }}
/>
        </div>

        {/* CATEGORIE */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#2D2D2D', marginBottom: 12 }}>Categorie</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            <button
              onClick={() => setCategoriaSelezionata(null)}
              style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '12px 16px', borderRadius: 18,
                border: `2px solid ${!categoriaSelezionata ? '#FF6262' : 'transparent'}`,
                background: !categoriaSelezionata ? '#FFF0F0' : 'white',
                cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 24 }}>🏠</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#2D2D2D' }}>Tutti</span>
            </button>
            {categorie.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaSelezionata(cat.id)}
                style={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '12px 16px', borderRadius: 18,
                  border: `2px solid ${categoriaSelezionata === cat.id ? '#FF6262' : 'transparent'}`,
                  background: categoriaSelezionata === cat.id ? '#FFF0F0' : 'white',
                  cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ fontSize: 24 }}>{getEmoji(cat)}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#2D2D2D', whiteSpace: 'nowrap' }}>
                  {cat.nome.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ANNUNCI */}
        <div style={{ marginTop: 20, marginBottom: 100 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#2D2D2D', marginBottom: 12 }}>
            {categoriaSelezionata ? 'Annunci filtrati' : 'Annunci recenti'}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <div style={{ height: 160, background: '#F5F0EC' }} />
                  <div style={{ padding: 12 }}>
                    <div style={{ height: 12, background: '#F0EBE6', borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 12, background: '#F0EBE6', borderRadius: 6, width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : annunci.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#AAA', marginBottom: 6 }}>Nessun annuncio trovato</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#CCC', marginBottom: 20 }}>Sii il primo a pubblicare!</div>
              {!utente && (
                <button
                  onClick={() => window.location.href = '/login'}
                  style={{
                    background: 'linear-gradient(135deg, #FF7575, #FF5252)',
                    color: 'white', border: 'none', borderRadius: 50,
                    padding: '10px 24px', fontSize: 13, fontWeight: 800,
                    cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                  }}
                >Accedi per pubblicare</button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {annunci.filter(a => a.titolo.toLowerCase().includes(ricerca.toLowerCase())).map(annuncio => (
                <div
                  key={annuncio.id}
                  onClick={() => window.location.href = `/annuncio/${annuncio.id}`}
                  style={{
                    background: 'white', borderRadius: 20, overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', cursor: 'pointer',
                  }}
                >
                  {/* FOTO */}
                  <div style={{
                    height: 160,
                    background: 'linear-gradient(135deg, #FFF0EE, #FFE8E8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {annuncio.foto_principale ? (
                      <img
                        src={annuncio.foto_principale}
                        alt={annuncio.titolo}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'contain',
                          objectPosition: 'center',
                          padding: 8,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 44, opacity: 0.5 }}>{annuncio.categoria_emoji || '📦'}</span>
                    )}
                    {annuncio.taglia && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#FFD93D', color: '#2D2D2D',
                        fontSize: 10, fontWeight: 900,
                        padding: '2px 8px', borderRadius: 20,
                      }}>{annuncio.taglia}</div>
                    )}
                    {(annuncio.is_gratuito || annuncio.prezzo === 0) && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: '#4ECDC4', color: 'white',
                        fontSize: 10, fontWeight: 900,
                        padding: '2px 8px', borderRadius: 20,
                      }}>GRATIS</div>
                    )}
                  </div>
                  {/* INFO */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#2D2D2D', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {annuncio.titolo}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#BBB', marginBottom: 6 }}>
                      📍 {annuncio.zona || 'Civitavecchia'}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: annuncio.is_gratuito || annuncio.prezzo === 0 ? '#4ECDC4' : '#FF6262' }}>
                      {annuncio.is_gratuito || annuncio.prezzo === 0 ? 'Gratis' : `${annuncio.prezzo} €`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #F5F0EC',
        zIndex: 50, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 16px' }}>
          {[{ icon: '🏠', label: 'Home', href: '/', active: true }, { icon: '🔍', label: 'Esplora', href: '/esplora', active: false }].map(item => (
            <button key={item.label} onClick={() => window.location.href = item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Baloo 2', sans-serif",
            }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: item.active ? '#FF6262' : '#BBB' }}>{item.label}</span>
            </button>
          ))}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
  <button
    onClick={() => utente ? window.location.href = '/pubblica' : window.location.href = '/login'}
    style={{
      width: 48, height: 48, borderRadius: '50%',
      background: 'linear-gradient(145deg, #FF7575, #FF5252)',
      border: 'none', cursor: 'pointer', fontSize: 24, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(255,82,82,0.4)',
    }}
  >+</button>
  <span style={{ fontSize: 10, fontWeight: 800, color: '#FF6262', marginTop: 2 }}>Vendi</span>
</div>
          {[{ icon: '💬', label: 'Messaggi', href: '/messaggi' }, { icon: '👤', label: 'Profilo', href: utente ? '/profilo' : '/login' }].map(item => (
            <button key={item.label} onClick={() => window.location.href = item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Baloo 2', sans-serif",
            }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#BBB' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

    </main>
  )
}
