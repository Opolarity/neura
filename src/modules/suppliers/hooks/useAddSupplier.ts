import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import {
  AccountSearchResult,
  SupplierClass,
} from "../types/suppliers.types";
import {
  findAccountByDocumentApi,
  createAccountApi,
  createSupplierProfileApi,
  supplierClassesApi,
  createSupplierClassOptionApi,
  createSupplierClassesApi,
  documentTypesApi,
} from "../services/suppliers.service";

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
        const [docTypes, supClasses] = await Promise.all([
          documentTypesApi(),
          supplierClassesApi(),
        ]);
        setDocumentTypes(docTypes);
        setClasses(supClasses);
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
    if (!existingAccount) {
      if (!formAccount.name || !formAccount.last_name) {
        toast({ title: "Nombre y primer apellido son obligatorios", variant: "destructive" });
        return;
      }
    }

    try {
      setSubmitting(true);

      let accountId: number;

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        accountId = await createAccountApi({
          name: formAccount.name,
          middle_name: formAccount.middle_name || undefined,
          last_name: formAccount.last_name,
          last_name2: formAccount.last_name2 || undefined,
          document_type_id: parseInt(searchDocTypeId),
          document_number: searchDocNumber.trim(),
        });
      }

      await createSupplierProfileApi({
        id: accountId,
        email: formSupplier.email || undefined,
        phone: parseInt(formSupplier.phone),
        address: formSupplier.address || undefined,
      });

      await createSupplierClassesApi(accountId, selectedClassIds);

      toast({ title: "Proveedor creado exitosamente", variant: "success" });
      if (onSuccess) {
        onSuccess(accountId);
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
