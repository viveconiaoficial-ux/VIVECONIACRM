import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS, STATUS_LABELS } from '@/constants'
import type { LeadStatus } from '@/types/lead'

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}
