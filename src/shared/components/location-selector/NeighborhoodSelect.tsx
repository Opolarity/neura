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

export function NeighborhoodSelect() {
  const { neighborhood, setNeighborhood, city } = useLocationSelector()

  const { data: neighborhoods = [], isLoading } = useQuery({
    queryKey: ["neighborhoods", city],
    queryFn: () => getNeighborhoods(Number(city)),
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="neighborhood">Distrito</Label>
      <Select value={neighborhood} onValueChange={setNeighborhood} disabled={!city || (!isLoading && neighborhoods.length === 0)}>
        <SelectTrigger id="neighborhood">
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
    </div>
  )
}
