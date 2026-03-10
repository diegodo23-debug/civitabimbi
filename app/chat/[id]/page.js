'use client'

import { useEffect, useState, useRef, use } from 'react'
import { supabase } from '../../lib/supabase'

export default function ChatPage({ params: paramsPromise, searchParams: searchParamsPromise }) {
  const params = use(paramsPromise)
  const searchParams = use(searchParamsPromise)
  const conversazioneId = params.id
  const annuncioId = searchParams.annuncio
  const altroUtenteId = searchParams.altro

  const [messaggi, setMessaggi] = useState([])
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')
  const [utente, setUtente] = useState(null)
  const [altroUtente, setAltroUtente] = useState(null)
  const [annuncio, setAnnuncio] = useState(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { window.location.href = '/login'; return }
      setUtente(data.user)
      fetchDati(data.user.id)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messaggi])

  async function fetchDati(userId) {
    setLoading(true)

    if (annuncioId) {
      const { data: ann } = await supabase
        .from('annunci_completi')
        .select('titolo, foto_principale, user_id')
        .eq('id', annuncioId)
        .single()
      setAnnuncio(ann)
    }

    let altroId = altroUtenteId
    if (!altroId) {
      const { data: msg } = await supabase
        .from('messaggi')
        .select('mittente_id, destinatario_id')
        .eq('conversazione_id', conversazioneId)
        .limit(1)
        .single()
      if (msg) {
        altroId = msg.mittente_id === userId ? msg.destinatario_id : msg.mittente_id
      }
    }

    if (altroId) {
      const { data: profilo } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .eq('id', altroId)
        .single()
      setAltroUtente(profilo)
    }

    await fetchMessaggi(userId)
    setLoading(false)
  }

  async function fetchMessaggi(userId) {
    const uid = userId || utente?.id
    const { data } = await supabase
      .from('messaggi')
      .select('*')
      .eq('conversazione_id', conversazioneId)
      .order('created_at', { ascending: true })
    setMessaggi(data || [])

    await supabase
      .from('messaggi')
      .update({ letto: true })
      .eq('conversazione_id', conversazioneId)
      .eq('destinatario_id', uid)
      .eq('letto', false)
  }

  async function inviaMessaggio() {
    if (!nuovoMessaggio.trim() || !utente || !altroUtente) return

    const testo = nuovoMessaggio.trim()
    setNuovoMessaggio('')

    const { data: msgData, error } = await supabase.from('messaggi').insert({
      conversazione_id: conversazioneId,
      mittente_id: utente.id,
      destinatario_id: altroUtente.id,
      annuncio_id: annuncioId,
      testo,
      letto: false,
    })

    console.log('insert result:', msgData, 'error:', JSON.stringify(error))

    if (!error) {
      await fetchMessaggi(utente.id)
      await supabase.from('notifiche').insert({
        user_id: altroUtente.id,
        tipo: 'messaggio',
        messaggio: 'Nuovo messaggio ricevuto 💬',
        annuncio_id: annuncioId,
      })
    }
  }

  function tempoFa(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    const ore = Math.floor(diff / 3600000)
    if (min < 1) return 'Adesso'
    if (min < 60) return `${min} min fa`
    if (ore < 24) return `${ore} ore fa`
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#FFFAF8', fontFamily: "'Baloo 2', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800;900&display=swap');`}</style>

      <header style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.location.href = '/messaggi'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#FF6262', fontFamily: "'Baloo 2', sans-serif", flexShrink: 0 }}>←</button>

          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7575, #FF5252)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {altroUtente?.avatar_url ? (
              <img src={altroUtente.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>{altroUtente?.nome?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#2D2D2D' }}>{altroUtente?.nome || 'Utente'}</div>
            {annuncio && (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FF6262', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                re: {annuncio.titolo}
              </div>
            )}
          </div>

          {annuncio?.foto_principale && (
            <img
              src={annuncio.foto_principale}
              onClick={() => window.location.href = `/annuncio/${annuncioId}`}
              style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', background: '#F5F5F5', cursor: 'pointer', flexShrink: 0 }}
            />
          )}
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#CCC', fontWeight: 700 }}>Caricamento...</div>
        ) : messaggi.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#AAA' }}>Inizia la conversazione!</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#CCC', marginTop: 4 }}>Scrivi un messaggio per contattare il venditore</div>
          </div>
        ) : (
          messaggi.map(m => {
            const isMio = m.mittente_id === utente?.id
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMio ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%',
                  background: isMio ? 'linear-gradient(135deg, #FF7575, #FF5252)' : 'white',
                  color: isMio ? 'white' : '#2D2D2D',
                  borderRadius: isMio ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  padding: '10px 14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{m.testo}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginTop: 4, textAlign: isMio ? 'right' : 'left' }}>
                    {tempoFa(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ background: 'white', borderTop: '1px solid #F5F0EC', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, background: '#F9F6F4', borderRadius: 20, padding: '10px 16px', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Scrivi un messaggio..."
              value={nuovoMessaggio}
              onChange={e => setNuovoMessaggio(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && inviaMessaggio()}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#2D2D2D', fontFamily: "'Baloo 2', sans-serif" }}
            />
          </div>
          <button
            onClick={inviaMessaggio}
            disabled={!nuovoMessaggio.trim()}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: nuovoMessaggio.trim() ? 'linear-gradient(135deg, #FF7575, #FF5252)' : '#F0EBE6',
              border: 'none', cursor: nuovoMessaggio.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
              boxShadow: nuovoMessaggio.trim() ? '0 4px 12px rgba(255,82,82,0.35)' : 'none',
            }}
          >➤</button>
        </div>
      </div>

    </main>
  )
}