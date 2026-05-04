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

function formatShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

function locationShort(lead: Lead): string {
  const lbl = lead.location_label?.trim()
  if (lbl) return lbl
  const parts = [lead.neighborhood, lead.city].filter(Boolean).join(', ')
  return parts || '—'
}

const columnHelper = createColumnHelper<Lead>()

interface Props {
  leads: Lead[]
  onOpenLead: (id: string) => void
  onAfterLeadAction?: () => void
}

export function PotencialesFundamentalesTable({
  leads,
  onOpenLead,
  onAfterLeadAction,
}: Props) {
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
      columnHelper.accessor('email', {
        id: 'email',
        header: 'Email',
        cell: (ctx) => ctx.getValue() ?? '—',
      }),
      columnHelper.accessor('whatsapp_phone', {
        id: 'whatsapp_phone',
        header: 'WhatsApp',
        cell: (ctx) => ctx.getValue() ?? '—',
      }),
      columnHelper.accessor('sector', {
        id: 'sector',
        header: 'Sector',
        cell: (ctx) => ctx.getValue() ?? '—',
      }),
      columnHelper.display({
        id: 'ubicacion',
        header: 'Ubicación',
        cell: (ctx) => (
          <span className="truncate" title={locationShort(ctx.row.original)}>
            {locationShort(ctx.row.original)}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Estado',
        cell: (ctx) => <LeadStatusBadge status={ctx.getValue()} />,
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
      columnHelper.accessor('created_at', {
        id: 'created_at',
        header: 'Alta',
        cell: (ctx) => formatShort(ctx.getValue()),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="block w-full text-right">Acciones</span>,
        cell: (ctx) => (
          <LeadActions
            lead={ctx.row.original}
            onAfterLogged={onAfterLeadAction}
          />
        ),
      }),
    ],
    [onAfterLeadAction],
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
      <div className="relative overflow-x-auto">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-400/[0.04] to-transparent" />
        <Table className="relative min-w-[960px]">
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
                      header.column.id === 'actions' ? 'text-right' : '',
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
                  No hay clientes potenciales con estos criterios.
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
