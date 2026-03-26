import { createContext, useContext } from "react"

export type LocationContextType = {
  country: string
  state: string
  city: string
  neighborhood: string
  setCountry: (v: string) => void
  setState: (v: string) => void
  setCity: (v: string) => void
  setNeighborhood: (v: string) => void
}

export const LocationContext = createContext<LocationContextType | null>(null)

export function useLocationSelector() {
  const ctx = useContext(LocationContext)
  if (!ctx) {
    throw new Error("LocationSelector debe envolver a sus hijos")
  }
  return ctx
}