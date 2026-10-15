/**
 * Tutoriales en video de la opción "Aprender" del menú de usuario. Se cargan
 * en OPOLARITY Tasks y llegan por la edge function puente
 * `get-learning-tutorials`, que ya fija el tipo de ERP.
 */

// ---------- Tal cual los devuelve la API externa ----------

export interface LearningCategoryApi {
  slug: string;
  nombre: string;
  descripcion: string | null;
  total: number;
}

export interface LearningTagApi {
  slug: string;
  nombre: string;
}

export interface LearningTutorialApi {
  id: string;
  titulo: string;
  descripcion: string | null;
  source: "youtube" | "upload";
  video_url: string | null;
  youtube_id: string | null;
  embed_url: string | null;
  thumbnail_url: string | null;
  mime_type: string | null;
  categoria: { slug: string; nombre: string } | null;
  tags: LearningTagApi[] | null;
  published_at: string | null;
}

/** Cuerpo de la edge function: el payload útil viaja dentro de `data`. */
export interface LearningTutorialsApiResponse {
  data?: {
    categories?: LearningCategoryApi[];
    tags?: LearningTagApi[];
    tutorials?: LearningTutorialApi[];
  } | null;
}

// ---------- Ya normalizados para la vista ----------

export interface LearningCategory {
  slug: string;
  name: string;
  description: string | null;
  total: number;
}

export interface LearningTag {
  slug: string;
  name: string;
}

export interface LearningTutorial {
  id: string;
  title: string;
  description: string | null;
  source: "youtube" | "upload";
  videoUrl: string | null;
  youtubeId: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  category: LearningTag | null;
  tags: LearningTag[];
  publishedAt: string | null;
}

export interface LearningCatalog {
  categories: LearningCategory[];
  tags: LearningTag[];
  tutorials: LearningTutorial[];
}

export interface LearningFilters {
  search: string;
  /** Slug de la categoría; null = todas. */
  category: string | null;
  /** Slug de la etiqueta; null = todas. */
  tag: string | null;
}
