import { useEffect, useState } from "react";
import { useCutFabricSearch } from "./useCutFabric";
import {
  CutFabricInput,
  CutFabricLine,
  CutFabricOption,
  CutFabricUsage,
  CutFabricWarehouse,
} from "../types/cutFabric.types";

/** Una fila de tela mientras se edita: los números van como texto. */
export interface TelaFila {
  key: number;
  materialVariationId: number | null;
  label: string;
  unit: string | null;
  /** Stock de la tela por almacén; vacío si no se conoce (línea ya guardada). */
  stock: CutFabricOption["stock"];
  warehouseId: number | null;
  usage: CutFabricUsage | null;
  /** El total utilizado y lo que sobró, escritos directo (202611040003). */
  used: string;
  leftover: string;
  /**
   * Línea ya guardada de la O/C: lo que puede usar al corregir (stock del
   * almacén + lo que ya descontó) y de qué almacén es ese número.
   */
  available: number | null;
  availableWarehouseId: number | null;
}

export const esDecimal = (texto: string) => /^\d+([.,]\d+)?$/.test(texto.trim());
export const aNumero = (texto: string) => Number(texto.trim().replace(",", "."));
/** Sin el ruido del punto flotante: 250.1 − 10 no da 240.09999999999999. */
const redondear = (valor: number) => Math.round(valor * 10000) / 10000;
const fmtTela = (value: number) => value.toLocaleString("es-PE", { maximumFractionDigits: 4 });

/** El total utilizado; null mientras no sea válido. */
export const totalDeFila = (fila: TelaFila): number | null => (esDecimal(fila.used) ? aNumero(fila.used) : null);

const sobranteDe = (fila: TelaFila): number =>
  fila.leftover.trim() === "" ? 0 : esDecimal(fila.leftover) ? aNumero(fila.leftover) : NaN;

/** Utilizado − sobrante; null mientras alguno no sea válido. */
export const netoDeFila = (fila: TelaFila): number | null => {
  const total = totalDeFila(fila);
  const sobrante = sobranteDe(fila);
  return total === null || Number.isNaN(sobrante) ? null : redondear(total - sobrante);
};

/**
 * Cuánto se puede sacar del almacén elegido: en una línea ya guardada que no
 * cambió de almacén, su `available`; si no, el stock del buscador. null si no
 * se conoce (lo valida el backend).
 */
export const limiteDeFila = (fila: TelaFila): number | null => {
  if (fila.warehouseId === null) return null;
  if (fila.available !== null && fila.warehouseId === fila.availableWarehouseId) return fila.available;
  return fila.stock.find((s) => s.warehouseId === fila.warehouseId)?.stock ?? null;
};

/** Lo que le falta a la fila para guardarse (aviso tenue), o null. */
export const faltaDeFila = (fila: TelaFila): string | null => {
  if (fila.materialVariationId === null) return "Elige la tela.";
  if (fila.usage === null) return "Elige el uso de la tela.";
  if (fila.warehouseId === null) return "Elige de qué almacén sale.";
  if (fila.used.trim() === "") return "Escribe el total utilizado.";
  return null;
};

/** Lo que está mal en la fila (va en rojo y no deja guardar), o null. */
export const errorDeFila = (fila: TelaFila): string | null => {
  if (fila.used.trim() !== "" && (!esDecimal(fila.used) || aNumero(fila.used) <= 0))
    return "El total utilizado es un número mayor que cero.";
  const total = totalDeFila(fila);
  const sobrante = sobranteDe(fila);
  if (Number.isNaN(sobrante)) return "El sobrante es un número.";
  if (total === null) return null;
  if (sobrante > total) return "El sobrante no pasa del total.";
  const limite = limiteDeFila(fila);
  const neto = redondear(total - sobrante);
  if (limite !== null && neto > limite) {
    const unidad = fila.unit ? ` ${fila.unit}` : "";
    return `Sin stock suficiente en el almacén: hay ${fmtTela(limite)}${unidad} y se quieren usar ${fmtTela(neto)}${unidad}.`;
  }
  return null;
};

/** El uso que se sugiere a cada tela nueva, en el orden en que suelen ir. */
const USOS_EN_ORDEN: CutFabricUsage[] = ["MAIN", "LINING", "COMPLEMENT"];

/**
 * La tela utilizada de un corte (202610280002 / 202610280004), en «Iniciar
 * corte»: las filas con su uso, el total utilizado, el sobrante (202611040003),
 * su validación contra el stock del almacén y lo que se manda a guardar.
 */
export const useTelaFilas = (open: boolean, fabrics: CutFabricLine[], warehouses: CutFabricWarehouse[]) => {
  const [tela, setTela] = useState<TelaFila[]>([]);
  const buscador = useCutFabricSearch(open);
  // Con un solo almacén no hay nada que elegir.
  const unicoAlmacen = warehouses.length === 1 ? warehouses[0].warehouseId : null;

  useEffect(() => {
    if (!open) return;
    setTela(
      fabrics.map((line, index) => ({
        key: index,
        materialVariationId: line.materialVariationId,
        label: line.label,
        unit: line.unit,
        stock: [],
        warehouseId: line.warehouseId ?? unicoAlmacen,
        usage: line.usage,
        used: line.used > 0 ? String(line.used) : "",
        leftover: String(line.leftover),
        available: line.available,
        availableWarehouseId: line.warehouseId,
      }))
    );
    // Solo al abrir o al cambiar de O/C: lo que se recargue no pisa lo escrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fabrics]);

  const telaInvalida = tela.some((fila) => faltaDeFila(fila) !== null || errorDeFila(fila) !== null);
  const telaRepetida = new Set(tela.map((fila) => fila.materialVariationId)).size !== tela.length;

  const filaNueva = (prev: TelaFila[]): TelaFila => ({
    key: Math.max(-1, ...prev.map((fila) => fila.key)) + 1,
    materialVariationId: null,
    label: "",
    unit: null,
    stock: [],
    warehouseId: unicoAlmacen,
    // Principal, Forro y Complemento: el primero que falte.
    usage: USOS_EN_ORDEN.find((uso) => !prev.some((fila) => fila.usage === uso)) ?? null,
    used: "",
    leftover: "",
    available: null,
    availableWarehouseId: null,
  });

  const agregarTela = () => setTela((prev) => [...prev, filaNueva(prev)]);
  const cambiarTela = (key: number, cambio: Partial<TelaFila>) =>
    setTela((prev) => prev.map((fila) => (fila.key === key ? { ...fila, ...cambio } : fila)));

  /** Elegir la tela: si solo hay stock en un almacén, sale de ese. */
  const elegirTela = (fila: TelaFila, id: number) => {
    const opcion = buscador.options.find((o) => o.materialVariationId === id);
    if (!opcion) return;
    const conStock = opcion.stock.filter((s) => s.stock > 0);
    const mismaTela = opcion.materialVariationId === fila.materialVariationId;
    cambiarTela(fila.key, {
      materialVariationId: opcion.materialVariationId,
      label: opcion.label,
      unit: opcion.unit,
      stock: opcion.stock,
      // Otra tela: lo disponible de la línea guardada ya no aplica.
      available: mismaTela ? fila.available : null,
      availableWarehouseId: mismaTela ? fila.availableWarehouseId : null,
      warehouseId:
        conStock.length === 1
          ? conStock[0].warehouseId
          : (unicoAlmacen ?? fila.warehouseId),
    });
  };

  const aGuardar = (): CutFabricInput[] =>
    tela.map((fila) => ({
      materialVariationId: fila.materialVariationId as number,
      warehouseId: fila.warehouseId as number,
      usage: fila.usage as CutFabricUsage,
      used: totalDeFila(fila) ?? 0,
      leftover: fila.leftover.trim() === "" ? 0 : aNumero(fila.leftover),
    }));

  return {
    tela,
    setTela,
    buscador,
    agregarTela,
    cambiarTela,
    elegirTela,
    telaInvalida,
    telaRepetida,
    aGuardar,
  };
};

export type TelaFilasState = ReturnType<typeof useTelaFilas>;
