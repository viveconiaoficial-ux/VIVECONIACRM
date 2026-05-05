import { proposalImagePublicUrl } from '@/lib/proposalImageStorage'
import { cn } from '@/lib/utils'

/**
 * Galería debajo de las pestañas de la ficha (sin numeración de expediente): material de la propuesta.
 */
export function ProposalHeroGallery({
  paths,
  className,
}: {
  paths: string[]
  className?: string
}) {
  if (!paths.length) return null

  return (
    <section
      aria-label="Material visual enviado con la propuesta"
      className={cn(
        'relative isolate overflow-hidden rounded-[1.35rem]',
        'border border-white/[0.07]',
        'bg-gradient-to-br from-[#141210] via-stone-950 to-[#0c0a08]',
        'shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(251,191,36,0.06)]',
        'ring-1 ring-amber-500/[0.12]',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-24 size-[28rem] rounded-full bg-amber-500/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 size-[22rem] rounded-full bg-amber-900/[0.05] blur-3xl" />

      <div className="relative px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-px w-12 rounded-full bg-gradient-to-r from-amber-400/70 to-transparent" />
            <h2 className="text-[1rem] font-semibold tracking-[0.02em] text-stone-50 sm:text-[1.05rem]">
              Piezas junto a la propuesta
            </h2>
          </div>
          <p className="shrink-0 text-[11px] font-medium tabular-nums tracking-wide text-amber-200/55">
            {paths.length === 1 ? '1 archivo' : `${paths.length} archivos`}
          </p>
        </div>

        <div className="relative">
          <div
            className={cn(
              '-mx-1 pb-1 pt-1',
              paths.length <= 2
                ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'
                : 'flex gap-3 overflow-x-auto overflow-y-visible [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-500/25 [&::-webkit-scrollbar-track]:bg-transparent sm:gap-4',
            )}
          >
            {paths.map((storagePath, i) => {
              const src = proposalImagePublicUrl(storagePath)
              const few = paths.length <= 2
              return (
                <a
                  key={storagePath}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir en tamaño completo"
                  className={cn(
                    'group relative flex overflow-hidden rounded-2xl',
                    'border border-white/[0.06]',
                    'bg-stone-950/90',
                    'shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)]',
                    'ring-1 ring-inset ring-white/[0.04]',
                    'transition duration-300',
                    'hover:border-amber-500/22 hover:ring-amber-400/15',
                    'items-center justify-center p-2 sm:p-3',
                    few
                      ? cn(
                          'min-h-[200px] w-full max-h-[min(52vh,420px)] sm:min-h-[240px]',
                          paths.length === 1 && 'mx-auto sm:max-w-3xl sm:col-span-2',
                        )
                      : 'h-[min(52vh,380px)] w-[min(85vw,280px)] shrink-0 sm:w-[300px]',
                  )}
                  style={{
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    loading={i <= 2 ? 'eager' : 'lazy'}
                    className={cn(
                      'max-h-full max-w-full object-contain object-center',
                      few ? 'h-auto w-full' : 'h-full w-full',
                    )}
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/50" />
                </a>
              )
            })}
          </div>

          {paths.length > 2 ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-1 right-0 z-[1] w-10 bg-gradient-to-l from-[#0c0a08] to-transparent opacity-95 sm:hidden"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-0 z-[1] w-10 bg-gradient-to-r from-[#141210] to-transparent opacity-90 sm:hidden"
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
