import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LeadActions } from '@/components/leads/LeadActions'
import { LeadRow } from '@/components/leads/LeadRow'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import type { Lead } from '@/types/lead'
import { cn } from '@/lib/utils'

function formatWaSent(at: string | null): string {
  if (!at) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(at))
  } catch {
    return '—'
  }
}

function VideoCell({ lead }: { lead: Lead }) {
  if (!lead.video_url) {
    return <span className="text-stone-500">Pendiente</span>
  }
  return (
    <span className="font-medium text-emerald-300/95 tabular-nums">Listo</span>
  )
}

const columnHelper = createColumnHelper<Lead>()

interface LeadsTableProps {
  leads: Lead[]
  onOpenLead: (id: string) => void
}

export function LeadsTable({ leads, onOpenLead }: LeadsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('business_name', {
        id: 'business_name',
        header: 'Negocio',
        cell: (ctx) => ctx.getValue(),
      }),
      columnHelper.accessor('contact_name', {
        id: 'contact_name',
        header: 'Contacto',
        cell: (ctx) => ctx.getValue() ?? '—',
      }),
      columnHelper.accessor('sector', {
        id: 'sector',
        header: 'Sector',
        cell: (ctx) => ctx.getValue() ?? '—',
      }),
      columnHelper.accessor('score', {
        id: 'score',
        header: 'Score',
        cell: (ctx) => {
          const v = ctx.getValue()
          return v != null ? (
            <span className="tabular-nums text-amber-200/90">{v}</span>
          ) : (
            '—'
          )
        },
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Estado',
        cell: (ctx) => <LeadStatusBadge status={ctx.getValue()} />,
      }),
      columnHelper.accessor('wa_msg1_sent_at', {
        id: 'wa_msg1_sent_at',
        header: 'WA 1',
        cell: (ctx) => formatWaSent(ctx.getValue()),
      }),
      columnHelper.accessor('wa_msg2_sent_at', {
        id: 'wa_msg2_sent_at',
        header: 'WA 2',
        cell: (ctx) => formatWaSent(ctx.getValue()),
      }),
      columnHelper.display({
        id: 'video',
        header: 'Vídeo',
        cell: (ctx) => <VideoCell lead={ctx.row.original} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="block w-full text-right">Acciones</span>,
        cell: (ctx) => <LeadActions lead={ctx.row.original} />,
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-amber-500/12 bg-card/50 shadow-2xl shadow-black/35',
        'backdrop-blur-md supports-[backdrop-filter]:bg-card/40',
      )}
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-400/[0.04] to-transparent" />
        <Table className="relative">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-amber-500/10 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'h-11 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/55',
                      header.column.id === 'actions'
                        ? 'text-right text-amber-200/55'
                        : '',
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="border-amber-500/10 hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center text-sm text-stone-500"
                >
                  No hay leads con estos filtros. Prueba “Todos” o refresca más
                  tarde.
                </TableCell>
              </TableRow>
            ) : (
              table
                .getRowModel()
                .rows.map((row) => (
                  <LeadRow key={row.id} row={row} onOpen={onOpenLead} />
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
