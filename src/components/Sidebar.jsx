import { useState } from 'react'
import {
  ShieldCheck,
  FileSpreadsheet,
  ScanLine,
  BarChart3,
  LogOut,
  Users,
  ShieldAlert,
  RefreshCw,
  LayoutDashboard,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Store,
} from 'lucide-react'
import logo from '../assets/locatel-logo.png'

const ITEMS_OPERACION = [
  { id: 'conteo', label: 'Conteo físico', sub: 'Operación', icon: ScanLine },
  { id: 'pendientes', label: 'Pendientes de reconteo', sub: 'Operación', icon: ShieldAlert },
  { id: 'dashboard', label: 'Dashboard', sub: 'Gerencia', icon: LayoutDashboard },
  { id: 'reporte', label: 'Reporte de diferencias', sub: 'Gerencia', icon: BarChart3 },
]

const ITEMS_ADMIN = [
  { id: 'admin', label: 'Carga de stock', sub: 'Admin', icon: ShieldCheck },
  { id: 'excel', label: 'Carga desde Excel', sub: 'Admin', icon: FileSpreadsheet },
  { id: 'programas', label: 'Programas de ciclos', sub: 'Admin', icon: RefreshCw },
  { id: 'colaboradores', label: 'Colaboradores', sub: 'Admin', icon: Users },
]

function ItemsNav({ items, activo, onSeleccionar, pendientesCount, colapsada }) {
  return (
    <nav className="flex flex-col flex-1 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.icon
        const activeItem = activo === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSeleccionar(item.id)}
            title={colapsada ? item.label : undefined}
            className={`group relative flex items-center gap-3 px-5 py-4 text-left border-l-2 whitespace-nowrap transition-colors ${
              colapsada ? 'justify-center px-0' : ''
            } ${
              activeItem
                ? 'bg-ink-soft border-l-signal text-paper'
                : 'border-l-transparent text-slate-soft hover:text-paper hover:bg-ink-soft/60'
            }`}
          >
            <span className="relative">
              <Icon size={18} className={activeItem ? 'text-signal' : ''} />
              {item.id === 'pendientes' && pendientesCount > 0 && (
                <span
                  className={`absolute bg-signal text-ink text-[9px] font-bold rounded-full flex items-center justify-center ${
                    colapsada ? '-top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5' : 'hidden'
                  }`}
                >
                  {pendientesCount}
                </span>
              )}
            </span>
            {!colapsada && (
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  {item.label}
                  {item.id === 'pendientes' && pendientesCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-signal text-ink text-[10px] font-bold">
                      {pendientesCount}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-soft">{item.sub}</span>
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export default function Sidebar({ activo, onCambiar, tiendaActiva, usuario, esAdmin, pendientesCount, onSalir }) {
  const items = esAdmin ? [...ITEMS_OPERACION, ...ITEMS_ADMIN] : ITEMS_OPERACION
  const [colapsada, setColapsada] = useState(true)
  const [abiertaMovil, setAbiertaMovil] = useState(false)

  const seleccionar = (id) => {
    onCambiar(id)
    setAbiertaMovil(false)
  }

  return (
    <>
      {/* Barra superior en celular */}
      <div className="md:hidden flex items-center justify-between bg-ink text-paper px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="Locatel" className="h-7 w-auto rounded-md shrink-0" />
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-none truncate">Ciclos de Inventario</p>
            {tiendaActiva && <p className="text-[11px] text-signal truncate">{tiendaActiva}</p>}
          </div>
        </div>
        <button onClick={() => setAbiertaMovil(true)} className="shrink-0 p-1">
          <Menu size={22} />
        </button>
      </div>

      {/* Menú desplegable en celular */}
      {abiertaMovil && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85vw] bg-ink text-paper flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-5 border-b border-ink-line">
              <img src={logo} alt="Locatel" className="h-8 w-auto rounded-md" />
              <button onClick={() => setAbiertaMovil(false)}>
                <X size={22} />
              </button>
            </div>
            {tiendaActiva && (
              <div className="px-5 py-3 border-b border-ink-line flex items-center gap-2">
                <Store size={14} className="text-signal-dim shrink-0" />
                <p className="text-sm font-medium text-signal truncate">{tiendaActiva}</p>
              </div>
            )}
            <ItemsNav
              items={items}
              activo={activo}
              onSeleccionar={seleccionar}
              pendientesCount={pendientesCount}
              colapsada={false}
            />
            {usuario && (
              <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-ink-line">
                <p className="text-sm font-medium truncate">{usuario}</p>
                <button onClick={onSalir} title="Cerrar sesión" className="text-slate-soft shrink-0">
                  <LogOut size={17} />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setAbiertaMovil(false)} />
        </div>
      )}

      {/* Menú lateral en computador, colapsable */}
      <aside
        className={`hidden md:flex flex-col bg-ink text-paper shrink-0 transition-[width] duration-150 ${
          colapsada ? 'w-16' : 'w-64'
        }`}
      >
        <div
          className={`flex items-center border-b border-ink-line ${
            colapsada ? 'justify-center py-4' : 'justify-between px-5 py-5'
          }`}
        >
          {!colapsada && <img src={logo} alt="Locatel" className="h-9 w-auto rounded-md" />}
          <button
            onClick={() => setColapsada((v) => !v)}
            className="text-slate-soft hover:text-paper transition-colors"
            title={colapsada ? 'Expandir menú' : 'Colapsar menú'}
          >
            {colapsada ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>

        {tiendaActiva && (
          <div className={`border-b border-ink-line ${colapsada ? 'py-3 flex justify-center' : 'px-5 py-3'}`}>
            {colapsada ? (
              <Store size={16} className="text-signal-dim" title={tiendaActiva} />
            ) : (
              <>
                <p className="text-[10px] code-tag text-slate-soft tracking-widest uppercase">Tienda activa</p>
                <p className="text-sm font-medium text-signal truncate">{tiendaActiva}</p>
              </>
            )}
          </div>
        )}

        <ItemsNav
          items={items}
          activo={activo}
          onSeleccionar={onCambiar}
          pendientesCount={pendientesCount}
          colapsada={colapsada}
        />

        {usuario && (
          <div
            className={`flex items-center border-t border-ink-line ${
              colapsada ? 'justify-center py-4' : 'justify-between gap-2 px-5 py-4'
            }`}
          >
            {!colapsada && (
              <div className="min-w-0">
                <p className="text-[10px] code-tag text-slate-soft tracking-widest uppercase">Colaborador</p>
                <p className="text-sm font-medium truncate">{usuario}</p>
              </div>
            )}
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
    </>
  )
}
