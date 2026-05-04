import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TopBarProps {
  visibleCount: number
  onNewLead: () => void
  /** Palabra destacada en el título (por defecto: prospectos). */
  titleHighlight?: string
  /** Sustituye el párrafo de recuento si lo necesitas por vista. */
  countLine?: (visibleCount: number) => string
}

export function TopBar({
  visibleCount,
  onNewLead,
  titleHighlight = 'prospectos',
  countLine,
}: TopBarProps) {
  const sub =
    countLine?.(visibleCount) ??
    (visibleCount === 0
      ? 'Aquí aparecerán tus contactos. Respira: empezar vacío también es orden.'
      : `Tienes ${visibleCount} ${visibleCount === 1 ? 'ficha visible' : 'fichas visibles'} con los filtros actuales.`)

  return (
    <header className="relative border-b border-amber-500/10 bg-background/40 px-6 py-6 backdrop-blur-md sm:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/85">
            Pipeline
          </p>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-stone-50 sm:text-3xl">
            Tus{' '}
            <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300/90 bg-clip-text text-transparent">
              {titleHighlight}
            </span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-stone-400">{sub}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onNewLead}
          className={cn(
            'h-10 gap-2 rounded-xl px-5 font-medium shadow-lg shadow-amber-950/25',
            'border-amber-400/35 bg-gradient-to-b from-amber-200/95 to-amber-400/85 text-stone-900',
            'hover:from-amber-100 hover:to-amber-300/90 hover:border-amber-300/50',
            'active:translate-y-px',
          )}
        >
          <Plus className="size-4" />
          Nuevo lead
        </Button>
      </div>
    </header>
  )
}
