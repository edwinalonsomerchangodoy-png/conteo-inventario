import {
  ShieldCheck,
  FileSpreadsheet,
  ScanLine,
  BarChart3,
  Package,
  LogOut,
  Users,
  ShieldAlert,
  ListFilter,
  LayoutDashboard,
} from 'lucide-react'

const ITEMS = [
  { id: 'admin', label: 'Carga de stock', sub: 'Admin', icon: ShieldCheck },
  { id: 'excel', label: 'Carga desde Excel', sub: 'Inicial', icon: FileSpreadsheet },
  { id: 'selectivos', label: 'Conteos selectivos', sub: 'Admin', icon: ListFilter },
  { id: 'conteo', label: 'Conteo físico', sub: 'Operación', icon: ScanLine },
  { id: 'pendientes', label: 'Pendientes de reconteo', sub: 'Operación', icon: ShieldAlert },
  { id: 'dashboard', label: 'Dashboard', sub: 'Gerencia', icon: LayoutDashboard },
  { id: 'reporte', label: 'Reporte de diferencias', sub: 'Gerencia', icon: BarChart3 },
]

const ITEM_ADMIN = { id: 'colaboradores', label: 'Colaboradores', sub: 'Admin', icon: Users }

export default function Sidebar({ activo, onCambiar, tiendaActiva, usuario, esAdmin, pendientesCount, onSalir }) {
  const items = esAdmin ? [...ITEMS, ITEM_ADMIN] : ITEMS
  return (
    <aside className="w-full md:w-64 bg-ink text-paper flex md:flex-col shrink-0">
      <div className="px-5 py-6 hidden md:flex items-center gap-2 border-b border-ink-line">
        <Package size={20} className="text-signal" />
        <div>
          <p className="font-display font-bold tracking-tight leading-none">CONTEO</p>
          <p className="text-[10px] code-tag text-slate-soft tracking-widest">
            INVENTARIO · 01
          </p>
        </div>
      </div>

      {tiendaActiva && (
        <div className="hidden md:block px-5 py-3 border-b border-ink-line">
          <p className="text-[10px] code-tag text-slate-soft tracking-widest uppercase">
            Tienda activa
          </p>
          <p className="text-sm font-medium text-signal truncate">{tiendaActiva}</p>
        </div>
      )}

      <nav className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible">
        {items.map((item, idx) => {
          const Icon = item.icon
          const activeItem = activo === item.id
          return (
            <button
              key={item.id}
              onClick={() => onCambiar(item.id)}
              className={`group flex items-center gap-3 px-5 py-4 text-left border-b border-ink-line md:border-b-0 md:border-l-2 whitespace-nowrap transition-colors ${
                activeItem
                  ? 'bg-ink-soft border-l-signal text-paper'
                  : 'border-l-transparent text-slate-soft hover:text-paper hover:bg-ink-soft/60'
              }`}
            >
              <span className="code-tag text-[10px] text-slate-soft w-4">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <Icon size={17} className={activeItem ? 'text-signal' : ''} />
              <span className="flex flex-col">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  {item.label}
                  {item.id === 'pendientes' && pendientesCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-signal text-ink text-[10px] font-bold">
                      {pendientesCount}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-soft hidden md:block">{item.sub}</span>
              </span>
            </button>
          )
        })}
      </nav>

      {usuario && (
        <div className="hidden md:flex items-center justify-between gap-2 px-5 py-4 border-t border-ink-line">
          <div className="min-w-0">
            <p className="text-[10px] code-tag text-slate-soft tracking-widest uppercase">
              Colaborador
            </p>
            <p className="text-sm font-medium truncate">{usuario}</p>
          </div>
          <button
            onClick={onSalir}
            title="Cerrar sesión"
            className="text-slate-soft hover:text-signal transition-colors shrink-0"
          >
            <LogOut size={17} />
          </button>
        </div>
      )}
    </aside>
  )
}
