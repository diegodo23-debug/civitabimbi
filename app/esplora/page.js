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
  { valore: 'nuovo', label: 'Come nuovo' },
  { valore: 'ottimo', label: 'Ottimo' },
  { valore: 'buono', label: 'Buono' },
  { valore: 'discreto', label: 'Discreto' },
]

const TAGLIE_VESTITI = ['44','50','56','62','68','74','80','86','92','98','104','110','116','122','128','134','140','146','152','158','164']
const TAGLIE_SCARPE = ['16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38']
const GENERI = ['Tutti', 'Maschio', 'Femmina', 'Unisex']

function TagButton({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 50, fontSize: 11, fontWeight: 800,
      border: `2px solid ${selected ? '#FF6262' : '#F0EBE6'}`,
      background: selected ? '#FFF0F0' : 'white',
      color: selected ? '#FF6262' : '#AAA',
      cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
      transition: 'all 0.15s',
    }}>{label}</button>
  )
}

export default function EsploraPage() {
  const [annunci, setAnnunci] = useState([])
  const [categorie, setCategorie] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [tipoTaglia, setTipoTaglia] = useState('vestiti')

  const [filtri, setFiltri] = useState({
    ricerca: '',
    categoria_id: null,
    zone: [],        // array
    condizioni: [],  // array
    taglie: [],      // array
    prezzo_max: '',
    eta: '',
    solo_gratis: false,
    genere: 'Tutti',
  })

  useEffect(() => { fetchCategorie(); fetchAnnunci() }, [])
  useEffect(() => { fetchAnnunci() }, [filtri])

  async function fetchCategorie() {
    const { data } = await supabase.from('categorie').select('*').order('ordine')
    if (data) setCategorie(data)
  }

  async function fetchAnnunci() {
    setLoading(true)
    let query = supabase.from('annunci_completi').select('*').order('created_at', { ascending: false })

    if (filtri.categoria_id) query = query.eq('categoria_id', filtri.categoria_id)
    if (filtri.zone.length > 0) query = query.in('zona', filtri.zone)
    if (filtri.condizioni.length > 0) query = query.in('condizione', filtri.condizioni)
    if (filtri.taglie.length > 0) query = query.in('taglia', filtri.taglie)
    if (filtri.prezzo_max) query = query.lte('prezzo', parseFloat(filtri.prezzo_max))
    if (filtri.solo_gratis) query = query.eq('is_gratuito', true)
    if (filtri.eta) {
      query = query.lte('eta_min', parseInt(filtri.eta))
      query = query.gte('eta_max', parseInt(filtri.eta))
    }

    const { data } = await query
    let risultati = data || []
    if (filtri.ricerca) {
      risultati = risultati.filter(a => a.titolo.toLowerCase().includes(filtri.ricerca.toLowerCase()))
    }
    setAnnunci(risultati)
    setLoading(false)
  }

  function toggleArray(campo, valore) {
    setFiltri(prev => {
      const arr = prev[campo]
      return { ...prev, [campo]: arr.includes(valore) ? arr.filter(v => v !== valore) : [...arr, valore] }
    })
  }

  function aggiornafiltri(campo, valore) {
    setFiltri(prev => ({ ...prev, [campo]: valore }))
  }

  function resetFiltri() {
    setFiltri({ ricerca: '', categoria_id: null, zone: [], condizioni: [], taglie: [], prezzo_max: '', eta: '', solo_gratis: false, genere: 'Tutti' })
  }

  const filtriAttivi = filtri.categoria_id || filtri.zone.length > 0 || filtri.condizioni.length > 0 || filtri.taglie.length > 0 || filtri.prezzo_max || filtri.eta || filtri.solo_gratis || filtri.genere !== 'Tutti'

  const sectionTitle = (label, count) => (
    <div style={{ fontSize: 12, fontWeight: 800, color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {label}
      {count > 0 && <span style={{ background: '#FF6262', color: 'white', fontSize: 10, fontWeight: 900, padding: '1px 7px', borderRadius: 20 }}>{count}</span>}
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#FFFAF8', fontFamily: "'Baloo 2', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* HEADER */}
      <header style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#FF6262', fontFamily: "'Baloo 2', sans-serif" }}>← Home</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#2D2D2D' }}>Esplora</div>
          {filtriAttivi ? (
            <button onClick={resetFiltri} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#AAA', fontFamily: "'Baloo 2', sans-serif" }}>Reset</button>
          ) : <div style={{ width: 40 }} />}
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

        {/* RICERCA */}
        <div style={{ background: 'white', borderRadius: 16, padding: '12px 16px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: 18, color: '#CCC' }}>🔍</span>
          <input type="text" placeholder="Cerca vestiti, giochi, libri..." value={filtri.ricerca} onChange={e => aggiornafiltri('ricerca', e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#2D2D2D', background: 'transparent', fontFamily: "'Baloo 2', sans-serif" }} />
          {filtri.ricerca && <button onClick={() => aggiornafiltri('ricerca', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#CCC' }}>✕</button>}
        </div>

        {/* BOTTONE FILTRI */}
        <button onClick={() => setFiltersOpen(!filtersOpen)} style={{ width: '100%', marginTop: 10, background: filtriAttivi ? '#FFF0F0' : 'white', border: `2px solid ${filtriAttivi ? '#FF6262' : '#F0EBE6'}`, borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚙️</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: filtriAttivi ? '#FF6262' : '#AAA' }}>Filtri {filtriAttivi ? '(attivi)' : ''}</span>
          </div>
          <span style={{ fontSize: 12, color: '#CCC' }}>{filtersOpen ? '▲' : '▼'}</span>
        </button>

        {/* PANNELLO FILTRI */}
        {filtersOpen && (
          <div style={{ background: 'white', borderRadius: 20, padding: 20, marginTop: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>

            {/* CATEGORIE */}
            <div style={{ marginBottom: 20 }}>
              {sectionTitle('Categoria', 0)}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <TagButton label="Tutte" selected={!filtri.categoria_id} onClick={() => aggiornafiltri('categoria_id', null)} />
                {categorie.map(cat => (
                  <TagButton key={cat.id} label={`${cat.emoji} ${cat.nome}`} selected={filtri.categoria_id === cat.id} onClick={() => aggiornafiltri('categoria_id', cat.id)} />
                ))}
              </div>
            </div>

            {/* GENERE */}
            <div style={{ marginBottom: 20 }}>
              {sectionTitle('Genere', 0)}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GENERI.map(g => (
                  <TagButton key={g} label={g === 'Maschio' ? '👦 Maschio' : g === 'Femmina' ? '👧 Femmina' : g === 'Unisex' ? '👶 Unisex' : '✨ Tutti'} selected={filtri.genere === g} onClick={() => aggiornafiltri('genere', g)} />
                ))}
              </div>
            </div>

            {/* TAGLIA — MULTIPLA */}
            <div style={{ marginBottom: 20 }}>
              {sectionTitle('Taglia', filtri.taglie.length)}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {['vestiti', 'scarpe'].map(t => (
                  <button key={t} onClick={() => { setTipoTaglia(t) }} style={{ padding: '6px 16px', borderRadius: 50, fontSize: 12, fontWeight: 800, border: `2px solid ${tipoTaglia === t ? '#FF6262' : '#F0EBE6'}`, background: tipoTaglia === t ? '#FFF0F0' : 'white', color: tipoTaglia === t ? '#FF6262' : '#AAA', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
                    {t === 'vestiti' ? '👕 Vestiti' : '👟 Scarpe'}
                  </button>
                ))}
                {filtri.taglie.length > 0 && (
                  <button onClick={() => aggiornafiltri('taglie', [])} style={{ padding: '6px 12px', borderRadius: 50, fontSize: 11, fontWeight: 800, border: '2px solid #F0EBE6', background: 'white', color: '#CCC', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>✕ Deseleziona</button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(tipoTaglia === 'vestiti' ? TAGLIE_VESTITI : TAGLIE_SCARPE).map(t => (
                  <TagButton key={t} label={t} selected={filtri.taglie.includes(t)} onClick={() => toggleArray('taglie', t)} />
                ))}
              </div>
            </div>

            {/* CONDIZIONE — MULTIPLA */}
            <div style={{ marginBottom: 20 }}>
              {sectionTitle('Condizione', filtri.condizioni.length)}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CONDIZIONI.map(c => (
                  <TagButton key={c.valore} label={c.label} selected={filtri.condizioni.includes(c.valore)} onClick={() => toggleArray('condizioni', c.valore)} />
                ))}
              </div>
            </div>

            {/* ZONA — MULTIPLA */}
            <div style={{ marginBottom: 20 }}>
              {sectionTitle('Zona', filtri.zone.length)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ZONE.map(z => (
                  <button key={z} onClick={() => toggleArray('zone', z)} style={{ padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, border: `2px solid ${filtri.zone.includes(z) ? '#FF6262' : '#F0EBE6'}`, background: filtri.zone.includes(z) ? '#FFF0F0' : 'white', color: filtri.zone.includes(z) ? '#FF6262' : '#AAA', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>📍 {z}</span>
                    {filtri.zone.includes(z) && <span style={{ fontSize: 14 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* PREZZO + GRATIS */}
            <div>
              {sectionTitle('Prezzo', 0)}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#AAA', fontWeight: 800 }}>€</span>
                  <input type="number" placeholder="Prezzo max" value={filtri.prezzo_max} onChange={e => aggiornafiltri('prezzo_max', e.target.value)} style={{ width: '100%', paddingLeft: 28, paddingRight: 12, paddingTop: 10, paddingBottom: 10, color: '#2D2D2D', border: '2px solid #F0EBE6', borderRadius: 12, fontSize: 13, fontWeight: 700, outline: 'none', fontFamily: "'Baloo 2', sans-serif", boxSizing: 'border-box' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div onClick={() => aggiornafiltri('solo_gratis', !filtri.solo_gratis)} style={{ width: 44, height: 24, borderRadius: 50, background: filtri.solo_gratis ? '#4ECDC4' : '#E0E0E0', display: 'flex', alignItems: 'center', padding: '0 3px', cursor: 'pointer' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', transform: filtri.solo_gratis ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: filtri.solo_gratis ? '#4ECDC4' : '#AAA' }}>Solo gratis</span>
                </label>
              </div>
            </div>

          </div>
        )}

        {/* RISULTATI */}
        <div style={{ marginTop: 16, marginBottom: 100 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#AAA', marginBottom: 12 }}>
            {loading ? 'Ricerca in corso...' : `${annunci.length} annunci trovati`}
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
              <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#AAA', marginBottom: 6 }}>Nessun risultato</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#CCC', marginBottom: 20 }}>Prova a cambiare i filtri</div>
              <button onClick={resetFiltri} style={{ background: 'linear-gradient(135deg, #FF7575, #FF5252)', color: 'white', border: 'none', borderRadius: 50, padding: '10px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>Reset filtri</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {annunci.map(annuncio => (
                <div key={annuncio.id} onClick={() => window.location.href = `/annuncio/${annuncio.id}`} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                  <div style={{ height: 160, background: 'linear-gradient(135deg, #FFF0EE, #FFE8E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {annuncio.foto_principale ? (
                      <img src={annuncio.foto_principale} alt={annuncio.titolo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                    ) : (
                      <span style={{ fontSize: 44, opacity: 0.5 }}>{annuncio.categoria_emoji || '📦'}</span>
                    )}
                    {annuncio.taglia && <div style={{ position: 'absolute', top: 8, right: 8, background: '#FFD93D', color: '#2D2D2D', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20 }}>{annuncio.taglia}</div>}
                    {(annuncio.is_gratuito || annuncio.prezzo === 0) && <div style={{ position: 'absolute', top: 8, left: 8, background: '#4ECDC4', color: 'white', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20 }}>GRATIS</div>}
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#2D2D2D', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{annuncio.titolo}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#BBB', marginBottom: 6 }}>📍 {annuncio.zona || 'Civitavecchia'}</div>
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
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #F5F0EC', zIndex: 50, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 16px' }}>
          {[{ icon: '🏠', label: 'Home', href: '/', active: false }, { icon: '🔍', label: 'Esplora', href: '/esplora', active: true }].map(item => (
            <button key={item.label} onClick={() => window.location.href = item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: item.active ? '#FF6262' : '#BBB' }}>{item.label}</span>
            </button>
          ))}
          <button onClick={() => window.location.href = '/pubblica'} style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(145deg, #FF7575, #FF5252)', border: 'none', cursor: 'pointer', fontSize: 26, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -20, boxShadow: '0 6px 20px rgba(255,82,82,0.4)' }}>+</button>
          {[{ icon: '💬', label: 'Messaggi', href: '/messaggi' }, { icon: '👤', label: 'Profilo', href: '/profilo' }].map(item => (
            <button key={item.label} onClick={() => window.location.href = item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#BBB' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

    </main>
  )
}