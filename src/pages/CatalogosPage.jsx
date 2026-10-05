import PlataformasList from '../components/dashboard/PlataformasList'
import ProveedoresList from '../components/dashboard/ProveedoresList'

export default function CatalogosPage() {
  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Catálogos</h2>
        <p className="text-sm text-gray-400 mt-1">Plataformas y proveedores del inventario</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlataformasList />
        <ProveedoresList />
      </div>
    </div>
  )
}
