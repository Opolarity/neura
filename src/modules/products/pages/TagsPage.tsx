import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import TagsHeader from "@/modules/products/components/tags/TagsHeader";
import TagsFilterBar from "@/modules/products/components/tags/TagsFilterBar";
import TagsTable from "@/modules/products/components/tags/TagsTable";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { getTags, createTag, updateTag, deleteTag } from "@/modules/products/services/Tags.service";
import { TagsFormDialog } from "@/modules/products/components/tags/TagsFormDialog";
import { TagsDeleteDialog } from "@/modules/products/components/tags/TagsDeleteDialog";
import type { Tag, EditTagPayload, TagsPage } from "@/modules/products/types/Tags.types";

const DEFAULT_SIZE = 20;

export default function TagsPage() {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [editTag, setEditTag] = useState<EditTagPayload | undefined>(undefined);
  const [deleteTagData, setDeleteTagData] = useState<Tag | undefined>(undefined);
  const [pagination, setPagination] = useState<TagsPage>({ page: 1, size: DEFAULT_SIZE, total: 0 });
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenEdit = (payload: EditTagPayload) => {
    setEditTag(payload);
    setIsOpenForm(true);
  };

  const handleOpenDelete = (tag: Tag) => {
    setDeleteTagData(tag);
    setIsOpenDelete(true);
  };

  const fetchTags = (page = pagination.page, size = pagination.size, searchValue = search) => {
    setIsLoading(true);
    getTags({ page, size, search: searchValue || undefined })
      .then((res) => {
        setTags(res.data);
        setPagination(res.page);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTags(1, pagination.size, value);
    }, 400);
  };

  const handleDelete = async () => {
    if (!deleteTagData) return;
    await deleteTag(deleteTagData.id);
    setIsOpenDelete(false);
    setTimeout(() => setDeleteTagData(undefined), 300);
    fetchTags();
  };

  const handlePageChange = (page: number) => {
    fetchTags(page, pagination.size);
  };

  const handlePageSizeChange = (size: number) => {
    fetchTags(1, size);
  };

  useEffect(() => {
    fetchTags(1, DEFAULT_SIZE);
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <TagsHeader onOpen={() => setIsOpenForm(true)} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <TagsFilterBar search={search} onSearchChange={handleSearchChange} />
          <div className="flex-1 min-h-0 overflow-hidden">
            <TagsTable tags={tags} isLoading={isLoading} error={error} onEdit={handleOpenEdit} onDelete={handleOpenDelete} />
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

      <TagsFormDialog
        open={isOpenForm}
        onOpenChange={(open) => {
          setIsOpenForm(open);
          if (!open) setTimeout(() => setEditTag(undefined), 300);
        }}
        onCreateTag={async (payload) => { await createTag(payload); fetchTags(); }}
        onEditTag={async (payload) => { await updateTag(payload); fetchTags(); }}
        editTag={editTag}
      />

      <TagsDeleteDialog
        open={isOpenDelete}
        onOpenChange={setIsOpenDelete}
        tagName={deleteTagData?.name}
        onDelete={handleDelete}
      />
    </div>
  );
}
