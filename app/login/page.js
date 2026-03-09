'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [modalita, setModalita] = useState('login') // 'login' o 'registrati'
  const [loading, setLoading] = useState(false)
  const [messaggio, setMessaggio] = useState(null)
  const [errore, setErrore] = useState(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefono: '',
    password: '',
  })

  function aggiornaForm(campo, valore) {
    setForm(prev => ({ ...prev, [campo]: valore }))
    setErrore(null)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setErrore(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setErrore('Email o password non corretti. Riprova.')
    } else {
      window.location.href = '/'
    }

    setLoading(false)
  }

  async function handleRegistrazione(e) {
    e.preventDefault()
    setLoading(true)
    setErrore(null)

    if (!form.nome || !form.email || !form.telefono || !form.password) {
      setErrore('Compila tutti i campi.')
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      setErrore('La password deve essere di almeno 6 caratteri.')
      setLoading(false)
      return
    }

    // Controlla se il telefono è già in uso
    const { data: telefonoEsistente } = await supabase
      .from('profiles')
      .select('id')
      .eq('telefono', form.telefono)
      .single()

    if (telefonoEsistente) {
      setErrore('Questo numero di telefono è già registrato.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nome: form.nome,
          telefono: form.telefono,
        }
      }
    })

    if (error) {
      setErrore('Errore durante la registrazione: ' + error.message)
    } else {
      setMessaggio('Controlla la tua email per confermare la registrazione!')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-orange-50 flex flex-col">

      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="text-red-400 font-bold text-sm"
          >
            ← Indietro
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8 w-full flex-1">

        {/* LOGO */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-red-500 leading-none">Civita</h1>
          <h1 className="text-4xl font-bold text-gray-800 leading-none -mt-1">Bimbi</h1>
          <p className="text-gray-400 text-sm font-semibold mt-2">
            {modalita === 'login' ? 'Bentornato!' : 'Crea il tuo account'}
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm">
          <button
            onClick={() => { setModalita('login'); setErrore(null); setMessaggio(null) }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              modalita === 'login'
                ? 'bg-red-400 text-white shadow-sm'
                : 'text-gray-400'
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setModalita('registrati'); setErrore(null); setMessaggio(null) }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              modalita === 'registrati'
                ? 'bg-red-400 text-white shadow-sm'
                : 'text-gray-400'
            }`}
          >
            Registrati
          </button>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">

          {messaggio ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📬</div>
              <p className="font-black text-gray-800 text-lg mb-2">Email inviata!</p>
              <p className="text-gray-400 text-sm leading-relaxed">{messaggio}</p>
              <button
                onClick={() => { setModalita('login'); setMessaggio(null) }}
                className="mt-6 text-red-400 font-bold text-sm"
              >
                Torna al login →
              </button>
            </div>
          ) : (
            <form onSubmit={modalita === 'login' ? handleLogin : handleRegistrazione}>

              {/* Solo per registrazione */}
              {modalita === 'registrati' && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Il tuo nome"
                      value={form.nome}
                      onChange={e => aggiornaForm('nome', e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300 transition-colors"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Numero di telefono
                    </label>
                    <input
                      type="tel"
                      placeholder="es. 3331234567"
                      value={form.telefono}
                      onChange={e => aggiornaForm('telefono', e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300 transition-colors"
                    />
                    <p className="text-xs text-gray-300 mt-1 font-semibold">
                      Usato per identificarti — non sarà pubblico
                    </p>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="la-tua@email.com"
                  value={form.email}
                  onChange={e => aggiornaForm('email', e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Minimo 6 caratteri"
                  value={form.password}
                  onChange={e => aggiornaForm('password', e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-300 transition-colors"
                />
              </div>

              {/* Errore */}
              {errore && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-red-500 text-sm font-bold">⚠️ {errore}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-400 to-orange-400 text-white font-black py-4 rounded-xl text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading
                  ? '...'
                  : modalita === 'login'
                  ? 'Accedi'
                  : 'Crea account'}
              </button>

            </form>
          )}
        </div>

        {/* Switch modalita */}
        {!messaggio && (
          <p className="text-center text-sm text-gray-400 font-semibold mt-6">
            {modalita === 'login' ? 'Non hai un account? ' : 'Hai già un account? '}
            <button
              onClick={() => { setModalita(modalita === 'login' ? 'registrati' : 'login'); setErrore(null) }}
              className="text-red-400 font-bold"
            >
              {modalita === 'login' ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        )}

      </div>
    </main>
  )
}