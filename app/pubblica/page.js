'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ZONE = [
  'Centro Storico - Pirgo - Odescalchi',
  'Cisterna Faro - San Liborio',
  "Campo dell'Oro - San Gordiano",
  'Matteotti - Uliveto - Buonarroti',
  'San Pio - Cappuccini',
  'Borgata Aurelia - Pantano',
  'Boccelle',
]

const CONDIZIONI = [
  { valore: 'nuovo', label: 'Come nuovo', desc: 'Mai usato o quasi' },
  { valore: 'ottimo', label: 'Ottimo', desc: 'Usato pochissimo' },
  { valore: 'buono', label: 'Buono', desc: 'Normale usura' },
  { valore: 'discreto', label: 'Discreto', desc: 'Usura evidente' },
]

const GENERI = [
  { valore: 'maschio', label: '👦 Maschio' },
  { valore: 'femmina', label: '👧 Femmina' },
  { valore: 'unisex', label: '👶 Unisex' },
]

const TAGLIE_VESTITI = ['44','50','56','62','68','74','80','86','92','98','104','110','116','122','128','134','140','146','152','158','164']
const TAGLIE_SCARPE = ['16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38']
const ETA_OPTIONS = Array.from({ length: 15 }, (_, i) => i)

export default function PubblicaPage() {
  const [utente, setUtente] = useState(null)
  const [categorie, setCategorie] = useState([])
  const [loading, setLoading] = useState(false)
  const [successo, setSuccesso] = useState(false)
  const [errori, setErrori] = useState({})
  const [foto, setFoto] = useState([])
  const [anteprima, setAnteprima] = useState([])
  const [tipoTaglia, setTipoTaglia] = useState('vestiti')

  const [form, setForm] = useState({
    titolo: '',
    descrizione: '',
    categoria_id: '',
    prezzo: '',
    is_gratuito: false,
    eta: '',
    taglia: '',
    genere: '',
    zona: '',
    condizione: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) window.location.href = '/login'
      else setUtente(data.user)
    })
    fetchCategorie()
  }, [])

  async function fetchCategorie() {
    const { data } = await supabase.from('categorie').select('*').order('ordine')
    if (data) setCategorie(data)
  }

  function aggiornaForm(campo, valore) {
    setForm(prev => ({ ...prev, [campo]: valore }))
    setErrori(prev => ({ ...prev, [campo]: null }))
  }

  async function cropQuadrato(file) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const size = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 400
        const ctx = canvas.getContext('2d')
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 400, 400)
        canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function gestisciFoto(e) {
    const files = Array.from(e.target.files).slice(0, 5)
    const croppate = await Promise.all(files.map(cropQuadrato))
    setFoto(croppate)
    setAnteprima(croppate.map(f => URL.createObjectURL(f)))
  }

  async function caricaFoto(annuncioId) {
    for (let i = 0; i < foto.length; i++) {
      const file = foto[i]
      const ext = file.name.split('.').pop()
      const path = `${utente.id}/${annuncioId}/${i}.${ext}`
      const { data, error } = await supabase.storage.from('foto-annunci').upload(path, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('foto-annunci').getPublicUrl(path)
        await supabase.from('foto_annunci').insert({ annuncio_id: annuncioId, url: urlData.publicUrl, ordine: i })
      }
    }
  }

  function valida() {
    const nuoviErrori = {}
    if (!form.titolo.trim()) nuoviErrori.titolo = 'Il titolo è obbligatorio'
    if (!form.categoria_id) nuoviErrori.categoria_id = 'Seleziona una categoria'
    if (!form.condizione) nuoviErrori.condizione = 'Seleziona la condizione'
    if (!form.zona) nuoviErrori.zona = 'Seleziona la zona'
    if (!form.is_gratuito && !form.prezzo) nuoviErrori.prezzo = 'Inserisci un prezzo o seleziona "Regalo gratuito"'
    return nuoviErrori
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nuoviErrori = valida()
    if (Object.keys(nuoviErrori).length > 0) {
      setErrori(nuoviErrori)
      // Scroll al primo errore
      const primoErrore = Object.keys(nuoviErrori)[0]
      document.getElementById(primoErrore)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('annunci')
      .insert({
        user_id: utente.id,
        titolo: form.titolo,
        descrizione: form.descrizione,
        categoria_id: parseInt(form.categoria_id),
        prezzo: form.is_gratuito ? 0 : parseFloat(form.prezzo) || 0,
        is_gratuito: form.is_gratuito,
        eta_min: form.eta !== '' ? parseInt(form.eta) : null,
        eta_max: form.eta !== '' ? parseInt(form.eta) : null,
        taglia: form.taglia || null,
        genere: form.genere || null,
        zona: form.zona,
        condizione: form.condizione,
      })
      .select()
      .single()

    if (error) {
      setErrori({ generale: 'Errore: ' + error.message })
      setLoading(false)
      return
    }

    if (foto.length > 0) await caricaFoto(data.id)
    setSuccesso(true)
    setLoading(false)
  }

  if (successo) {
    return (
      <main style={{ minHeight: '100vh', background: '#FFFAF8', fontFamily: "'Baloo 2', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800;900&display=swap');`}</style>
        <div style={{ background: 'white', borderRadius: 28, padding: 40, textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#2D2D2D', marginBottom: 8 }}>Annuncio pubblicato!</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#AAA', marginBottom: 28, lineHeight: 1.6 }}>Il tuo annuncio è ora visibile a tutte le famiglie di Civitavecchia.</div>
          <button onClick={() => window.location.href = '/'} style={{ width: '100%', background: 'linear-gradient(135deg, #FF7575, #FF5252)', color: 'white', border: 'none', borderRadius: 16, padding: '16px', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
            Torna alla Home
          </button>
        </div>
      </main>
    )
  }

  const inputStyle = (campo) => ({
    width: '100%', background: '#F9F6F4',
    border: `2px solid ${errori[campo] ? '#FF6262' : '#F0EBE6'}`,
    borderRadius: 14, padding: '12px 16px', fontSize: 13, fontWeight: 600,
    color: '#2D2D2D', outline: 'none', fontFamily: "'Baloo 2', sans-serif", boxSizing: 'border-box'
  })
  const labelStyle = (obbligatorio) => ({
    display: 'block', fontSize: 11, fontWeight: 800, color: '#AAA',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  })
  const sectionStyle = { background: 'white', borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }
  const sectionTitle = (emoji, title, obbligatorio) => (
    <div style={{ fontSize: 14, fontWeight: 900, color: '#2D2D2D', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>{emoji}</span> {title}
      {obbligatorio && <span style={{ fontSize: 10, fontWeight: 900, color: '#FF6262', background: '#FFF0F0', padding: '2px 8px', borderRadius: 20 }}>obbligatorio</span>}
    </div>
  )
  const errorMsg = (campo) => errori[campo] && (
    <div style={{ fontSize: 11, fontWeight: 800, color: '#FF6262', marginTop: 6 }}>⚠️ {errori[campo]}</div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#FFFAF8', fontFamily: "'Baloo 2', sans-serif", paddingBottom: 40 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* HEADER */}
      <header style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#FF6262', fontFamily: "'Baloo 2', sans-serif" }}>← Indietro</button>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#2D2D2D' }}>Pubblica annuncio</div>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px' }}>
        <form onSubmit={handleSubmit}>

          {/* FOTO */}
          <div style={sectionStyle}>
            {sectionTitle('📷', 'Foto', false)}
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="file" accept="image/*" multiple onChange={gestisciFoto} style={{ display: 'none' }} />
              {anteprima.length === 0 ? (
                <div style={{ border: '2px dashed #F0EBE6', borderRadius: 16, height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 32 }}>📸</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#BBB' }}>Tocca per aggiungere foto</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#CCC' }}>Max 5 foto</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {anteprima.map((src, i) => (
                    <img key={i} src={src} style={{ height: 90, width: 90, objectFit: 'cover', borderRadius: 12, flexShrink: 0, border: i === 0 ? '3px solid #FF6262' : '3px solid transparent' }} />
                  ))}
                </div>
              )}
            </label>
          </div>

          {/* INFO BASE */}
          <div style={sectionStyle}>
            {sectionTitle('📝', 'Informazioni', false)}
            <div id="titolo" style={{ marginBottom: 14 }}>
              <label style={labelStyle()}>Titolo *</label>
              <input type="text" placeholder="es. Vestiti bambina 2-3 anni" value={form.titolo} onChange={e => aggiornaForm('titolo', e.target.value)} style={inputStyle('titolo')} />
              {errorMsg('titolo')}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle()}>Descrizione</label>
              <textarea placeholder="Descrivi l'oggetto, eventuali difetti, marca..." value={form.descrizione} onChange={e => aggiornaForm('descrizione', e.target.value)} rows={3} style={{ ...inputStyle(''), resize: 'none' }} />
            </div>
            <div id="categoria_id">
              <label style={labelStyle()}>Categoria *</label>
              <select value={form.categoria_id} onChange={e => aggiornaForm('categoria_id', e.target.value)} style={inputStyle('categoria_id')}>
                <option value="">Seleziona categoria</option>
                {categorie.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.nome}</option>
                ))}
              </select>
              {errorMsg('categoria_id')}
            </div>
          </div>

          {/* PREZZO */}
          <div style={sectionStyle}>
            {sectionTitle('💶', 'Prezzo', true)}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, cursor: 'pointer' }}>
              <div onClick={() => { aggiornaForm('is_gratuito', !form.is_gratuito); aggiornaForm('prezzo', '') }} style={{ width: 48, height: 26, borderRadius: 50, background: form.is_gratuito ? '#4ECDC4' : '#E0E0E0', display: 'flex', alignItems: 'center', padding: '0 3px', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', transform: form.is_gratuito ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: form.is_gratuito ? '#4ECDC4' : '#AAA' }}>Regalo gratuito 🎁</span>
            </label>
            {!form.is_gratuito && (
              <div id="prezzo" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#AAA', fontWeight: 800, fontSize: 14 }}>€</span>
                <input type="number" placeholder="0.00" value={form.prezzo} onChange={e => aggiornaForm('prezzo', e.target.value)} min="0" step="0.50" style={{ ...inputStyle('prezzo'), paddingLeft: 32 }} />
                {errorMsg('prezzo')}
              </div>
            )}
          </div>

          {/* DETTAGLI */}
          <div style={sectionStyle}>
            {sectionTitle('🔍', 'Dettagli', false)}

            {/* GENERE */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle()}>Genere</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {GENERI.map(g => (
                  <button key={g.valore} type="button" onClick={() => aggiornaForm('genere', form.genere === g.valore ? '' : g.valore)} style={{ flex: 1, padding: '10px 8px', borderRadius: 12, border: `2px solid ${form.genere === g.valore ? '#FF6262' : '#F0EBE6'}`, background: form.genere === g.valore ? '#FFF0F0' : '#F9F6F4', fontSize: 12, fontWeight: 800, color: form.genere === g.valore ? '#FF6262' : '#AAA', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ETÀ — menu a tendina */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle()}>Età</label>
              <select value={form.eta} onChange={e => aggiornaForm('eta', e.target.value)} style={inputStyle('')}>
                <option value="">Non specificata</option>
                {ETA_OPTIONS.map(e => (
                  <option key={e} value={e}>{e === 0 ? 'Neonato (0 anni)' : `${e} ${e === 1 ? 'anno' : 'anni'}`}</option>
                ))}
              </select>
            </div>

            {/* TAGLIA */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle()}>Taglia</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {['vestiti', 'scarpe'].map(t => (
                  <button key={t} type="button" onClick={() => { setTipoTaglia(t); aggiornaForm('taglia', '') }} style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 800, border: `2px solid ${tipoTaglia === t ? '#FF6262' : '#F0EBE6'}`, background: tipoTaglia === t ? '#FFF0F0' : '#F9F6F4', color: tipoTaglia === t ? '#FF6262' : '#AAA', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
                    {t === 'vestiti' ? '👕 Vestiti' : '👟 Scarpe'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(tipoTaglia === 'vestiti' ? TAGLIE_VESTITI : TAGLIE_SCARPE).map(t => (
                  <button key={t} type="button" onClick={() => aggiornaForm('taglia', form.taglia === t ? '' : t)} style={{ padding: '5px 12px', borderRadius: 50, fontSize: 11, fontWeight: 800, border: `2px solid ${form.taglia === t ? '#FF6262' : '#F0EBE6'}`, background: form.taglia === t ? '#FFF0F0' : '#F9F6F4', color: form.taglia === t ? '#FF6262' : '#AAA', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* CONDIZIONE */}
            <div id="condizione">
              <label style={labelStyle()}>Condizione *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CONDIZIONI.map(c => (
                  <button key={c.valore} type="button" onClick={() => aggiornaForm('condizione', c.valore)} style={{ padding: '10px 12px', borderRadius: 12, border: `2px solid ${form.condizione === c.valore ? '#FF6262' : errori.condizione ? '#FF6262' : '#F0EBE6'}`, background: form.condizione === c.valore ? '#FFF0F0' : '#F9F6F4', textAlign: 'left', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: form.condizione === c.valore ? '#FF6262' : '#2D2D2D' }}>{c.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#BBB', marginTop: 2 }}>{c.desc}</div>
                  </button>
                ))}
              </div>
              {errorMsg('condizione')}
            </div>
          </div>

          {/* ZONA */}
          <div style={sectionStyle}>
            {sectionTitle('📍', 'Zona di ritiro', true)}
            <div id="zona" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ZONE.map(z => (
                <button key={z} type="button" onClick={() => aggiornaForm('zona', z)} style={{ padding: '12px 16px', borderRadius: 14, border: `2px solid ${form.zona === z ? '#FF6262' : errori.zona ? '#FF6262' : '#F0EBE6'}`, background: form.zona === z ? '#FFF0F0' : '#F9F6F4', fontSize: 12, fontWeight: 800, color: form.zona === z ? '#FF6262' : '#AAA', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📍 {z}</span>
                  {form.zona === z && <span>✓</span>}
                </button>
              ))}
            </div>
            {errorMsg('zona')}
          </div>

          {/* ERRORE GENERALE */}
          {errori.generale && (
            <div style={{ background: '#FFF0F0', border: '2px solid #FFD0D0', borderRadius: 14, padding: '12px 16px', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#FF6262' }}>⚠️ {errori.generale}</span>
            </div>
          )}

          {/* SUBMIT */}
          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#F0EBE6' : 'linear-gradient(135deg, #FF7575, #FF5252)', color: loading ? '#BBB' : 'white', border: 'none', borderRadius: 18, padding: '18px', fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: loading ? 'none' : '0 6px 20px rgba(255,82,82,0.35)' }}>
            {loading ? 'Pubblicazione in corso...' : '🚀 Pubblica annuncio'}
          </button>

        </form>
      </div>
    </main>
  )
}