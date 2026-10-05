import { NavLink, Outlet } from 'react-router-dom'
import { Zap, LayoutDashboard, Mail, CreditCard, Users, Library, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/cuentas', label: 'Cuentas', icon: CreditCard },
  { to: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { to: '/dashboard/catalogos', label: 'Catálogos', icon: Library },
  { to: '/dashboard/correos', label: 'Correos', icon: Mail },
]

function navClass({ isActive }) {
  return [
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
    isActive
      ? 'bg-indigo-600/20 text-indigo-300'
      : 'text-gray-400 hover:bg-gray-800 hover:text-white',
  ].join(' ')
}

export default function AppShell() {
  const { adminProfile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-app-bg text-white">
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Streaming Manager</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-400">
              {adminProfile?.nombre || 'Admin'}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-600/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto custom-scrollbar px-3 pb-3 lg:hidden">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="lg:flex lg:min-h-[calc(100vh-4rem)]">
        <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-gray-800 bg-gray-900/40 p-4">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navClass}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
