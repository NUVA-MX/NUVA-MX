// Pure mapping between the hard-coded projects and encargo_projects rows. Shared by the seed script and the
// admin "import" button. Lives in src/lib (not src/server) so tsx scripts can import it without server-only.
import { projects as defaultProjects, type Project } from '@/content/projects';
import type { EncargoProjectRow } from '@/lib/db/schema';
import { projectSchema } from './encargo-schema';

export type ProjectInsert = {
  name: string;
  technique: string;
  tag: string;
  meta: string;
  description: string;
  techniqueDetail: string;
  minimum: string;
  colors: string;
  delivery: string;
  imageUrl: string | null;
  imageAlt: string;
  visible: boolean;
  sortOrder: number;
};

/** The 6 hard-coded projects as insertable rows, in display order. */
export function defaultProjectRows(): ProjectInsert[] {
  return defaultProjects.map((p, i) => ({
    name: p.name,
    technique: p.technique,
    tag: p.tag,
    meta: p.meta,
    description: p.description,
    techniqueDetail: p.detail.technique,
    minimum: p.detail.minimum,
    colors: p.detail.colors,
    delivery: p.detail.delivery,
    imageUrl: p.image,
    imageAlt: p.imageAlt,
    visible: true,
    sortOrder: i,
  }));
}

/**
 * Validates a stored row (same schema as on write, image URL included) and maps it to the public
 * `Project` type. Returns null for an invalid row so the caller can skip and log it.
 */
export function rowToProject(
  row: Pick<
    EncargoProjectRow,
    | 'id'
    | 'name'
    | 'technique'
    | 'tag'
    | 'meta'
    | 'description'
    | 'techniqueDetail'
    | 'minimum'
    | 'colors'
    | 'delivery'
    | 'imageUrl'
    | 'imageAlt'
    | 'visible'
  >,
  host?: string | null,
): Project | null {
  const parsed = projectSchema(host).safeParse({
    name: row.name,
    technique: row.technique,
    tag: row.tag,
    meta: row.meta,
    description: row.description,
    techniqueDetail: row.techniqueDetail,
    minimum: row.minimum,
    colors: row.colors,
    delivery: row.delivery,
    imageUrl: row.imageUrl ?? '',
    imageAlt: row.imageAlt,
    visible: row.visible,
  });
  if (!parsed.success) return null;
  const v = parsed.data;
  return {
    id: row.id,
    name: v.name,
    technique: v.technique,
    tag: v.tag,
    meta: v.meta,
    detail: { technique: v.techniqueDetail, minimum: v.minimum, colors: v.colors, delivery: v.delivery },
    description: v.description,
    image: v.imageUrl,
    imageAlt: v.imageAlt,
  };
}
