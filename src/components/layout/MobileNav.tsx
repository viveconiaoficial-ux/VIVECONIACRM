import { Menu, X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { MainView } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { SIDEBAR_SURFACE_CLASS, SidebarContent } from './Sidebar'

export function MobileNavBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-3 border-b border-amber-500/10',
        'bg-background/75 px-3 backdrop-blur-md md:hidden',
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0 border-amber-400/30 text-amber-100 hover:bg-amber-500/10"
        onClick={onOpenMenu}
        aria-label="Abrir menú de navegación"
      >
        <Menu className="size-[18px]" aria-hidden />
      </Button>
      <p className="min-w-0 truncate text-sm font-semibold tracking-tight text-stone-50">
        Vive con IA · CRM
      </p>
    </header>
  )
}

interface MobileNavDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeView: MainView
  onSelectView: (view: MainView) => void
}

export function MobileNavDrawer({
  open,
  onOpenChange,
  activeView,
  onSelectView,
}: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navegación principal"
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-stone-950/55 backdrop-blur-[2px]',
          'transition-opacity',
        )}
        aria-label="Cerrar menú"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(19rem,calc(100vw-2rem))]',
          'animate-in fade-in slide-in-from-left duration-200',
          SIDEBAR_SURFACE_CLASS,
        )}
      >
        <SidebarContent
          activeView={activeView}
          onSelectView={onSelectView}
          onItemSelect={() => onOpenChange(false)}
          headerAction={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-stone-400 hover:bg-stone-900/50 hover:text-stone-100"
              onClick={() => onOpenChange(false)}
              aria-label="Cerrar menú"
            >
              <X className="size-[18px]" aria-hidden />
            </Button>
          }
        />
      </aside>
    </div>
  )
}
