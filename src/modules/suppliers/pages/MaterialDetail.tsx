import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { PageLoader } from "@/shared/components/page-loader";
import { toast } from "@/shared/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useAddMaterial } from "../hooks/useAddMaterial";
import { MaterialForm } from "../components/materials/MaterialForm";
import { MaterialPriceHistory } from "../components/materials/MaterialPriceHistory";
import {
  materialByIdApi,
  materialPriceHistoryApi,
} from "../services/materials.service";
import {
  Material,
  MaterialPriceHistoryRow,
} from "../types/materials.types";

/**
 * La ficha del material, como página.
 *
 * Era un modal, y se quedó pequeño: entre los datos, el stock por almacén y el
 * historial de precios ya no cabe en un diálogo. El modal sigue existiendo
 * para las altas en línea (ver AddMaterialModal).
 */
const MaterialDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isNew = !id || id === "new";
  const materialId = isNew ? null : Number(id);

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(!isNew);

  const [history, setHistory] = useState<MaterialPriceHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(!isNew);
  const [historyPagination, setHistoryPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const loadMaterial = useCallback(async () => {
    if (materialId === null) return;
    try {
      setLoading(true);
      const found = await materialByIdApi(materialId);
      if (!found) {
        toast({ title: "Material no encontrado", variant: "destructive" });
        navigate("/suppliers/materials");
        return;
      }
      setMaterial(found);
    } catch (error: any) {
      toast({
        title: "Error al cargar el material: " + error.message,
        variant: "destructive",
      });
      navigate("/suppliers/materials");
    } finally {
      setLoading(false);
    }
  }, [materialId, navigate]);

  const loadHistory = useCallback(
    async (page: number, size: number) => {
      if (materialId === null) return;
      try {
        setHistoryLoading(true);
        const { data, pagination } = await materialPriceHistoryApi(
          materialId,
          page,
          size,
        );
        setHistory(data);
        setHistoryPagination(pagination);
      } catch (error) {
        console.error("Error loading price history:", error);
        // El historial es contexto, no el contenido de la pantalla: si falla,
        // la ficha tiene que seguir editándose.
        toast({
          title: "No se pudo cargar el historial de precios",
          variant: "destructive",
        });
      } finally {
        setHistoryLoading(false);
      }
    },
    [materialId],
  );

  useEffect(() => {
    loadMaterial();
  }, [loadMaterial]);

  useEffect(() => {
    loadHistory(1, 20);
  }, [loadHistory]);

  const hook = useAddMaterial({
    material,
    onSuccess: () => navigate("/suppliers/materials"),
  });

  const { isEditing, loadingCatalogs, submitting, handleSubmit } = hook;

  if (loading) return <PageLoader />;

  // Flujo normal con scroll de pagina, como la ficha de producto. Con altura
  // fija y sin scroll, el formulario --que crecio con la tarjeta de imagenes--
  // dejaba a la tarjeta de ordenes de compra sin sitio: se encogia a cero y
  // desaparecia sin error.
  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* El ArrowLeft de volver sí se queda: es navegación, no decoración. */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/suppliers/materials")}
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {isNew ? "Nuevo material" : material?.name || "Material"}
        </h1>
      </div>

      {/* Sin Card ni rejilla propias: el formulario trae sus dos columnas y sus
          tarjetas, como la ficha de producto. Envolverlo en otra Card metía una
          caja dentro de otra, y la rejilla `sm:grid-cols-2` repartía los campos
          por orden de aparición en vez de por lo que son. */}
      <MaterialForm hook={hook} />

      {/* El historial solo existe cuando el material existe: un material que
          se está creando no se ha cotizado nunca. */}
      {/* Altura propia con scroll interno, como toda tabla del ERP: asi se ve
          siempre, crezca lo que crezca el formulario de arriba. */}
      {!isNew && (
        <Card className="flex h-[28rem] shrink-0 flex-col overflow-hidden">
          <CardHeader className="!p-4">
            <h2 className="text-sm font-semibold">Órdenes de compra</h2>
            <p className="text-muted-foreground text-xs">
              Lo que se ha pagado por este material y a quién. El precio y el
              proveedor de la ficha salen siempre de la cotización más reciente,
              marcada como «En uso».
            </p>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-auto p-0">
            <MaterialPriceHistory rows={history} loading={historyLoading} />
          </CardContent>

          <CardFooter className="!p-0">
            <PaginationBar
              pagination={historyPagination}
              onPageChange={(page) => loadHistory(page, historyPagination.p_size)}
              onPageSizeChange={(size) => loadHistory(1, size)}
            />
          </CardFooter>
        </Card>
      )}

      <div className="flex justify-end gap-2 pb-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/suppliers/materials")}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || loadingCatalogs}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar cambios" : "Crear material"}
        </Button>
      </div>
    </div>
  );
};

export default MaterialDetail;
