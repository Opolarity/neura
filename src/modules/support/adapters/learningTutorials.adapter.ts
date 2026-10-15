import type {
  LearningCatalog,
  LearningTag,
  LearningTagApi,
  LearningTutorialsApiResponse,
} from "../types/Learning.types";

const adaptTag = (raw: LearningTagApi): LearningTag => ({
  slug: raw.slug,
  name: raw.nombre,
});

export const adaptLearningTutorials = (
  raw: LearningTutorialsApiResponse | null | undefined,
): LearningCatalog => {
  const data = raw?.data ?? {};

  return {
    categories: (data.categories ?? []).map((c) => ({
      slug: c.slug,
      name: c.nombre,
      description: c.descripcion ?? null,
      total: Number(c.total ?? 0),
    })),
    tags: (data.tags ?? []).map(adaptTag),
    tutorials: (data.tutorials ?? []).map((t) => ({
      id: t.id,
      title: t.titulo,
      description: t.descripcion?.trim() || null,
      source: t.source === "upload" ? "upload" : "youtube",
      videoUrl: t.video_url ?? null,
      youtubeId: t.youtube_id ?? null,
      embedUrl: t.embed_url ?? null,
      thumbnailUrl: t.thumbnail_url ?? null,
      mimeType: t.mime_type ?? null,
      category: t.categoria ? adaptTag(t.categoria) : null,
      tags: (t.tags ?? []).map(adaptTag),
      publishedAt: t.published_at ?? null,
    })),
  };
};
