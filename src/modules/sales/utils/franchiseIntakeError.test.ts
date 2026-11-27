/**
 * Pruebas de los mensajes de error de "Enviar a franquiciado".
 * Sin dependencias: corren con el runner nativo de Node (24+ ejecuta TS):
 *
 *   node --test src/modules/sales/utils/franchiseIntakeError.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { franchiseIntakeErrorToast } from "./franchiseIntakeError.ts";

const body = (error: string) => JSON.stringify({ error });

describe("franchiseIntakeErrorToast", () => {
  it("tenant not found keeps the 'no usa Neura' title", () => {
    assert.deepEqual(franchiseIntakeErrorToast(422, body('Tenant "acme" no encontrado')), {
      title: "Franquiciado no usa Neura",
    });
  });

  it("missing Overtake supplier (S-339)", () => {
    assert.deepEqual(
      franchiseIntakeErrorToast(422, body("Supplier con documento RUC 20607798002 no encontrado")),
      {
        title: "Error al enviar",
        description: "Falta configurar a Overtake como proveedor en el franquiciado.",
      },
    );
  });

  it("missing Overtake service user", () => {
    assert.equal(
      franchiseIntakeErrorToast(422, body("Usuario con documento RUC 20607798002 no encontrado"))
        ?.description,
      "Falta configurar el usuario de Overtake en el franquiciado.",
    );
  });

  it("missing warehouse names the code", () => {
    assert.equal(
      franchiseIntakeErrorToast(422, body('Warehouse "WH-1" no encontrado'))?.description,
      'El franquiciado no tiene un almacén con código "WH-1".',
    );
  });

  it("other 422 messages are shown as they come", () => {
    const msg = "SKUs no encontrados y sin datos OVTK: ABC-1";
    assert.deepEqual(franchiseIntakeErrorToast(422, body(msg)), {
      title: "Error al enviar",
      description: msg,
    });
  });

  it("nothing to show: other status, non-JSON or empty error", () => {
    assert.equal(franchiseIntakeErrorToast(500, body("boom")), null);
    assert.equal(franchiseIntakeErrorToast(422, "<html>bad gateway</html>"), null);
    assert.equal(franchiseIntakeErrorToast(422, body("")), null);
  });
});
