import { flexRender, type Row } from '@tanstack/react-table'
import { TableCell, TableRow } from '@/components/ui/table'
import type { Lead } from '@/types/lead'
import { cn } from '@/lib/utils'

interface LeadRowProps {
  row: Row<Lead>
  onOpen: (id: string) => void
}

export function LeadRow({ row, onOpen }: LeadRowProps) {
  return (
    <TableRow
      className={cn(
        'cursor-pointer border-amber-500/8 transition-colors',
        'hover:bg-amber-500/[0.06] hover:shadow-[inset_0_0_0_1px_oklch(0.78_0.12_82_/15%)]',
      )}
      onClick={() => onOpen(row.original.id)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(
            cell.column.id === 'business_name' &&
              'max-w-[180px] truncate font-medium text-stone-50',
            cell.column.id === 'contact_name' &&
              'max-w-[140px] truncate text-stone-300',
            cell.column.id === 'sector' &&
              'max-w-[120px] truncate text-stone-400',
            (cell.column.id === 'email' ||
              cell.column.id === 'whatsapp_phone') &&
              'max-w-[140px] truncate text-stone-400',
            cell.column.id === 'ubicacion' &&
              'max-w-[160px] truncate text-stone-400',
            cell.column.id === 'created_at' &&
              'text-stone-400 tabular-nums text-xs',
            cell.column.id === 'presupuesto' &&
              'text-stone-300 tabular-nums',
            (cell.column.id === 'deal_accepted_at' ||
              cell.column.id === 'deal_next_followup_at' ||
              cell.column.id === 'deal_closed_at') &&
              'text-stone-400 tabular-nums text-xs',
            cell.column.id === 'score' &&
              'text-center tabular-nums text-amber-200/80',
            (cell.column.id === 'wa_msg1_sent_at' ||
              cell.column.id === 'wa_msg2_sent_at') &&
              'text-stone-400 tabular-nums',
          )}
          onClick={
            cell.column.id === 'status' || cell.column.id === 'actions'
              ? (e) => e.stopPropagation()
              : undefined
          }
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}
