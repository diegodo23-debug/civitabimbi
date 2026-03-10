'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PreferitiPage() {
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)
  const [utente, setUtente] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { window.location.href = '/login'; return }
      setUtente(data.user)
      fetchPreferiti(data.user.id)
    })
  }, [])

  async function fetchPreferiti(userId) {
    setLoading(true)
    const { data } = await supabase
      .from('preferiti')
      .select('annuncio_id')
      .eq('user_id', userId)

    if (!data || data.length === 0) { setAnnunci([]); setLoading(false); return }

    const ids = data.map(p => p.annuncio_id)
    const { data: annunciData } = await supabase
      .from('annunci_completi')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })

    setAnnunci(annunciData || [])
    setLoading(false)
  }

  async function rimuoviPreferito(e, annuncioId) {
    e.stopPropagation()
    await supabase.from('preferiti').delete().eq('user_id', utente.id).eq('annuncio_id', annuncioId)
    setAnnunci(prev => prev.filter(a => a.id !== annuncioId))
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FFFAF8', fontFamily: "'Baloo 2', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* HEADER */}
      <header style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#FF6262', fontFamily: "'Baloo 2', sans-serif" }}>← Home</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#2D2D2D' }}>❤️ I miei preferiti</div>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px', paddingBottom: 100 }}>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 160px))', gap: 8, padding: '0 8px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ height: 150, background: '#F5F0EC' }} />
                <div style={{ padding: 12 }}>
                  <div style={{ height: 12, background: '#F0EBE6', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#F0EBE6', borderRadius: 6, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : annunci.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🤍</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#AAA', marginBottom: 8 }}>Nessun preferito</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#CCC', marginBottom: 24 }}>Aggiungi articoli ai preferiti toccando il cuore ❤️</div>
            <button onClick={() => window.location.href = '/'} style={{ background: 'linear-gradient(135deg, #FF7575, #FF5252)', color: 'white', border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
              Sfoglia annunci
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#AAA', marginBottom: 12 }}>{annunci.length} articoli salvati</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 160px))', gap: 8, padding: '0 8px' }}>
              {annunci.map(annuncio => (
                <div
                  key={annuncio.id}
                  onClick={() => window.location.href = `/annuncio/${annuncio.id}`}
                  style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                >
                  <div style={{ height: 150, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <button
                      onClick={(e) => rimuoviPreferito(e, annuncio.id)}
                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    >❤️</button>
                    {annuncio.foto_principale ? (
                      <img src={annuncio.foto_principale} alt={annuncio.titolo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 0 }} />
                    ) : (
                      <span style={{ fontSize: 44, opacity: 0.5 }}>{annuncio.categoria_emoji || '📦'}</span>
                    )}
                    {(annuncio.is_gratuito || annuncio.prezzo === 0) && (
                      <div style={{ position: 'absolute', top: 8, left: 8, background: '#4ECDC4', color: 'white', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20 }}>GRATIS</div>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#2D2D2D', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{annuncio.titolo}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#BBB', marginBottom: 6, height: 32, overflow: 'hidden' }}>📍 {annuncio.zona || 'Civitavecchia'}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: annuncio.is_gratuito || annuncio.prezzo === 0 ? '#4ECDC4' : '#FF6262' }}>
                      {annuncio.is_gratuito || annuncio.prezzo === 0 ? 'Gratis' : `${annuncio.prezzo} €`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}