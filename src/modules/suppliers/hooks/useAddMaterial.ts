import { useState, useEffect } from "react";
import {
  classesByModuleCode,
  getWarehousesIsActiveTrue,
} from "@/shared/services/service";
import { Class } from "@/types/index";
import { Warehouse } from "@/types/warehouse";
import { toast } from "@/shared/hooks/use-toast";
import {
  Material,
  MaterialClass,
  MaterialStockEntry,
  MeasurementUnit,
  SupplierOption,
} from "../types/materials.types";
import {
  createMaterialApi,
  createMaterialClassApi,
  updateMaterialClassApi,
  materialClassesApi,
  materialStockApi,
  measurementUnitsApi,
  removeMaterialImageApi,
  supplierOptionsApi,
  updateMaterialApi,
  uploadMaterialImageApi,
} from "../services/materials.service";
import { MaterialOption } from "../types/services.types";

interface UseAddMaterialOptions {
  /** Material a editar. Si no se pasa, el formulario funciona en modo creación. */
  material?: Material | null;
  /**
   * Se ejecuta tras crear o actualizar el material, y recibe cómo quedó, con
   * su id. Las dos ramas lo devuelven: quien abrió el formulario desde otra
   * pantalla -- una línea de receta, por ejemplo -- necesita el nombre, la
   * clase, la unidad y el costo nuevos para refrescar lo que ya tenía pintado
   * sin recargar.
   */
  onSuccess?: (created?: MaterialOption) => void;
}

const emptyForm = {
  name: "",
  supplier_id: "",
  material_class_id: "",
  measurement_unit: "",
  unit_cost: "",
};

export const useAddMaterial = ({
  material = null,
  onSuccess,
}: UseAddMaterialOptions = {}) => {
  const isEditing = Boolean(material);

  const [classes, setClasses] = useState<MaterialClass[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  /** Alta de proveedor en línea, sin salir del material. */
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockTypes, setStockTypes] = useState<Class[]>([]);
  /**
   * El stock por almacen y tipo, con la misma forma que en productos: una
   * entrada plana por combinacion. En la edicion arranca con lo que el
   * material ya tiene; en el alta, vacio.
   */
  const [stockEntries, setStockEntries] = useState<MaterialStockEntry[]>([]);
  /** El tipo de inventario que se esta editando, como en la pantalla de producto. */
  const [selectedStockType, setSelectedStockType] = useState<number | null>(null);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [form, setForm] = useState(
    material
      ? {
          name: material.name,
          supplier_id: material.supplierId?.toString() ?? "",
          material_class_id: material.materialClassId.toString(),
          measurement_unit: material.measurementUnit,
          unit_cost: material.unitCost === null ? "" : material.unitCost.toString(),
        }
      : emptyForm
  );

  /**
   * Las fotos del material, como URLs ya subidas.
   *
   * Se suben en cuanto se eligen, no al guardar: así el alta y la edición van
   * por el mismo camino -- el formulario manda la lista y el backend la guarda
   * -- y no hace falta esperar a tener un id para colgarlas.
   */
  const [images, setImages] = useState<string[]>(material?.images ?? []);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  const [classSearch, setClassSearch] = useState("");
  const [newClassDialogOpen, setNewClassDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  /** De qué clase cuelga la nueva. "" = de ninguna. */
  const [newClassParentId, setNewClassParentId] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [materialClasses, supplierList, unitList, warehouseList, stockTypeList] =
          await Promise.all([
            materialClassesApi(),
            supplierOptionsApi(),
            measurementUnitsApi(),
            getWarehousesIsActiveTrue(),
            // Los tipos de stock son los mismos que usan los productos.
            classesByModuleCode("STK"),
          ]);
        setClasses(materialClasses);
        setSuppliers(supplierList);
        setUnits(unitList);
        setWarehouses(warehouseList);
        setStockTypes(stockTypeList);

        // Se arranca en PRD, que es el tipo por defecto de todo el sistema.
        // Si el tenant no lo tuviera, vale el primero antes que dejar la
        // tabla sin tipo y las celdas sin saber a que corresponden.
        const porDefecto =
          stockTypeList.find((t) => t.code === "PRD") ?? stockTypeList[0];
        if (porDefecto) setSelectedStockType(porDefecto.id);
      } catch (error: any) {
        toast({ title: "Error al cargar datos iniciales", variant: "destructive" });
      } finally {
        setLoadingCatalogs(false);
      }
    };
    loadCatalogs();
  }, []);

  // ---- Stock por almacen y tipo -----------------------------------------
  //
  // Mismo modelo que la pantalla de producto: un selector de tipo de
  // inventario y una celda por almacen. Cambiar de tipo no pierde lo escrito
  // en el otro, porque cada entrada lleva su par (almacen, tipo).

  const getStockFor = (warehouseId: number): number | undefined =>
    stockEntries.find(
      (entry) =>
        entry.warehouseId === warehouseId &&
        entry.stockTypeId === selectedStockType,
    )?.stock;

  const setStockFor = (warehouseId: number, value: string) => {
    if (selectedStockType === null) return;

    setStockEntries((prev) => {
      const i = prev.findIndex(
        (entry) =>
          entry.warehouseId === warehouseId &&
          entry.stockTypeId === selectedStockType,
      );
      // Vaciar la celda NO es poner cero: es no tocar ese almacen. Para
      // dejarlo en cero se escribe 0.
      const entry: MaterialStockEntry = {
        warehouseId,
        stockTypeId: selectedStockType,
        stock: value === "" ? undefined : Number(value),
      };

      if (i >= 0) {
        const next = [...prev];
        next[i] = entry;
        return next;
      }
      return [...prev, entry];
    });
  };

  /**
   * El material puede llegar DESPUES del montaje.
   *
   * En el modal venia como prop desde el listado, asi que el estado inicial
   * bastaba. En la ficha se carga por id, y en el primer render `material` es
   * null: sin esto el formulario se quedaba vacio y el stock sin cargar para
   * siempre, porque el useState y el efecto de catalogos solo corren una vez.
   */
  useEffect(() => {
    setForm(
      material
        ? {
            name: material.name,
            supplier_id: material.supplierId?.toString() ?? "",
            material_class_id: material.materialClassId.toString(),
            measurement_unit: material.measurementUnit,
            unit_cost:
              material.unitCost === null ? "" : material.unitCost.toString(),
          }
        : emptyForm,
    );
    setImages(material?.images ?? []);

    if (!material) {
      setStockEntries([]);
      return;
    }

    let cancelado = false;
    materialStockApi(material.id)
      .then((entries) => {
        if (!cancelado) setStockEntries(entries);
      })
      .catch((error) => {
        console.error("Error loading material stock:", error);
        toast({
          title: "No se pudo cargar el stock del material",
          variant: "destructive",
        });
      });

    return () => {
      cancelado = true;
    };
  }, [material?.id]);

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * La clase que se esta editando, o null si se esta creando una.
   *
   * El mismo bloque hace las dos cosas: con id, guarda encima; sin el, crea.
   * Separarlos en dos formularios identicos habria sido copiar el selector de
   * padre para cambiarle el verbo al boton.
   */
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  /** Abre el bloque cargado con lo que la clase tiene ahora. */
  const startEditingClass = (classId: number) => {
    const clase = classes.find((c) => c.id === classId);
    if (!clase) return;
    setEditingClassId(classId);
    setNewClassName(clase.name);
    setNewClassParentId(
      clase.parent_class_id ? String(clase.parent_class_id) : "",
    );
    setNewClassDialogOpen(true);
  };

  /** Vuelve al alta: mismo bloque, en blanco. */
  const cancelEditingClass = () => {
    setEditingClassId(null);
    setNewClassName("");
    setNewClassParentId("");
  };

  const handleSaveClass = async () => {
    if (!newClassName.trim()) return;

    // Una clase no puede colgar de si misma. Es la unica forma de montar un
    // ciclo desde este formulario, y la base no lo impide.
    if (
      editingClassId !== null &&
      newClassParentId !== "" &&
      Number(newClassParentId) === editingClassId
    ) {
      toast({
        title: "Una clase no puede ser su propia familia",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingClass(true);

      const guardada =
        editingClassId !== null
          ? await updateMaterialClassApi(
              editingClassId,
              newClassName.trim(),
              newClassParentId === "" ? null : Number(newClassParentId),
            )
          : await createMaterialClassApi(
              newClassName.trim(),
              newClassParentId === "" ? null : Number(newClassParentId),
            );

      const updated = await materialClassesApi();
      setClasses(updated);
      // Al crear se deja elegida; al editar no se toca la seleccion -- se
      // estaba corrigiendo un nombre, no cambiando de clase.
      if (editingClassId === null) {
        setField("material_class_id", guardada.id.toString());
      }
      setNewClassName("");
      setNewClassParentId("");
      setEditingClassId(null);
      setNewClassDialogOpen(false);
      toast({
        title:
          editingClassId !== null
            ? `Clase "${guardada.name}" actualizada`
            : `Clase "${guardada.name}" creada`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title:
          (editingClassId !== null
            ? "Error al actualizar clase: "
            : "Error al crear clase: ") + error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingClass(false);
    }
  };


  /**
   * Subir fotos. Van al storage al momento y solo se queda la URL; si una
   * falla, las demás se conservan y se avisa de la que no entró.
   */
  const addImages = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingImages(true);
    try {
      const subidas: string[] = [];
      let fallidas = 0;
      for (const file of files) {
        try {
          subidas.push(await uploadMaterialImageApi(file));
        } catch (error) {
          console.error("Error uploading material image:", error);
          fallidas += 1;
        }
      }
      if (subidas.length > 0) setImages((prev) => [...prev, ...subidas]);
      if (fallidas > 0) {
        toast({
          title:
            fallidas === 1
              ? "Una imagen no se pudo subir"
              : `${fallidas} imágenes no se pudieron subir`,
          variant: "destructive",
        });
      }
    } finally {
      setUploadingImages(false);
    }
  };

  /**
   * Quitar una foto de la lista. Del storage se borra a lo mejor: lo que
   * manda es la lista, que es lo que se guarda con el formulario.
   */
  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((image) => image !== url));
    void removeMaterialImageApi(url);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    if (!form.material_class_id) {
      toast({ title: "La clase de material es obligatoria", variant: "destructive" });
      return;
    }
    // Las raices --TELA, AVIOS-- son familias, no clases de un material: se
    // clasifica en algo que PERTENECE a ellas. Se comprueba tambien aqui y no
    // solo pintando el panel: un material antiguo puede traer ya una raiz
    // guardada, y sin esto se volveria a guardar sin que nadie lo note.
    //
    // La regla vive en la pantalla y no en la base, igual que en
    // 202610010027: no hay candado en SQL, y ponerlo invalidaria de golpe
    // todo lo que hoy cuelga de una raiz.
    const claseElegida = classes.find(
      (c) => c.id.toString() === form.material_class_id
    );
    if (claseElegida && !claseElegida.parent_class_id) {
      toast({
        title: `«${claseElegida.name}» es una familia, no una clase`,
        description: "Elige una clase concreta de las que cuelgan de ella.",
        variant: "destructive",
      });
      return;
    }
    // Ya no es texto libre: se elige del catalogo, asi que basta con que haya
    // algo seleccionado. El backend vuelve a validarlo contra `types`.
    if (!form.measurement_unit) {
      toast({ title: "La unidad de medida es obligatoria", variant: "destructive" });
      return;
    }

    // Con una celda por almacen ya no puede haber lineas sin almacen ni dos
    // para el mismo par: el formulario no deja construirlas.
    if (stockEntries.some((entry) => entry.stock !== undefined && isNaN(entry.stock))) {
      toast({ title: "Hay cantidades de stock no numéricas", variant: "destructive" });
      return;
    }

    if (form.unit_cost !== "" && isNaN(Number(form.unit_cost))) {
      toast({ title: "El costo unitario debe ser numérico", variant: "destructive" });
      return;
    }

    const payload = {
      name: form.name.trim(),
      // Sin proveedor es un estado valido: el insumo existe en la receta antes
      // de decidir a quien se le compra. Al llegar la primera cotizacion, el
      // trigger de situaciones le escribe el proveedor real.
      supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
      material_class_id: parseInt(form.material_class_id),
      measurement_unit: form.measurement_unit,
      // Solo las celdas con valor. Una celda vacia no es una orden de poner el
      // stock en cero: es una celda que nadie toco.
      stock: stockEntries
        .filter((entry) => entry.stock !== undefined)
        .map((entry) => ({
          warehouse_id: entry.warehouseId,
          stock_type_id: entry.stockTypeId,
          quantity: entry.stock as number,
        })),
      unit_cost: form.unit_cost === "" ? null : Number(form.unit_cost),
      // La lista completa: en la edición reemplaza la anterior.
      images,
    };

    try {
      setSubmitting(true);

      let created: MaterialOption | undefined;

      if (isEditing && material) {
        await updateMaterialApi({ id: material.id, ...payload });
        // Cómo quedó, armado con lo que se acaba de guardar. update-material no
        // devuelve la fila, y pedirla otra vez seria una ida y vuelta para
        // enterarse de algo que ya se sabe.
        created = {
          id: material.id,
          name: payload.name,
          unitCost: payload.unit_cost,
          measurementUnit: payload.measurement_unit,
          materialClassId: payload.material_class_id,
          materialClassName:
            classes.find((c) => c.id === payload.material_class_id)?.name ??
            null,
        };
        toast({ title: "Material actualizado exitosamente", variant: "success" });
      } else {
        // createMaterialApi devuelve el material con su id y hasta ahora se
        // descartaba: es lo que deja seleccionarlo donde se abrio el alta.
        created = await createMaterialApi(payload);
        // El alta sí sabe cómo se llama la clase elegida; la respuesta de
        // create-material no siempre la trae, y sin ella la línea de la receta
        // se quedaría sin clase hasta la siguiente recarga.
        if (created && !created.materialClassName) {
          created = {
            ...created,
            materialClassName:
              classes.find((c) => c.id === created!.materialClassId)?.name ??
              null,
          };
        }
        toast({ title: "Material creado exitosamente", variant: "success" });
      }

      onSuccess?.(created);
    } catch (error: any) {
      toast({
        title: (isEditing ? "Error al actualizar material: " : "Error al crear material: ") +
          error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSupplierName =
    suppliers.find((s) => s.id.toString() === form.supplier_id)?.name ??
    (isEditing ? material?.supplierName ?? "" : "");

  /**
   * Un proveedor recién creado desde aquí se selecciona solo.
   *
   * Si hubo que crearlo es porque es el de este material, y hacerlo buscar
   * después de haber tecleado su nombre sería pedirle el dato dos veces. Se
   * recarga la lista sin filtro para que el combobox tenga la opción.
   *
   * Mismo comportamiento que el alta de proveedor del diálogo «Cotizar».
   */
  const supplierCreated = async (supplierId: number) => {
    setSupplierSearch("");
    setAddSupplierOpen(false);
    try {
      const lista = await supplierOptionsApi();
      setSuppliers(lista);
    } catch (error) {
      console.error(error);
    }
    // Se asigna aunque la recarga falle: el material ya tiene proveedor y la
    // lista se rellenará al reabrir.
    setField("supplier_id", String(supplierId));
    setSupplierSearchOpen(false);
  };

  return {
    addSupplierOpen,
    setAddSupplierOpen,
    supplierCreated,
    images,
    uploadingImages,
    addImages,
    removeImage,
    isEditing,
    classes,
    units,
    warehouses,
    stockTypes,
    selectedStockType,
    setSelectedStockType,
    getStockFor,
    setStockFor,
    suppliers,
    loadingCatalogs,
    form,
    setField,
    selectedSupplierName,
    supplierSearchOpen,
    setSupplierSearchOpen,
    supplierSearch,
    setSupplierSearch,
    classSearch,
    setClassSearch,
    newClassDialogOpen,
    setNewClassDialogOpen,
    newClassName,
    setNewClassName,
    newClassParentId,
    setNewClassParentId,
    creatingClass,
    handleSaveClass,
    editingClassId,
    startEditingClass,
    cancelEditingClass,
    submitting,
    handleSubmit,
  };
};
