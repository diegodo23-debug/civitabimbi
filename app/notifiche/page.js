'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NotifichePage() {
  const [notifiche, setNotifiche] = useState([])
  const [loading, setLoading] = useState(true)
  const [utente, setUtente] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { window.location.href = '/login'; return }
      setUtente(data.user)
      fetchNotifiche(data.user.id)
    })
  }, [])

  async function fetchNotifiche(userId) {
    setLoading(true)
    const { data } = await supabase
      .from('notifiche')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setNotifiche(data || [])
    setLoading(false)

    // Segna tutte come lette
    await supabase
      .from('notifiche')
      .update({ letta: true })
      .eq('user_id', userId)
      .eq('letta', false)
  }

  async function eliminaNotifica(id) {
    await supabase.from('notifiche').delete().eq('id', id)
    setNotifiche(prev => prev.filter(n => n.id !== id))
  }

  async function eliminaTutte() {
    if (!utente) return
    await supabase.from('notifiche').delete().eq('user_id', utente.id)
    setNotifiche([])
  }

  function tempoFa(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    const ore = Math.floor(diff / 3600000)
    const giorni = Math.floor(diff / 86400000)
    if (min < 1) return 'Adesso'
    if (min < 60) return `${min} min fa`
    if (ore < 24) return `${ore} ore fa`
    return `${giorni} giorni fa`
  }

  function iconaTipo(tipo) {
    if (tipo === 'preferito') return '❤️'
    if (tipo === 'messaggio') return '💬'
    return '🔔'
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FFFAF8', fontFamily: "'Baloo 2', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* HEADER */}
      <header style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#FF6262', fontFamily: "'Baloo 2', sans-serif" }}>← Home</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#2D2D2D' }}>🔔 Notifiche</div>
          {notifiche.length > 0 ? (
            <button onClick={eliminaTutte} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#AAA', fontFamily: "'Baloo 2', sans-serif" }}>Elimina tutte</button>
          ) : <div style={{ width: 80 }} />}
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px', paddingBottom: 100 }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 20, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ height: 14, background: '#F0EBE6', borderRadius: 6, marginBottom: 8, width: '80%' }} />
                <div style={{ height: 12, background: '#F0EBE6', borderRadius: 6, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : notifiche.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#AAA', marginBottom: 8 }}>Nessuna notifica</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#CCC' }}>Le notifiche appariranno qui</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifiche.map(n => (
              <div
                key={n.id}
                onClick={() => n.annuncio_id && (window.location.href = `/annuncio/${n.annuncio_id}`)}
                style={{
                  background: n.letta ? 'white' : '#FFF5F5',
                  borderRadius: 20, padding: '14px 16px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  cursor: n.annuncio_id ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 14,
                  border: n.letta ? 'none' : '2px solid #FFE0E0',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {iconaTipo(n.tipo)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#2D2D2D', marginBottom: 3 }}>{n.messaggio}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#BBB' }}>{tempoFa(n.created_at)}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); eliminaNotifica(n.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#DDD', padding: 4 }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}