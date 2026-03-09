'use client'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function Home() {
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriaSelezionata, setCategoriaSelezionata] = useState(null)
  const [categorie, setCategorie] = useState([])
  const [utente, setUtente] = useState(null)

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
    const { data } = await supabase
      .from('categorie')
      .select('*')
      .order('ordine')
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

  return (
    <main className="min-h-screen bg-orange-50">

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-red-500 leading-none">Civita</h1>
            <h1 className="text-2xl font-bold text-gray-800 leading-none -mt-1">Bimbi</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg hover:bg-gray-200">
              🔔
            </button>
            {utente ? (
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-gray-400 hover:text-red-400 px-2"
              >
                Esci
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg hover:bg-gray-200"
              >
                👤
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4">

        {/* HERO */}
        <div className="bg-gradient-to-r from-red-400 to-orange-400 rounded-2xl p-5 mt-4 relative overflow-hidden">
          <div className="relative z-10">
            {utente ? (
              <p className="text-white font-black text-xl leading-tight">Bentornato! 👋</p>
            ) : (
              <p className="text-white font-black text-xl leading-tight">Scambia, vendi e regala</p>
            )}
            <p className="text-white/80 text-sm font-semibold mt-1">oggetti per bambini a Civitavecchia</p>
            <span className="inline-block bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-full mt-3">
              📍 Civitavecchia & dintorni
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20">🧸</div>
        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-2xl px-4 py-3 mt-3 flex items-center gap-3 shadow-sm">
          <span className="text-gray-400 text-lg">🔍</span>
          <p className="text-gray-400 text-sm font-semibold">Cerca vestiti, giochi, libri...</p>
        </div>

        {/* CATEGORIE */}
        <div className="mt-4">
          <h2 className="text-base font-black text-gray-800 mb-3">Categorie</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoriaSelezionata(null)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all ${
                !categoriaSelezionata ? 'border-red-400 bg-red-50' : 'border-transparent bg-white'
              }`}
            >
              <span className="text-2xl">🏠</span>
              <span className="text-xs font-bold text-gray-700">Tutti</span>
            </button>
            {categorie.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaSelezionata(cat.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all ${
                  categoriaSelezionata === cat.id ? 'border-red-400 bg-red-50' : 'border-transparent bg-white'
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-bold text-gray-700 text-center whitespace-nowrap">
                  {cat.nome.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ANNUNCI */}
        <div className="mt-4 mb-24">
          <h2 className="text-base font-black text-gray-800 mb-3">
            {categoriaSelezionata ? 'Annunci filtrati' : 'Annunci recenti'}
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-32 bg-gray-200" />
                  <div className="p-3">
                    <div className="h-3 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : annunci.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-400 font-bold">Nessun annuncio trovato</p>
              <p className="text-gray-300 text-sm mt-1">Sii il primo a pubblicare!</p>
              {!utente && (
                <button
                  onClick={() => window.location.href = '/login'}
                  className="mt-4 bg-red-400 text-white font-bold px-6 py-2 rounded-full text-sm"
                >
                  Accedi per pubblicare
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {annunci.map(annuncio => (
                <div
                  key={annuncio.id}
                  onClick={() => { console.log('click', annuncio.id); window.location.href = `/annuncio/${annuncio.id}`; }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center relative">
                    {annuncio.foto_principale ? (
                      <img
                        src={annuncio.foto_principale}
                        alt={annuncio.titolo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{annuncio.categoria_emoji || '📦'}</span>
                    )}
                    {annuncio.taglia && (
                      <span className="absolute top-2 right-2 bg-yellow-300 text-gray-800 text-xs font-black px-2 py-0.5 rounded-full">
                        {annuncio.taglia}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-black text-gray-800 leading-tight line-clamp-2 mb-1">
                      {annuncio.titolo}
                    </p>
                    <p className="text-xs text-gray-400 font-semibold mb-2">
                      📍 {annuncio.zona || 'Civitavecchia'}
                    </p>
                    <p className={`text-base font-black ${
                      annuncio.is_gratuito || annuncio.prezzo === 0 ? 'text-teal-500' : 'text-red-500'
                    }`}>
                      {annuncio.is_gratuito || annuncio.prezzo === 0 ? 'Gratis' : `${annuncio.prezzo} €`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-4 py-2">
          <button className="flex flex-col items-center gap-1 px-3 py-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-bold text-red-500">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 px-3 py-1">
            <span className="text-xl">🔍</span>
            <span className="text-xs font-bold text-gray-400">Esplora</span>
          </button>
          <button
            onClick={() => utente ? window.location.href = '/pubblica' : window.location.href = '/login'}
            className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center text-white text-2xl shadow-lg -mt-4 hover:scale-105 transition-transform"
          >
            +
          </button>
          <button
            onClick={() => window.location.href = '/messaggi'}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <span className="text-xl">💬</span>
            <span className="text-xs font-bold text-gray-400">Messaggi</span>
          </button>
          <button
            onClick={() => utente ? window.location.href = '/profilo' : window.location.href = '/login'}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <span className="text-xl">👤</span>
            <span className="text-xs font-bold text-gray-400">Profilo</span>
          </button>
        </div>
      </nav>

    </main>
  )
}