import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import {
  AccountSearchResult,
  SupplierClass,
} from "../types/suppliers.types";
import {
  findAccountByDocumentApi,
  createSupplierApi,
  supplierClassesApi,
  createSupplierClassOptionApi,
  documentTypesApi,
} from "../services/suppliers.service";
import { typesByModuleCode } from "@/shared/services/service";

interface DocumentType {
  id: number;
  name: string;
  code: string;
}

interface UseAddSupplierOptions {
  /** Se ejecuta tras crear el proveedor. Si no se pasa, navega a /suppliers. */
  /** Recibe el id del proveedor creado, para poder seleccionarlo al vuelo. */
  onSuccess?: (supplierId: number) => void;
}

export const useAddSupplier = ({ onSuccess }: UseAddSupplierOptions = {}) => {
  const navigate = useNavigate();

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [classes, setClasses] = useState<SupplierClass[]>([]);
  /**
   * Los tipos de proveedor del módulo SPL: Materia prima, Taller y Todo
   * servicio. `suppliers_profile.supplier_type_id` es obligatorio en la base y
   * hasta ahora nadie lo mandaba, que es lo que tenía el alta rota.
   */
  const [supplierTypes, setSupplierTypes] = useState<{ id: number; name: string; code: string }[]>([]);
  const [supplierTypeId, setSupplierTypeId] = useState<string>("");

  const [searchDocTypeId, setSearchDocTypeId] = useState<string>("");
  const [searchDocNumber, setSearchDocNumber] = useState<string>("");
  const [searching, setSearching] = useState(false);

  const [accountResolved, setAccountResolved] = useState(false);
  const [existingAccount, setExistingAccount] = useState<AccountSearchResult | null>(null);

  const [formAccount, setFormAccount] = useState({
    name: "",
    middle_name: "",
    last_name: "",
    last_name2: "",
  });

  const [formSupplier, setFormSupplier] = useState({
    phone: "",
    email: "",
    address: "",
  });

  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [creatingClass, setCreatingClass] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [docTypes, supClasses, types] = await Promise.all([
          documentTypesApi(),
          supplierClassesApi(),
          typesByModuleCode("SPL"),
        ]);
        setDocumentTypes(docTypes);
        setClasses(supClasses);
        setSupplierTypes(types as any);
        // "Todo servicio" por defecto: es el que sirve cuando todavía no se
        // sabe si el proveedor vende material o hace servicio.
        const todoServicio = (types as any[]).find((t) => t.code === "ALL");
        setSupplierTypeId(String(todoServicio?.id ?? (types as any[])[0]?.id ?? ""));
      } catch (error: any) {
        toast({ title: "Error al cargar datos iniciales", variant: "destructive" });
      }
    };
    loadInitialData();
  }, []);

  const handleSearchAccount = async () => {
    if (!searchDocTypeId || !searchDocNumber.trim()) {
      toast({ title: "Ingresa el tipo y número de documento", variant: "destructive" });
      return;
    }
    try {
      setSearching(true);
      const account = await findAccountByDocumentApi(
        parseInt(searchDocTypeId),
        searchDocNumber.trim()
      );
      setExistingAccount(account);
      setAccountResolved(true);
      if (account) {
        toast({ title: "Cuenta encontrada", variant: "success" });
      } else {
        toast({ title: "No se encontró la cuenta. Completa los datos para crearla.", variant: "info" });
      }
    } catch (error: any) {
      toast({ title: "Error al buscar cuenta: " + error.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const resetSearch = () => {
    setAccountResolved(false);
    setExistingAccount(null);
    setSearchDocNumber("");
    setFormAccount({ name: "", middle_name: "", last_name: "", last_name2: "" });
    setFormSupplier({ phone: "", email: "", address: "" });
    setSelectedClassIds([]);
  };

  const toggleClass = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const refreshClasses = async () => {
    const updated = await supplierClassesApi();
    setClasses(updated);
  };

  const handleCreateClass = async (name: string) => {
    try {
      setCreatingClass(true);
      const created = await createSupplierClassOptionApi(name);
      await refreshClasses();
      setSelectedClassIds((prev) => [...prev, created.id]);
      toast({ title: `Clase "${created.name}" creada`, variant: "success" });
    } catch (error: any) {
      toast({ title: "Error al crear clase: " + error.message, variant: "destructive" });
    } finally {
      setCreatingClass(false);
    }
  };

  const handleSubmit = async () => {
    if (!accountResolved) {
      toast({ title: "Primero busca el documento del proveedor", variant: "destructive" });
      return;
    }
    if (!formSupplier.phone) {
      toast({ title: "El teléfono es obligatorio", variant: "destructive" });
      return;
    }
    if (selectedClassIds.length === 0) {
      toast({ title: "Debes asignar al menos una clase al proveedor", variant: "destructive" });
      return;
    }
    if (!supplierTypeId) {
      toast({ title: "Elige el tipo de proveedor", variant: "destructive" });
      return;
    }
    if (!existingAccount) {
      if (!formAccount.name || !formAccount.last_name) {
        toast({ title: "Nombre y primer apellido son obligatorios", variant: "destructive" });
        return;
      }
    }

    try {
      setSubmitting(true);

      // Una sola llamada: el SP resuelve la cuenta --la reutiliza si el
      // documento ya existe-- y crea perfil y clases en la misma transacción.
      // Cuando esto eran tres inserts sueltos, fallar en el segundo dejaba la
      // cuenta creada y el reintento moría con un "duplicate key".
      const { id: supplierId } = await createSupplierApi({
        document_type_id: parseInt(searchDocTypeId),
        document_number: searchDocNumber.trim(),
        // Con cuenta existente se mandan sus datos: el SP no los pisa, pero
        // son los obligatorios de la firma.
        name: existingAccount ? existingAccount.name : formAccount.name,
        middle_name: existingAccount
          ? existingAccount.middle_name || undefined
          : formAccount.middle_name || undefined,
        last_name: existingAccount
          ? existingAccount.last_name || undefined
          : formAccount.last_name,
        last_name2: existingAccount
          ? existingAccount.last_name2 || undefined
          : formAccount.last_name2 || undefined,
        phone: parseInt(formSupplier.phone),
        email: formSupplier.email || undefined,
        address: formSupplier.address || undefined,
        supplier_type_id: supplierTypeId ? parseInt(supplierTypeId) : null,
        class_ids: selectedClassIds,
      });

      toast({ title: "Proveedor creado exitosamente", variant: "success" });
      if (onSuccess) {
        onSuccess(supplierId);
      } else {
        navigate("/suppliers");
      }
    } catch (error: any) {
      toast({ title: "Error al crear proveedor: " + error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    documentTypes,
    classes,
    supplierTypes,
    supplierTypeId,
    setSupplierTypeId,
    searchDocTypeId,
    setSearchDocTypeId,
    searchDocNumber,
    setSearchDocNumber,
    searching,
    handleSearchAccount,
    accountResolved,
    existingAccount,
    resetSearch,
    formAccount,
    setFormAccount,
    formSupplier,
    setFormSupplier,
    selectedClassIds,
    toggleClass,
    creatingClass,
    handleCreateClass,
    submitting,
    handleSubmit,
  };
};
