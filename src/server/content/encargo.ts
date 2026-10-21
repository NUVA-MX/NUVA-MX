import 'server-only';
import { asc } from 'drizzle-orm';
import { cache } from 'react';
import { encargo as defaults } from '@/content/encargo';
import { projects as defaultProjects, type Project } from '@/content/projects';
import { blobPublicHost } from '@/lib/blob';
import {
  resolveEncargo,
  resolveMarquee,
  type EncargoContent,
} from '@/lib/content/encargo-merge';
import { sanitizeOverrides, type EncargoOverrides } from '@/lib/content/encargo-schema';
import { rowToProject } from '@/lib/content/seed-projects';
import { getDb } from '@/lib/db/client';
import { isDbConfigured } from '@/lib/db/config';
import { encargoProjects, siteContent } from '@/lib/db/schema';
import { blobToken } from '@/server/env';
import { log } from '@/server/log/logger';

export const LOAD_TIMEOUT_MS = 3000;

export type PromoProps = { text: string; startsAt: string | null; endsAt: string | null };

export type EncargoPage = {
  content: EncargoContent;
  projects: Project[];
  marquee: {
    /** Text for the moment the page was rendered. */
    text: string;
    defaultText: string;
    /** Only when active now or starting within 10 minutes. */
    promo: PromoProps | null;
  };
};

type ProjectRows = Parameters<typeof rowToProject>[0][];

/** Pure assembly from raw DB data. `rows === null` means "use the hard-coded projects". */
export function buildEncargoPage(input: {
  rawData: unknown;
  rows: ProjectRows | null;
  now: Date;
  host: string | null;
  onInvalidSection?: (section: string) => void;
  onInvalidProject?: (id: string) => void;
}): EncargoPage {
  const { overrides, invalid } = sanitizeOverrides(input.rawData, input.host);
  for (const section of invalid) input.onInvalidSection?.(section);

  let projects: Project[];
  if (input.rows === null || input.rows.length === 0) {
    projects = defaultProjects.map((p) => ({ ...p, detail: { ...p.detail } }));
  } else {
    projects = [];
    for (const row of input.rows) {
      if (!row.visible) continue;
      const mapped = rowToProject(row, input.host);
      if (mapped) projects.push(mapped);
      else input.onInvalidProject?.(row.id);
    }
  }

  const content = resolveEncargo(defaults, overrides);
  const m = resolveMarquee(defaults.marquee, overrides.marquee, input.now);
  return {
    content,
    projects,
    marquee: {
      text: m.text,
      defaultText: defaults.marquee,
      promo: m.promo
        ? {
            text: m.promo.text,
            startsAt: m.promo.startsAt ? m.promo.startsAt.toISOString() : null,
            endsAt: m.promo.endsAt ? m.promo.endsAt.toISOString() : null,
          }
        : null,
    },
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('encargo content load timed out')), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

function dbConfigured(): boolean {
  try {
    return isDbConfigured();
  } catch {
    return false;
  }
}

async function load(): Promise<EncargoPage> {
  const now = new Date();
  if (!dbConfigured()) return buildEncargoPage({ rawData: null, rows: null, now, host: null });
  const host = blobPublicHost(blobToken());
  try {
    const db = getDb();
    const [contentRows, projectRows] = await withTimeout(
      Promise.all([
        db.select({ data: siteContent.data }).from(siteContent).limit(1),
        db.select().from(encargoProjects).orderBy(asc(encargoProjects.sortOrder), asc(encargoProjects.createdAt)).limit(100),
      ]),
      LOAD_TIMEOUT_MS,
    );
    return buildEncargoPage({
      rawData: contentRows[0]?.data ?? null,
      rows: projectRows,
      now,
      host,
      onInvalidSection: (section) => log.error('encargo.content_invalid', { section }),
      onInvalidProject: (id) => log.error('encargo.project_invalid', { id }),
    });
  } catch (err) {
    log.error('encargo.content_load_failed', { error: err });
    return buildEncargoPage({ rawData: null, rows: null, now, host });
  }
}

/** Content for /encargo. Never throws: any failure yields the hard-coded defaults. One load per request. */
export const getEncargoPage = cache(load);

export type { EncargoOverrides };
