'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ZONE = ['Centro', 'Porto', 'Aurelia', 'Civitavecchia Nord', 'Civitavecchia Sud', 'Ladispoli', 'Santa Marinella', 'Cerveteri', 'Tarquinia']
const CONDIZIONI = [
  { valore: 'nuovo', label: 'Nuovo', desc: 'Mai usato' },
  { valore: 'ottimo', label: 'Ottimo', desc: 'Usato pochissimo' },
  { valore: 'buono', label: 'Buono', desc: 'Normale usura' },
  { valore: 'discreto', label: 'Discreto', desc: 'Usura evidente' },
]

export default function PubblicaPage() {
  const [utente, setUtente] = useState(null)
  const [categorie, setCategorie] = useState([])
  const [loading, setLoading] = useState(false)
  const [successo, setSuccesso] = useState(false)
  const [errore, setErrore] = useState(null)
  const [foto, setFoto] = useState([])
  const [anteprima, setAnteprima] = useState([])

  const [form, setForm] = useState({
    titolo: '',
    descrizione: '',
    categoria_id: '',
    prezzo: '',
    is_gratuito: false,
    eta_min: '',
    eta_max: '',
    taglia: '',
    zona: '',
    condizione: 'buono',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        window.location.href = '/login'
      } else {
        setUtente(data.user)
      }
    })
    fetchCategorie()
  }, [])

  async function fetchCategorie() {
    const { data } = await supabase.from('categorie').select('*').order('ordine')
    if (data) setCategorie(data)
  }

  function aggiornaForm(campo, valore) {
    setForm(prev => ({ ...prev, [campo]: valore }))
    setErrore(null)
  }

  function gestisciFoto(e) {
    const files = Array.from(e.target.files).slice(0, 5)
    setFoto(files)
    const previews = files.map(f => URL.createObjectURL(f))
    setAnteprima(previews)
  }

  async function caricaFoto(annuncioId) {
    for (let i = 0; i < foto.length; i++) {
      const file = foto[i]
      const ext = file.name.split('.').pop()
      const path = `${utente.id}/${annuncioId}/${i}.${ext}`
      const { data, error } = await supabase.storage
        .from('foto-annunci')
        .upload(path, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('foto-annunci')
          .getPublicUrl(path)
        await supabase.from('foto_annunci').insert({
          annuncio_id: annuncioId,
          url: urlData.publicUrl,
          ordine: i,
        })
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrore(null)

    if (!form.titolo || !form.categoria_id || !form.zona) {
      setErrore('Compila almeno titolo, categoria e zona.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('annunci')
      .insert({
        user_id: utente.id,
        titolo: form.titolo,
        descrizione: form.descrizione,
        categoria_id: parseInt(form.categoria_id),
        prezzo: form.is_gratuito ? 0 : parseFloat(form.prezzo) || 0,
        is_gratuito: form.is_gratuito,
        eta_min: form.eta_min ? parseInt(form.eta_min) : null,
        eta_max: form.eta_max ? parseInt(form.eta_max) : null,
        taglia: form.taglia || null,
        zona: form.zona,
        condizione: form.condizione,
      })
      .select()
      .single()

    if (error) {
      setErrore('Errore durante la pubblicazione. Riprova.')
      setLoading(false)
      return
    }

    if (foto.length > 0) {
      await caricaFoto(data.id)
    }

    setSuccesso(true)
    setLoading(false)
  }

  if (successo) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-sm">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-black text-gray-800 mb-2">Annuncio pubblicato!</h2>
          <p className="text-gray-400 text-sm font-semibold mb-6">
            Il tuo annuncio è ora visibile a tutte le famiglie di Civitavecchia.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-red-400 to-orange-400 text-white font-black py-4 rounded-xl"
          >
            Torna alla Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-orange-50 pb-12">

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="text-red-400 font-bold text-sm">
            ← Indietro
          </button>
          <h2 className="text-base font-black text-gray-800">Pubblica annuncio</h2>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>

          {/* FOTO */}
          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-3">📷 Foto</h3>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={gestisciFoto}
                className="hidden"
              />
              {anteprima.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl h-32 flex flex-col items-center justify-center gap-2 hover:border-red-300 transition-colors">
                  <span className="text-3xl">📸</span>
                  <p className="text-xs font-bold text-gray-400">Tocca per aggiungere foto</p>
                  <p className="text-xs text-gray-300 font-semibold">Max 5 foto</p>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {anteprima.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      className={`h-24 w-24 object-cover rounded-xl flex-shrink-0 ${i === 0 ? 'ring-2 ring-red-400' : ''}`}
                    />
                  ))}
                  <div className="h-24 w-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl text-gray-300">+</span>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* INFO BASE */}
          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4">📝 Informazioni</h3>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Titolo *</label>
              <input
                type="text"
                placeholder="es. Vestiti bambina 2-3 anni"
                value={form.titolo}
                onChange={e => aggiornaForm('titolo', e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Descrizione</label>
              <textarea
                placeholder="Descrivi l'oggetto, eventuali difetti, marca..."
                value={form.descrizione}
                onChange={e => aggiornaForm('descrizione', e.target.value)}
                rows={3}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300 resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Categoria *</label>
              <select
                value={form.categoria_id}
                onChange={e => aggiornaForm('categoria_id', e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300"
              >
                <option value="">Seleziona categoria</option>
                {categorie.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* PREZZO */}
          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4">💶 Prezzo</h3>

            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <div
                onClick={() => aggiornaForm('is_gratuito', !form.is_gratuito)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${form.is_gratuito ? 'bg-teal-400' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_gratuito ? 'translate-x-6' : ''}`} />
              </div>
              <span className="text-sm font-bold text-gray-700">Regalo gratuito</span>
            </label>

            {!form.is_gratuito && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.prezzo}
                  onChange={e => aggiornaForm('prezzo', e.target.value)}
                  min="0"
                  step="0.50"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300"
                />
              </div>
            )}
          </div>

          {/* DETTAGLI */}
          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4">🔍 Dettagli</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Età min</label>
                <input
                  type="number"
                  placeholder="anni"
                  value={form.eta_min}
                  onChange={e => aggiornaForm('eta_min', e.target.value)}
                  min="0" max="14"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Età max</label>
                <input
                  type="number"
                  placeholder="anni"
                  value={form.eta_max}
                  onChange={e => aggiornaForm('eta_max', e.target.value)}
                  min="0" max="14"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Taglia</label>
              <input
                type="text"
                placeholder="es. 104, Taglia 4A, Nr. 28"
                value={form.taglia}
                onChange={e => aggiornaForm('taglia', e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Condizione</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDIZIONI.map(c => (
                  <button
                    key={c.valore}
                    type="button"
                    onClick={() => aggiornaForm('condizione', c.valore)}
                    className={`py-2.5 px-3 rounded-xl border-2 text-left transition-all ${
                      form.condizione === c.valore
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-black text-gray-800">{c.label}</p>
                    <p className="text-xs text-gray-400 font-semibold">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ZONA */}
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4">📍 Zona di ritiro *</h3>
            <div className="flex flex-wrap gap-2">
              {ZONE.map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => aggiornaForm('zona', z)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                    form.zona === z
                      ? 'border-red-400 bg-red-50 text-red-500'
                      : 'border-gray-100 bg-gray-50 text-gray-600'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* ERRORE */}
          {errore && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-red-500 text-sm font-bold">⚠️ {errore}</p>
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-400 to-orange-400 text-white font-black py-4 rounded-2xl text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Pubblicazione in corso...' : '🚀 Pubblica annuncio'}
          </button>

        </form>
      </div>
    </main>
  )
}