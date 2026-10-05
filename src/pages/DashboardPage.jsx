import { CreditCard, CircleCheck, Users, Clock } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import CuentasList from '../components/dashboard/CuentasList'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cuentas Totales"
          value="0"
          color="indigo"
          icon={<CreditCard className="h-6 w-6 text-white" />}
        />
        <StatCard
          title="Disponibles"
          value="0"
          color="green"
          icon={<CircleCheck className="h-6 w-6 text-white" />}
        />
        <StatCard
          title="Clientes"
          value="0"
          color="indigo"
          icon={<Users className="h-6 w-6 text-white" />}
        />
        <StatCard
          title="Por Vencer"
          value="0"
          color="red"
          icon={<Clock className="h-6 w-6 text-white" />}
        />
      </div>
      <CuentasList />
    </div>
  )
}
