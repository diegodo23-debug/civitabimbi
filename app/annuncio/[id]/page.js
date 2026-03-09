'use client'
import { use } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const CONDIZIONE_LABEL = {
  nuovo: { label: 'Nuovo', color: 'bg-green-100 text-green-600' },
  ottimo: { label: 'Ottimo', color: 'bg-teal-100 text-teal-600' },
  buono: { label: 'Buono', color: 'bg-blue-100 text-blue-600' },
  discreto: { label: 'Discreto', color: 'bg-yellow-100 text-yellow-600' },
}

export default function AnnuncioPage({ params: paramsPromise }) {
    const params = use(paramsPromise)
  const [annuncio, setAnnuncio] = useState(null)
  const [foto, setFoto] = useState([])
  const [venditore, setVenditore] = useState(null)
  const [utente, setUtente] = useState(null)
  const [fotoAttiva, setFotoAttiva] = useState(0)
  const [loading, setLoading] = useState(true)
  const [preferito, setPreferito] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUtente(data?.user ?? null)
    })
    fetchAnnuncio()
  }, [])

  async function fetchAnnuncio() {
    const { data: ann, error: annError } = await supabase
      .from('annunci')
      .select('*')
      .eq('id', params.id)
      .single()

    console.log('fetch annuncio id:', params.id, 'risultato:', ann, 'errore:', annError)

    if (!ann) {
      console.log('annuncio non trovato, id:', params.id)
      window.location.href = '/'
      return
    }
    setAnnuncio(ann)

    // Incrementa visualizzazioni
    await supabase
      .from('annunci')
      .update({ visualizzazioni: (ann.visualizzazioni || 0) + 1 })
      .eq('id', ann.id)

    // Foto
    const { data: fotoData } = await supabase
      .from('foto_annunci')
      .select('*')
      .eq('annuncio_id', ann.id)
      .order('ordine')
    if (fotoData) setFoto(fotoData)

    // Venditore
    const { data: vend } = await supabase
      .from('profiles')
      .select('id, nome, zona, avatar_url, created_at')
      .eq('id', ann.user_id)
      .single()
    if (vend) setVenditore(vend)

    // Categoria
    const { data: cat } = await supabase
      .from('categorie')
      .select('nome, emoji')
      .eq('id', ann.categoria_id)
      .single()
    if (cat) setAnnuncio(prev => ({ ...prev, categoria_nome: cat.nome, categoria_emoji: cat.emoji }))

    setLoading(false)
  }

  async function togglePreferito() {
    if (!utente) {
      window.location.href = '/login'
      return
    }
    if (preferito) {
      await supabase.from('preferiti').delete()
        .eq('user_id', utente.id)
        .eq('annuncio_id', params.id)
      setPreferito(false)
    } else {
      await supabase.from('preferiti').insert({
        user_id: utente.id,
        annuncio_id: params.id,
      })
      setPreferito(true)
    }
  }

  function apriWhatsApp() {
    if (!venditore) return
    const testo = encodeURIComponent(
      `Ciao! Ho visto il tuo annuncio su CivitaBimbi: "${annuncio.titolo}". È ancora disponibile?`
    )
    window.open(`https://wa.me/?text=${testo}`, '_blank')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-4xl animate-bounce">🧸</div>
      </main>
    )
  }

  if (!annuncio) return null

  const condizione = CONDIZIONE_LABEL[annuncio.condizione] || CONDIZIONE_LABEL.buono

  return (
    <main className="min-h-screen bg-orange-50 pb-32">

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="text-red-400 font-bold text-sm">
            ← Indietro
          </button>
          <button
            onClick={togglePreferito}
            className="text-2xl"
          >
            {preferito ? '❤️' : '🤍'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">

        {/* FOTO */}
        <div className="bg-gray-100 relative">
          <div className="h-72 flex items-center justify-center overflow-hidden">
            {foto.length > 0 ? (
              <img
                src={foto[fotoAttiva]?.url}
                alt={annuncio.titolo}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-8xl opacity-30">{annuncio.categoria_emoji || '📦'}</span>
            )}
          </div>

          {/* Miniature foto */}
          {foto.length > 1 && (
            <div className="flex gap-2 px-4 py-3 bg-white overflow-x-auto">
              {foto.map((f, i) => (
                <img
                  key={i}
                  src={f.url}
                  onClick={() => setFotoAttiva(i)}
                  className={`h-14 w-14 object-cover rounded-xl cursor-pointer flex-shrink-0 ${
                    fotoAttiva === i ? 'ring-2 ring-red-400' : 'opacity-60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-5">

          {/* TITOLO E PREZZO */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-xl font-black text-gray-800 leading-tight flex-1">
              {annuncio.titolo}
            </h1>
            <p className={`text-2xl font-black flex-shrink-0 ${
              annuncio.is_gratuito || annuncio.prezzo === 0 ? 'text-teal-500' : 'text-red-500'
            }`}>
              {annuncio.is_gratuito || annuncio.prezzo === 0 ? 'Gratis' : `${annuncio.prezzo} €`}
            </p>
          </div>

          {/* BADGES */}
          <div className="flex flex-wrap gap-2 mb-5">
            {annuncio.categoria_nome && (
              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                {annuncio.categoria_emoji} {annuncio.categoria_nome}
              </span>
            )}
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${condizione.color}`}>
              {condizione.label}
            </span>
            {annuncio.taglia && (
              <span className="bg-yellow-100 text-yellow-600 text-xs font-bold px-3 py-1 rounded-full">
                Taglia {annuncio.taglia}
              </span>
            )}
            {(annuncio.eta_min || annuncio.eta_max) && (
              <span className="bg-purple-100 text-purple-600 text-xs font-bold px-3 py-1 rounded-full">
                {annuncio.eta_min && annuncio.eta_max
                  ? `${annuncio.eta_min}-${annuncio.eta_max} anni`
                  : annuncio.eta_min
                  ? `Da ${annuncio.eta_min} anni`
                  : `Fino a ${annuncio.eta_max} anni`}
              </span>
            )}
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
              📍 {annuncio.zona || 'Civitavecchia'}
            </span>
          </div>

          {/* DESCRIZIONE */}
          {annuncio.descrizione && (
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Descrizione</h3>
              <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                {annuncio.descrizione}
              </p>
            </div>
          )}

          {/* VENDITORE */}
          {venditore && (
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Venditore</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-300 to-orange-300 rounded-full flex items-center justify-center text-white font-black text-lg">
                  {venditore.avatar_url ? (
                    <img src={venditore.avatar_url} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    venditore.nome?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-black text-gray-800">{venditore.nome}</p>
                  {venditore.zona && (
                    <p className="text-xs text-gray-400 font-semibold">📍 {venditore.zona}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* INFO EXTRA */}
          <div className="flex items-center gap-2 text-xs text-gray-300 font-semibold">
            <span>👁 {annuncio.visualizzazioni || 0} visualizzazioni</span>
            <span>·</span>
            <span>
              Pubblicato il {new Date(annuncio.created_at).toLocaleDateString('it-IT', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </span>
          </div>

        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto">
          {utente?.id === annuncio.user_id ? (
            <div className="bg-gray-100 rounded-2xl py-4 text-center">
              <p className="text-sm font-bold text-gray-400">Questo è il tuo annuncio</p>
            </div>
          ) : (
            <button
              onClick={apriWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">💬</span>
              Contatta su WhatsApp
            </button>
          )}
        </div>
      </div>

    </main>
  )
}