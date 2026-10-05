import { useState } from 'react'
import { Mail, Search, Loader2 } from 'lucide-react'
import { useEmail } from '../hooks/useEmail'
import EmailBody from '../components/EmailBody'
import Button from '../components/ui/Button'
import { fieldClass } from '../components/ui/fieldStyles'
import Alert from '../components/ui/Alert'

export default function CorreosPage() {
  const { emails, loading, error, provider, fetchEmails } = useEmail()
  const [searchEmail, setSearchEmail] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    fetchEmails(searchEmail.trim(), true)
  }

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
    <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-white">Buscar correos</h2>
        <span className="text-xs text-gray-500 ml-auto hidden sm:inline">Gmail y Outlook</span>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="ejemplo@gmail.com o ejemplo@outlook.com"
          className={`flex-1 ${fieldClass}`}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </form>

      {error && <Alert type="error" message={error} />}

      {provider && emails.length > 0 && (
        <div className="mb-4 mt-4">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
              provider === 'outlook'
                ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                : 'bg-red-900/50 text-red-300 border-red-700'
            }`}
          >
            {provider === 'outlook' ? 'Outlook' : 'Gmail'}
          </span>
        </div>
      )}

      <div className="space-y-4 mt-4">
        {emails.map((msg) => (
          <div
            key={msg.id}
            className="bg-gray-900 rounded-lg border border-gray-700 p-5 hover:border-gray-600 transition-colors"
          >
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <span className="text-indigo-400 font-medium text-sm truncate">
                  De: {msg.from}
                </span>
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(msg.date)}
                </span>
              </div>
              {msg.to && (
                <span className="text-emerald-400 text-xs">Para: {msg.to}</span>
              )}
            </div>
            <div className="text-gray-300 text-sm leading-relaxed max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <EmailBody content={msg.body} />
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && emails.length === 0 && searchEmail && (
        <p className="text-gray-500 text-sm text-center py-8">
          No se encontraron correos para esta cuenta.
        </p>
      )}

      {!loading && !error && emails.length === 0 && !searchEmail && (
        <p className="text-gray-500 text-sm text-center py-8">
          Ingresa un correo para buscar mensajes recientes.
        </p>
      )}
    </section>
  )
}
