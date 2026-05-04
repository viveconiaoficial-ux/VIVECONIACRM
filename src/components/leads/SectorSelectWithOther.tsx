import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SECTORS, SECTOR_OTRO } from '@/constants'

const NONE = '__none__'

function parseStored(value: string | null | undefined): {
  key: string
  manual: string
} {
  const v = value?.trim() ?? ''
  if (!v) return { key: NONE, manual: '' }
  if ((SECTORS as readonly string[]).includes(v)) return { key: v, manual: '' }
  return { key: SECTOR_OTRO, manual: v }
}

interface SectorSelectWithOtherProps {
  id?: string
  value: string | null | undefined
  onChange: (sector: string | null) => void
  selectClassName?: string
  inputClassName?: string
  inputPlaceholder?: string
}

/**
 * Lista de sectores; al elegir «Otro» aparece un campo de texto libre.
 * Si el valor guardado no coincide con la lista, se muestra como «Otro» + texto.
 */
export function SectorSelectWithOther({
  id,
  value,
  onChange,
  selectClassName,
  inputClassName,
  inputPlaceholder = 'Escribe el sector a medida…',
}: SectorSelectWithOtherProps) {
  const [selectKey, setSelectKey] = useState<string>(NONE)
  const [manual, setManual] = useState('')

  useEffect(() => {
    const p = parseStored(value)
    setSelectKey(p.key)
    setManual(p.manual)
  }, [value])

  return (
    <div className="space-y-2">
      <Select
        value={selectKey}
        onValueChange={(key) => {
          setSelectKey(key)
          if (key === NONE) {
            setManual('')
            onChange(null)
            return
          }
          if (key === SECTOR_OTRO) {
            setManual('')
            onChange(null)
            return
          }
          setManual('')
          onChange(key)
        }}
      >
        <SelectTrigger
          id={id}
          className={
            selectClassName ??
            'rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100'
          }
        >
          <SelectValue placeholder="Elegir…" />
        </SelectTrigger>
        <SelectContent className="border-amber-500/15 bg-popover text-popover-foreground">
          <SelectItem value={NONE}>— Ninguno</SelectItem>
          {SECTORS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectKey === SECTOR_OTRO ? (
        <Input
          value={manual}
          onChange={(e) => {
            const t = e.target.value
            setManual(t)
            const trimmed = t.trim()
            onChange(trimmed || null)
          }}
          placeholder={inputPlaceholder}
          className={
            inputClassName ??
            'rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600'
          }
          aria-label="Sector personalizado"
        />
      ) : null}
    </div>
  )
}
