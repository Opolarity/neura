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
import { getCountries } from "@/shared/services/service"

export function CountrySelect() {
  const { country, setCountry } = useLocationSelector()

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: getCountries,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="country">País</Label>
      <Select value={country} onValueChange={setCountry}>
        <SelectTrigger id="country">
          <SelectValue placeholder="Seleccione" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground px-2 py-1">Cargando...</p>
          ) : (
            countries.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
