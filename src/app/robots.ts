import type { MetadataRoute } from 'next';
import { siteUrl } from '@/server/env';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/dev', '/api'] },
    ...(base ? { host: base } : {}),
  };
}
