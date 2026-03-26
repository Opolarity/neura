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

export function StateSelect() {
  const { state, setState, country } = useLocationSelector()

  const { data: states = [], isLoading } = useQuery({
    queryKey: ["states", country],
    queryFn: () => getStates(Number(country)),
    enabled: !!country,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="state">Departamento</Label>
      <Select value={state} onValueChange={setState} disabled={!country || (!isLoading && states.length === 0)}>
        <SelectTrigger id="state">
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
    </div>
  )
}
