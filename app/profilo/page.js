'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfiloPage() {
  const [utente, setUtente] = useState(null)
  const [profilo, setProfilo] = useState(null)
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvataggio, setSalvataggio] = useState(false)
  const [successo, setSuccesso] = useState(false)
  const [tab, setTab] = useState('annunci') // 'annunci' o 'impostazioni'

  const [form, setForm] = useState({
    nome: '',
    zona: '',
    bio: '',
  })

  const ZONE = [
  'Centro Storico - Pirgo - Odescalchi',
  'Cisterna Faro - San Liborio',
  "Campo dell'Oro - San Gordiano",
  'Matteotti - Uliveto - Buonarroti',
  'San Pio - Cappuccini',
  'Borgata Aurelia - Pantano',
  'Boccelle',
]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        window.location.href = '/login'
      } else {
        setUtente(data.user)
        fetchProfilo(data.user.id)
        fetchAnnunci(data.user.id)
      }
    })
  }, [])

  async function fetchProfilo(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfilo(data)
      setForm({
        nome: data.nome || '',
        zona: data.zona || '',
        bio: data.bio || '',
      })
    }
    setLoading(false)
  }

  async function fetchAnnunci(userId) {
    const { data } = await supabase
      .from('annunci')
      .select('*, categorie(nome, emoji)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setAnnunci(data)
  }

  async function salvaProfilo() {
    setSalvataggio(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        nome: form.nome,
        zona: form.zona,
        bio: form.bio,
      })
      .eq('id', utente.id)

    if (!error) {
      setSuccesso(true)
      setTimeout(() => setSuccesso(false), 3000)
      setProfilo(prev => ({ ...prev, ...form }))
    }
    setSalvataggio(false)
  }

  async function cambiaStatoAnnuncio(annuncioId, nuovoStato) {
    await supabase
      .from('annunci')
      .update({ stato: nuovoStato })
      .eq('id', annuncioId)
    fetchAnnunci(utente.id)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-4xl animate-bounce">🧸</div>
      </main>
    )
  }

  const annunciAttivi = annunci.filter(a => a.stato === 'attivo')
  const annunciArchiviati = annunci.filter(a => a.stato !== 'attivo')

  return (
    <main className="min-h-screen bg-orange-50 pb-24">

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => window.location.href = '/'} className="text-red-400 font-bold text-sm">
            ← Home
          </button>
          <h2 className="text-base font-black text-gray-800">Il mio profilo</h2>
          <button onClick={handleLogout} className="text-xs font-bold text-gray-400 hover:text-red-400">
            Esci
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* AVATAR E INFO */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-300 to-orange-300 rounded-full flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
            {profilo?.nome?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-gray-800">{profilo?.nome || 'Utente'}</h2>
            {profilo?.zona && (
              <p className="text-sm text-gray-400 font-semibold">📍 {profilo.zona}</p>
            )}
            {profilo?.bio && (
              <p className="text-xs text-gray-400 font-semibold mt-1">{profilo.bio}</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-500">{annunciAttivi.length}</p>
            <p className="text-xs text-gray-400 font-bold">annunci</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-white rounded-2xl p-1 mb-4 shadow-sm">
          <button
            onClick={() => setTab('annunci')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'annunci' ? 'bg-red-400 text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            I miei annunci
          </button>
          <button
            onClick={() => setTab('impostazioni')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'impostazioni' ? 'bg-red-400 text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            Impostazioni
          </button>
        </div>

        {/* TAB ANNUNCI */}
        {tab === 'annunci' && (
          <div>
            {annunci.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-400 font-bold">Nessun annuncio pubblicato</p>
                <button
                  onClick={() => window.location.href = '/pubblica'}
                  className="mt-4 bg-red-400 text-white font-bold px-6 py-2 rounded-full text-sm"
                >
                  Pubblica il primo
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {annunci.map(ann => (
                  <div key={ann.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    {/* Emoji categoria */}
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {ann.categorie?.emoji || '📦'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-800 truncate">{ann.titolo}</p>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">
                        {ann.is_gratuito || ann.prezzo === 0
                          ? '🟢 Gratis'
                          : `🔴 ${ann.prezzo} €`}
                        {' · '}
                        {ann.stato === 'attivo' ? '✅ Attivo' :
                         ann.stato === 'prenotato' ? '⏳ Prenotato' :
                         ann.stato === 'venduto' ? '✔️ Venduto' : '📦 Archiviato'}
                      </p>
                      <p className="text-xs text-gray-300 font-semibold">
                        👁 {ann.visualizzazioni || 0} visualizzazioni
                      </p>
                    </div>

                    {/* Azioni */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {ann.stato === 'attivo' && (
                        <>
                          <button
                            onClick={() => cambiaStatoAnnuncio(ann.id, 'venduto')}
                            className="text-xs font-bold bg-teal-50 text-teal-500 px-3 py-1.5 rounded-xl"
                          >
                            Venduto
                          </button>
                          <button
                            onClick={() => cambiaStatoAnnuncio(ann.id, 'archiviato')}
                            className="text-xs font-bold bg-gray-50 text-gray-400 px-3 py-1.5 rounded-xl"
                          >
                            Archivia
                          </button>
                        </>
                      )}
                      {ann.stato !== 'attivo' && (
                        <button
                          onClick={() => cambiaStatoAnnuncio(ann.id, 'attivo')}
                          className="text-xs font-bold bg-red-50 text-red-400 px-3 py-1.5 rounded-xl"
                        >
                          Riattiva
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottone pubblica nuovo */}
            {annunci.length > 0 && (
              <button
                onClick={() => window.location.href = '/pubblica'}
                className="w-full mt-4 border-2 border-dashed border-red-200 text-red-400 font-bold py-4 rounded-2xl text-sm hover:bg-red-50 transition-colors"
              >
                + Pubblica nuovo annuncio
              </button>
            )}
          </div>
        )}

        {/* TAB IMPOSTAZIONI */}
        {tab === 'impostazioni' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4">Modifica profilo</h3>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Presentati brevemente..."
                rows={3}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300 resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Zona</label>
              <div className="flex flex-wrap gap-2">
                {ZONE.map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, zona: z }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
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

            {successo && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-teal-500 text-sm font-bold">✅ Profilo aggiornato!</p>
              </div>
            )}

            <button
              onClick={salvaProfilo}
              disabled={salvataggio}
              className="w-full bg-gradient-to-r from-red-400 to-orange-400 text-white font-black py-4 rounded-xl text-sm disabled:opacity-50"
            >
              {salvataggio ? 'Salvataggio...' : 'Salva modifiche'}
            </button>

            {/* Email (non modificabile) */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-semibold">
                Account: {utente?.email}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-4 py-2">
          <button onClick={() => window.location.href = '/'} className="flex flex-col items-center gap-1 px-3 py-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-bold text-gray-400">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 px-3 py-1">
            <span className="text-xl">🔍</span>
            <span className="text-xs font-bold text-gray-400">Esplora</span>
          </button>
          <button
            onClick={() => window.location.href = '/pubblica'}
            className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center text-white text-2xl shadow-lg -mt-4 hover:scale-105 transition-transform"
          >
            +
          </button>
          <button className="flex flex-col items-center gap-1 px-3 py-1">
            <span className="text-xl">💬</span>
            <span className="text-xs font-bold text-gray-400">Messaggi</span>
          </button>
          <button className="flex flex-col items-center gap-1 px-3 py-1">
            <span className="text-xl">👤</span>
            <span className="text-xs font-bold text-red-500">Profilo</span>
          </button>
        </div>
      </nav>

    </main>
  )
}