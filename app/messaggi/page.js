'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MessaggiPage() {
  const [conversazioni, setConversazioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [utente, setUtente] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { window.location.href = '/login'; return }
      setUtente(data.user)
      fetchConversazioni(data.user.id)
    })
  }, [])

  async function fetchConversazioni(userId) {
    setLoading(true)

    const { data: messaggi } = await supabase
      .from('messaggi')
      .select('*')
      .or(`mittente_id.eq.${userId},destinatario_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!messaggi || messaggi.length === 0) { setConversazioni([]); setLoading(false); return }

    // Raggruppa per conversazione_id
    const convMap = {}
    for (const m of messaggi) {
      if (!convMap[m.conversazione_id]) {
        convMap[m.conversazione_id] = m
      }
    }

    // Per ogni conversazione carica l'altro utente e l'annuncio
    const convList = await Promise.all(Object.values(convMap).map(async (m) => {
      const altroId = m.mittente_id === userId ? m.destinatario_id : m.mittente_id

      const { data: profilo } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', altroId)
        .single()

      const { data: annuncio } = await supabase
        .from('annunci_completi')
        .select('titolo, foto_principale')
        .eq('id', m.annuncio_id)
        .single()

      const { count: nonLetti } = await supabase
        .from('messaggi')
        .select('*', { count: 'exact', head: true })
        .eq('conversazione_id', m.conversazione_id)
        .eq('destinatario_id', userId)
        .eq('letto', false)

      return {
        conversazione_id: m.conversazione_id,
        annuncio_id: m.annuncio_id,
        altro_utente: profilo,
        annuncio: annuncio,
        ultimo_messaggio: m.testo,
        created_at: m.created_at,
        non_letti: nonLetti || 0,
      }
    }))

    setConversazioni(convList)
    setLoading(false)
  }

  function tempoFa(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    const ore = Math.floor(diff / 3600000)
    const giorni = Math.floor(diff / 86400000)
    if (min < 1) return 'Adesso'
    if (min < 60) return `${min} min fa`
    if (ore < 24) return `${ore} ore fa`
    return `${giorni}g fa`
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FFFAF8', fontFamily: "'Baloo 2', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* HEADER */}
      <header style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#FF6262', fontFamily: "'Baloo 2', sans-serif" }}>← Home</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#2D2D2D' }}>💬 Messaggi</div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px', paddingBottom: 100 }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 20, padding: 16, display: 'flex', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F0EBE6', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, background: '#F0EBE6', borderRadius: 6, marginBottom: 8, width: '60%' }} />
                  <div style={{ height: 12, background: '#F0EBE6', borderRadius: 6, width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : conversazioni.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#AAA', marginBottom: 8 }}>Nessun messaggio</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#CCC', marginBottom: 24 }}>Contatta un venditore da un annuncio per iniziare una chat</div>
            <button onClick={() => window.location.href = '/'} style={{ background: 'linear-gradient(135deg, #FF7575, #FF5252)', color: 'white', border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
              Sfoglia annunci
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conversazioni.map(conv => (
              <div
                key={conv.conversazione_id}
                onClick={() => window.location.href = `/chat/${conv.conversazione_id}?annuncio=${conv.annuncio_id}`}
                style={{
                  background: 'white', borderRadius: 20, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)', cursor: 'pointer',
                  border: conv.non_letti > 0 ? '2px solid #FFE0E0' : '2px solid transparent',
                }}
              >
                {/* AVATAR */}
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7575, #FF5252)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                  {conv.altro_utente?.avatar_url ? (
                    <img src={conv.altro_utente.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 20, color: 'white' }}>{conv.altro_utente?.nome?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>

                {/* INFO */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#2D2D2D' }}>{conv.altro_utente?.nome || 'Utente'}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#CCC' }}>{tempoFa(conv.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#FF6262', marginBottom: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    re: {conv.annuncio?.titolo || 'Annuncio'}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#AAA', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {conv.ultimo_messaggio}
                  </div>
                </div>

                {/* BADGE NON LETTI */}
                {conv.non_letti > 0 && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FF6262', color: 'white', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {conv.non_letti}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #F5F0EC', zIndex: 50, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 16px' }}>
          {[{ icon: '🏠', label: 'Home', href: '/' }, { icon: '🔍', label: 'Esplora', href: '/esplora' }].map(item => (
            <button key={item.label} onClick={() => window.location.href = item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#BBB' }}>{item.label}</span>
            </button>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
            <button onClick={() => window.location.href = '/pubblica'} style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(145deg, #FF7575, #FF5252)', border: 'none', cursor: 'pointer', fontSize: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(255,82,82,0.4)' }}>+</button>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#FF6262', marginTop: 2 }}>Vendi</span>
          </div>
          {[{ icon: '💬', label: 'Messaggi', href: '/messaggi', active: true }, { icon: '👤', label: 'Profilo', href: '/profilo' }].map(item => (
            <button key={item.label} onClick={() => window.location.href = item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: item.active ? '#FF6262' : '#BBB' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

    </main>
  )
}