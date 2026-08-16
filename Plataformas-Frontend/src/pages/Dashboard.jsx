import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGmail } from '../hooks/useGmail'
import StatCard from '../components/dashboard/StatCard'
import ClientesList from '../components/dashboard/ClientesList'
import CuentasList from '../components/dashboard/CuentasList'
import PlataformasList from '../components/dashboard/PlataformasList'
import ProveedoresList from '../components/dashboard/ProveedoresList'
import { renderEmailBody } from '../utils/emailReader'

export default function Dashboard() {
  const { adminProfile, signOut } = useAuth()
  const { emails, loading, error, fetchEmails } = useGmail()
  const [searchEmail, setSearchEmail] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    fetchEmails(searchEmail.trim())
  }



  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida'
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Streaming Manager</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {adminProfile?.nombre || 'Admin'}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ═══════════════════════════════════════
            SECCIÓN NUEVA: Buscador de Gmail
            ═══════════════════════════════════════ */}
        <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-white">Buscar Correos Gmail</h2>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="ejemplo@gmail.com"
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Buscando...
                </>
              ) : (
                'Buscar'
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Lista de correos */}
          {emails.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-2">
                Últimos {emails.length} correos encontrados:
              </p>
              {emails.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                    <span className="text-indigo-400 font-medium text-sm truncate">
                      {msg.from}
                    </span>
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(msg.date)}
                    </span>
                  </div>
                <div className="text-gray-300 text-sm leading-relaxed max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-0">
                  {renderEmailBody(msg.body)}
                </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!loading && !error && emails.length === 0 && searchEmail && (
            <p className="text-gray-500 text-sm text-center py-4">
              No se encontraron correos para esta cuenta.
            </p>
          )}
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Cuentas Totales"
            value="0"
            color="indigo"
            icon={
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
          <StatCard
            title="Disponibles"
            value="0"
            color="green"
            icon={
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Clientes"
            value="0"
            color="blue"
            icon={
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Por Vencer"
            value="0"
            color="red"
            icon={
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Cuentas */}
        <CuentasList />

        {/* Clientes */}
        <ClientesList />

        {/* Catálogos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlataformasList />
          <ProveedoresList />
        </div>
      </main>
    </div>
  )
}