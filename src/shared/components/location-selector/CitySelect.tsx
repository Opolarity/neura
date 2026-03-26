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
import { getCities } from "@/shared/services/service"

type Props = {
  value?: string
  onChange?: (v: string) => void
  error?: string
  className?: string
  labelClassName?: string
}

export const CitySelect = React.memo(function CitySelect({ value, onChange, error, className, labelClassName }: Props) {
  const { city, setCity, state } = useLocationSelector()

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["cities", state],
    queryFn: () => getCities(Number(state)),
    enabled: !!state,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const handleChange = (v: string) => {
    setCity(v)
    onChange?.(v)
  }

  return (
    <div className={`relative flex flex-col gap-2 pb-5${className ? ` ${className}` : ""}`}>
      <Label htmlFor="city" className={labelClassName}>Provincia</Label>
      <Select value={value ?? city} onValueChange={handleChange} disabled={!state || (!isLoading && cities.length === 0)}>
        <SelectTrigger id="city" className={error ? "border-destructive" : ""}>
          <SelectValue placeholder="Seleccione" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground px-2 py-1">Cargando...</p>
          ) : (
            cities.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="absolute left-0 bottom-0 text-sm text-destructive">{error}</p>}
    </div>
  )
})
