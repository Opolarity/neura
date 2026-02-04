import { TypesApiResponse } from "../types/type"

export const getTypesAdapter = (responses: TypesApiResponse[]) => {
    return responses.flatMap(r =>
        r.types.map(t => ({
            id: t.id,
            name: t.name,
            code: t.code,
        }))
    )
}