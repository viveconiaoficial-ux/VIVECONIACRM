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

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

function budgetCell(lead: Lead): string {
  if (lead.deal_budget_amount == null) return '—'
  return `${lead.deal_budget_amount} ${lead.deal_budget_currency ?? 'EUR'}`
}

const columnHelper = createColumnHelper<Lead>()

interface Props {
  leads: Lead[]
  onOpenLead: (id: string) => void
  onAfterLeadAction?: () => void
}

export function ClientesAceptadosTable({
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
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Estado',
        cell: (ctx) => <LeadStatusBadge status={ctx.getValue()} />,
      }),
      columnHelper.accessor('deal_accepted_at', {
        id: 'deal_accepted_at',
        header: 'Aceptación',
        cell: (ctx) => formatDateTime(ctx.getValue()),
      }),
      columnHelper.display({
        id: 'presupuesto',
        header: 'Presupuesto',
        cell: (ctx) => (
          <span className="tabular-nums text-stone-200">
            {budgetCell(ctx.row.original)}
          </span>
        ),
      }),
      columnHelper.accessor('deal_next_followup_at', {
        id: 'deal_next_followup_at',
        header: 'Próx. seguimiento',
        cell: (ctx) => formatDateTime(ctx.getValue()),
      }),
      columnHelper.accessor('deal_closed_at', {
        id: 'deal_closed_at',
        header: 'Cierre / cobro',
        cell: (ctx) => formatDateTime(ctx.getValue()),
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-400/[0.04] to-transparent" />
        <Table className="relative min-w-[880px]">
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
                  Nadie ha pasado aún a cliente. Marca aceptación o estado
                  ganado en la ficha, o ejecuta la migración 006 en Supabase.
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
