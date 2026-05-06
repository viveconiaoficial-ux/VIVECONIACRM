import {
  BarChart3,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  Sparkles,
  Telescope,
  UserSearch,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { MainView } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

/** Superficie del panel lateral (escritorio y drawer móvil). */
export const SIDEBAR_SURFACE_CLASS = cn(
  'flex shrink-0 flex-col border-r border-amber-500/15 bg-sidebar/95',
  'shadow-[inset_-1px_0_0_oklch(0.88_0.06_82_/_8%)]',
  'backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/80',
)

interface SidebarContentProps {
  activeView: MainView
  onSelectView: (view: MainView) => void
  /** Tras elegir una vista (p. ej. cerrar el drawer móvil). */
  onItemSelect?: () => void
  /** Botón u otro control al final de la cabecera (p. ej. cerrar en móvil). */
  headerAction?: ReactNode
}

export function SidebarContent({
  activeView,
  onSelectView,
  onItemSelect,
  headerAction,
}: SidebarContentProps) {
  function select(view: MainView) {
    onSelectView(view)
    onItemSelect?.()
  }

  return (
    <>
      <div className="border-b border-amber-500/10 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/10 ring-1 ring-amber-400/25">
            <Sparkles className="size-5 text-amber-300/95" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-tight text-stone-50">
              Vive con IA
            </p>
            <p className="text-xs leading-relaxed text-amber-200/55">
              Tu espacio de trabajo
            </p>
          </div>
          {headerAction ? (
            <div className="shrink-0">{headerAction}</div>
          ) : null}
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        <button
          type="button"
          onClick={() => select('clientes_potenciales')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
            activeView === 'clientes_potenciales'
              ? 'bg-amber-500/12 text-amber-50 shadow-sm ring-1 ring-amber-400/20'
              : 'text-stone-400 hover:bg-stone-900/50 hover:text-stone-200',
          )}
        >
          <UserSearch
            className={cn(
              'size-[18px] shrink-0 transition-transform group-hover:scale-105',
              activeView === 'clientes_potenciales'
                ? 'text-amber-300/90'
                : 'text-stone-500',
            )}
          />
          Clientes potenciales
        </button>
        <button
          type="button"
          onClick={() => select('clientes')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
            activeView === 'clientes'
              ? 'bg-amber-500/12 text-amber-50 shadow-sm ring-1 ring-amber-400/20'
              : 'text-stone-400 hover:bg-stone-900/50 hover:text-stone-200',
          )}
        >
          <Handshake
            className={cn(
              'size-[18px] shrink-0 transition-transform group-hover:scale-105',
              activeView === 'clientes' ? 'text-amber-300/90' : 'text-stone-500',
            )}
          />
          Clientes
        </button>
        <button
          type="button"
          onClick={() => select('prospectos')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
            activeView === 'prospectos'
              ? 'bg-amber-500/12 text-amber-50 shadow-sm ring-1 ring-amber-400/20'
              : 'text-stone-400 hover:bg-stone-900/50 hover:text-stone-200',
          )}
        >
          <LayoutDashboard
            className={cn(
              'size-[18px] shrink-0 transition-transform group-hover:scale-105',
              activeView === 'prospectos' ? 'text-amber-300/90' : 'text-stone-500',
            )}
          />
          Prospectos
        </button>
        <button
          type="button"
          onClick={() => select('fichas')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
            activeView === 'fichas'
              ? 'bg-amber-500/12 text-amber-50 shadow-sm ring-1 ring-amber-400/20'
              : 'text-stone-400 hover:bg-stone-900/50 hover:text-stone-200',
          )}
        >
          <ClipboardList
            className={cn(
              'size-[18px] shrink-0 transition-transform group-hover:scale-105',
              activeView === 'fichas' ? 'text-amber-300/90' : 'text-stone-500',
            )}
          />
          Fichas y estado
        </button>
        <button
          type="button"
          onClick={() => select('plan_interacciones')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
            activeView === 'plan_interacciones'
              ? 'bg-amber-500/12 text-amber-50 shadow-sm ring-1 ring-amber-400/20'
              : 'text-stone-400 hover:bg-stone-900/50 hover:text-stone-200',
          )}
        >
          <Telescope
            className={cn(
              'size-[18px] shrink-0 transition-transform group-hover:scale-105',
              activeView === 'plan_interacciones'
                ? 'text-amber-300/90'
                : 'text-stone-500',
            )}
          />
          Plan de interacciones
        </button>
        <button
          type="button"
          onClick={() => select('analiticas')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
            activeView === 'analiticas'
              ? 'bg-amber-500/12 text-amber-50 shadow-sm ring-1 ring-amber-400/20'
              : 'text-stone-400 hover:bg-stone-900/50 hover:text-stone-200',
          )}
        >
          <BarChart3
            className={cn(
              'size-[18px] shrink-0 transition-transform group-hover:scale-105',
              activeView === 'analiticas' ? 'text-amber-300/90' : 'text-stone-500',
            )}
          />
          Analíticas
        </button>
      </nav>
      <div className="mt-auto border-t border-amber-500/10 p-4">
        <p className="text-[11px] leading-snug text-stone-500">
          <span className="text-amber-200/70">Potenciales</span> y{' '}
          <span className="text-amber-200/70">Clientes</span> separan quién aún
          no ha aceptado y quién ya sí.
        </p>
      </div>
    </>
  )
}

interface SidebarProps {
  activeView: MainView
  onSelectView: (view: MainView) => void
}

export function Sidebar({ activeView, onSelectView }: SidebarProps) {
  return (
    <aside
      className={cn(
        SIDEBAR_SURFACE_CLASS,
        /* hidden/md:flex deben ir después: el surface incluye `flex` y si no, tailwind-merge anula `hidden`. */
        'hidden w-60 md:flex',
      )}
    >
      <SidebarContent activeView={activeView} onSelectView={onSelectView} />
    </aside>
  )
}
