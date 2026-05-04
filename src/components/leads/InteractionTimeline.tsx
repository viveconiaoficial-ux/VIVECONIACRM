import type { LeadInteraction } from '@/types/analytics'
import { cn } from '@/lib/utils'

const EVENT_LABELS: Record<string, string> = {
  wa_draft_created: 'Borrador WA',
  wa_message_sent: 'WhatsApp enviado',
  wa_video_sent: 'Vídeo enviado por WA',
  web_analysis_opened: 'Análisis web abierto',
  proposal_generated: 'Propuesta generada',
  proposal_viewed: 'Propuesta vista',
  status_changed: 'Estado actualizado',
  note_added: 'Nota añadida',
  research_refreshed: 'Investigación actualizada',
  email_sent: 'Email',
  call_logged: 'Llamada registrada',
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function InteractionTimeline({
  items,
}: {
  items: LeadInteraction[]
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-stone-500">
        Aún no hay eventos registrados. Al enviar WhatsApp desde aquí se irán
        guardando solos.
      </p>
    )
  }

  return (
    <ul className="relative space-y-0 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-amber-500/20">
      {items.map((ev, i) => (
        <li
          key={ev.id}
          className={cn(
            'relative flex gap-4 pb-6 pl-6',
            i === items.length - 1 && 'pb-0',
          )}
        >
          <span
            className="absolute left-0 top-1.5 size-3.5 shrink-0 rounded-full border-2 border-amber-400/40 bg-stone-900 ring-2 ring-amber-500/10"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-medium text-stone-100">
                {EVENT_LABELS[ev.event_type] ?? ev.event_type}
              </span>
              <time
                className="text-xs tabular-nums text-stone-500"
                dateTime={ev.created_at}
              >
                {formatWhen(ev.created_at)}
              </time>
            </div>
            {ev.channel ? (
              <p className="text-[11px] uppercase tracking-wider text-stone-600">
                vía {ev.channel}
              </p>
            ) : null}
            {Object.keys(ev.metadata ?? {}).length > 0 ? (
              <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-amber-500/10 bg-stone-950/50 p-3 text-[11px] leading-relaxed text-stone-400">
                {JSON.stringify(ev.metadata, null, 2)}
              </pre>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
