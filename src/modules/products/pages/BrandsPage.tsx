import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import BrandsHeader from "@/modules/products/components/brands/BrandsHeader";
import BrandsFilterBar from "@/modules/products/components/brands/BrandsFilterBar";
import BrandsTable from "@/modules/products/components/brands/BrandsTable";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { getBrands, createBrand, updateBrand, deleteBrand } from "@/modules/products/services/Brands.service";
import { BrandsFormDialog } from "@/modules/products/components/brands/BrandsFormDialog";
import { BrandsDeleteDialog } from "@/modules/products/components/brands/BrandsDeleteDialog";
import type { Brand, EditBrandPayload, BrandsPage } from "@/modules/products/types/Brands.types";

const DEFAULT_SIZE = 20;

export default function BrandsPage() {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [editBrand, setEditBrand] = useState<EditBrandPayload | undefined>(undefined);
  const [deleteBrandData, setDeleteBrandData] = useState<Brand | undefined>(undefined);
  const [pagination, setPagination] = useState<BrandsPage>({ page: 1, size: DEFAULT_SIZE, total: 0 });
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenEdit = (payload: EditBrandPayload) => {
    setEditBrand(payload);
    setIsOpenForm(true);
  };

  const handleOpenDelete = (brand: Brand) => {
    setDeleteBrandData(brand);
    setIsOpenDelete(true);
  };

  const fetchBrands = (page = pagination.page, size = pagination.size, searchValue = search) => {
    setIsLoading(true);
    getBrands({ page, size, search: searchValue || undefined })
      .then((res) => {
        setBrands(res.data);
        setPagination(res.page);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBrands(1, pagination.size, value);
    }, 400);
  };

  const handleDelete = async () => {
    if (!deleteBrandData) return;
    await deleteBrand(deleteBrandData.id);
    setIsOpenDelete(false);
    setTimeout(() => setDeleteBrandData(undefined), 300);
    fetchBrands();
  };

  const handlePageChange = (page: number) => {
    fetchBrands(page, pagination.size);
  };

  const handlePageSizeChange = (size: number) => {
    fetchBrands(1, size);
  };

  useEffect(() => {
    fetchBrands(1, DEFAULT_SIZE);
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <BrandsHeader onOpen={() => setIsOpenForm(true)} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <BrandsFilterBar search={search} onSearchChange={handleSearchChange} />
          <div className="flex-1 min-h-0 overflow-hidden">
            <BrandsTable brands={brands} isLoading={isLoading} error={error} onEdit={handleOpenEdit} onDelete={handleOpenDelete} />
          </div>
        </CardContent>
        <CardFooter>
          <PaginationBar
            pagination={{ p_page: pagination.page, p_size: pagination.size, total: pagination.total }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <BrandsFormDialog
        open={isOpenForm}
        onOpenChange={(open) => {
          setIsOpenForm(open);
          if (!open) setTimeout(() => setEditBrand(undefined), 300);
        }}
        onCreateBrand={async (payload) => { await createBrand(payload); fetchBrands(); }}
        onEditBrand={async (payload) => { await updateBrand(payload); fetchBrands(); }}
        editBrand={editBrand}
      />

      <BrandsDeleteDialog
        open={isOpenDelete}
        onOpenChange={setIsOpenDelete}
        brandName={deleteBrandData?.name}
        onDelete={handleDelete}
      />
    </div>
  );
}
