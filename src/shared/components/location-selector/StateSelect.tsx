import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocationSelector } from "./LocationContext"
import { getStates } from "@/shared/services/service"

type Props = {
  value?: string
  onChange?: (v: string) => void
  error?: string
  className?: string
  labelClassName?: string
}

export const StateSelect = React.memo(function StateSelect({ value, onChange, error, className, labelClassName }: Props) {
  const { state, setState, country } = useLocationSelector()

  const { data: states = [], isLoading } = useQuery({
    queryKey: ["states", country],
    queryFn: () => getStates(Number(country)),
    enabled: !!country,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const handleChange = (v: string) => {
    setState(v)
    onChange?.(v)
  }

  return (
    <div className={`relative flex flex-col gap-2 pb-5${className ? ` ${className}` : ""}`}>
      <Label htmlFor="state" className={labelClassName}>Departamento</Label>
      <Select value={value ?? state} onValueChange={handleChange} disabled={!country || (!isLoading && states.length === 0)}>
        <SelectTrigger id="state" className={error ? "border-destructive" : ""}>
          <SelectValue placeholder="Seleccione" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground px-2 py-1">Cargando...</p>
          ) : (
            states.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="absolute left-0 bottom-0 text-sm text-destructive">{error}</p>}
    </div>
  )
})
