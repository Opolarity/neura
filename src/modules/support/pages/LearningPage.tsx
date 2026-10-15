import { useState } from "react";
import PageLoader from "@/shared/components/page-loader/PageLoader";
import { useLearningTutorials } from "../hooks/useLearningTutorials";
import { LearningFilterBar } from "../components/learning/LearningFilterBar";
import { TutorialCard } from "../components/learning/TutorialCard";
import { TutorialPlayerDialog } from "../components/learning/TutorialPlayerDialog";
import {
  LearningEmptyState,
  LearningErrorState,
  LearningNoResults,
} from "../components/learning/LearningStates";
import type { LearningTutorial } from "../types/Learning.types";

/**
 * "Aprender": videos tutoriales que OPOLARITY publica para este ERP. Es una
 * opción del menú de usuario, como Tickets y Capacitaciones; requiere sesión
 * pero queda fuera del sistema de permisos.
 */
const LearningPage = () => {
  const {
    catalog,
    tutorials,
    loading,
    loaded,
    errorState,
    filters,
    hasActiveFilters,
    refetch,
    onSearchChange,
    onCategoryChange,
    onTagChange,
    clearFilters,
  } = useLearningTutorials();

  const [selected, setSelected] = useState<LearningTutorial | null>(null);

  if (loading && !loaded && !errorState) {
    return <PageLoader message="Cargando tutoriales..." />;
  }

  const isEmpty = loaded && catalog.tutorials.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Aprender</h1>
      </div>

      {errorState ? (
        <LearningErrorState
          code={errorState.code}
          message={errorState.message}
          onRetry={refetch}
          retrying={loading}
        />
      ) : isEmpty ? (
        <LearningEmptyState />
      ) : (
        <>
          <LearningFilterBar
            filters={filters}
            categories={catalog.categories}
            tags={catalog.tags}
            onSearchChange={onSearchChange}
            onCategoryChange={onCategoryChange}
            onTagChange={onTagChange}
          />

          {tutorials.length === 0 ? (
            <LearningNoResults onClear={clearFilters} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {tutorials.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} onOpen={setSelected} />
              ))}
            </div>
          )}

          {hasActiveFilters && tutorials.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {tutorials.length} de {catalog.tutorials.length} tutoriales
            </p>
          )}
        </>
      )}

      <TutorialPlayerDialog tutorial={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default LearningPage;
