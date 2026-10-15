import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/utils";
import type {
  LearningCategory,
  LearningFilters,
  LearningTag,
} from "../../types/Learning.types";

/** Radix Select no admite "" como valor: este centinela es "todas". */
const ALL_TAGS = "__all__";

interface LearningFilterBarProps {
  filters: LearningFilters;
  categories: LearningCategory[];
  tags: LearningTag[];
  onSearchChange: (search: string) => void;
  onCategoryChange: (slug: string | null) => void;
  onTagChange: (slug: string | null) => void;
}

const chipClass = "h-8 rounded-full px-3";

export const LearningFilterBar = ({
  filters,
  categories,
  tags,
  onSearchChange,
  onCategoryChange,
  onTagChange,
}: LearningFilterBarProps) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar tutoriales..."
          className="pl-9"
          aria-label="Buscar tutoriales"
        />
      </div>

      {tags.length > 0 && (
        <Select
          value={filters.tag ?? ALL_TAGS}
          onValueChange={(value) => onTagChange(value === ALL_TAGS ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filtrar por etiqueta">
            <SelectValue placeholder="Etiqueta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TAGS}>Todas las etiquetas</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.slug} value={tag.slug}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>

    {categories.length > 0 && (
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
        <Button
          type="button"
          size="sm"
          variant={filters.category === null ? "default" : "outline"}
          className={chipClass}
          aria-pressed={filters.category === null}
          onClick={() => onCategoryChange(null)}
        >
          Todas
        </Button>
        {categories.map((category) => {
          const active = filters.category === category.slug;
          return (
            <Button
              key={category.slug}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className={chipClass}
              aria-pressed={active}
              title={category.description ?? undefined}
              onClick={() => onCategoryChange(active ? null : category.slug)}
            >
              {category.name}
              <span className={cn("ml-1.5 text-xs", active ? "opacity-80" : "text-muted-foreground")}>
                {category.total}
              </span>
            </Button>
          );
        })}
      </div>
    )}
  </div>
);
