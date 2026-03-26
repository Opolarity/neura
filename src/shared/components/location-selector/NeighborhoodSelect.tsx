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
import { getNeighborhoods } from "@/shared/services/service"

type Props = {
  value?: string
  onChange?: (v: string) => void
  error?: string
  className?: string
  labelClassName?: string
}

export const NeighborhoodSelect = React.memo(function NeighborhoodSelect({ value, onChange, error, className, labelClassName }: Props) {
  const { neighborhood, setNeighborhood, city } = useLocationSelector()

  const { data: neighborhoods = [], isLoading } = useQuery({
    queryKey: ["neighborhoods", city],
    queryFn: () => getNeighborhoods(Number(city)),
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const handleChange = (v: string) => {
    setNeighborhood(v)
    onChange?.(v)
  }

  return (
    <div className={`relative flex flex-col gap-2 pb-5${className ? ` ${className}` : ""}`}>
      <Label htmlFor="neighborhood" className={labelClassName}>Distrito</Label>
      <Select value={value ?? neighborhood} onValueChange={handleChange} disabled={!city || (!isLoading && neighborhoods.length === 0)}>
        <SelectTrigger id="neighborhood" className={error ? "border-destructive" : ""}>
          <SelectValue placeholder="Seleccione" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground px-2 py-1">Cargando...</p>
          ) : (
            neighborhoods.map((n) => (
              <SelectItem key={n.id} value={String(n.id)}>
                {n.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="absolute left-0 bottom-0 text-sm text-destructive">{error}</p>}
    </div>
  )
})
