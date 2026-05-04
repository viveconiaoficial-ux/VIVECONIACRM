import { ExternalLink, Mail, MessageCircle, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  buildWhatsAppUrl,
  WA_MSG1_TEMPLATE,
  WA_MSG2_TEMPLATE,
} from '@/constants'
import { logLeadInteraction, updateLead } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Lead } from '@/types/lead'
import { cn } from '@/lib/utils'

interface Props {
  lead: Lead
  onAfterLogged?: () => void
}

const iconBtn = cn(
  'text-amber-200/70 hover:bg-amber-500/10 hover:text-amber-100',
  'ring-1 ring-transparent hover:ring-amber-400/15',
)

async function safeLog(
  leadId: string,
  eventType: string,
  metadata: Record<string, unknown>,
) {
  try {
    await logLeadInteraction(leadId, eventType, metadata)
  } catch (e) {
    console.warn('No se pudo guardar el evento en historial:', e)
  }
}

export function LeadActions({ lead, onAfterLogged }: Props) {
  const upsertLead = useAppStore((s) => s.upsertLead)

  function handleMsg1() {
    if (!lead.whatsapp_phone) {
      toast.error('Sin número de WhatsApp')
      return
    }
    const msg =
      lead.expediente_outreach_message?.trim() ||
      WA_MSG1_TEMPLATE.replace(
        '{{nombre}}',
        lead.contact_name ?? lead.business_name,
      ).replace('{{negocio}}', lead.business_name)
    window.open(buildWhatsAppUrl(lead.whatsapp_phone, msg), '_blank')
    void updateLead(lead.id, { wa_msg1_sent_at: new Date().toISOString() })
      .then(async (updated) => {
        upsertLead(updated)
        await safeLog(lead.id, 'wa_message_sent', {
          step: 'msg1_sondeo',
          template: lead.expediente_outreach_message?.trim()
            ? 'expediente_outreach'
            : 'default',
          preview: msg.slice(0, 280),
        })
        onAfterLogged?.()
        toast.success('Msg 1 registrado')
      })
      .catch(() => toast.error('No se pudo registrar Msg 1'))
  }

  function handleMsg2() {
    if (!lead.whatsapp_phone) {
      toast.error('Sin número de WhatsApp')
      return
    }
    if (!lead.video_url) {
      toast.error('Añade primero el vídeo personalizado')
      return
    }
    const msg = WA_MSG2_TEMPLATE.replace(
      '{{nombre}}',
      lead.contact_name ?? lead.business_name,
    )
      .replace('{{negocio}}', lead.business_name)
      .replace('{{video_url}}', lead.video_url)
    window.open(buildWhatsAppUrl(lead.whatsapp_phone, msg), '_blank')
    void updateLead(lead.id, { wa_msg2_sent_at: new Date().toISOString() })
      .then(async (updated) => {
        upsertLead(updated)
        await safeLog(lead.id, 'wa_video_sent', {
          step: 'msg2_video',
          template: 'default',
          has_video_url: true,
        })
        onAfterLogged?.()
        toast.success('Msg 2 registrado')
      })
      .catch(() => toast.error('No se pudo registrar Msg 2'))
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        title={lead.wa_msg1_sent_at ? 'Msg 1 enviado' : 'Enviar sondeo WA'}
        onClick={handleMsg1}
        className={cn(
          iconBtn,
          lead.wa_msg1_sent_at &&
            'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 hover:ring-emerald-400/20',
        )}
      >
        <MessageCircle className="size-4" />
      </Button>

      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        title="Enviar vídeo por WA"
        onClick={handleMsg2}
        disabled={!lead.video_url}
        className={cn(
          iconBtn,
          lead.wa_msg2_sent_at &&
            'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 hover:ring-emerald-400/20',
        )}
      >
        <Video className="size-4" />
      </Button>

      {lead.email ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          title="Enviar email"
          onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
          className={iconBtn}
        >
          <Mail className="size-4" />
        </Button>
      ) : null}

      {lead.video_url ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          title="Ver vídeo"
          onClick={() => window.open(lead.video_url!, '_blank')}
          className={iconBtn}
        >
          <ExternalLink className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
