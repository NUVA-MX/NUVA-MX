import type { NextConfig } from 'next';
import { blobPublicHost } from './src/lib/blob';
import { API_HEADERS, buildSecurityHeaders } from './src/lib/security/headers';

// If the Blob token is available at build time (it is on Vercel), next/image only accepts
// images from that store; otherwise any public Vercel Blob store.
const isDev = process.env.NODE_ENV !== 'production';
// Only our own store. The any-store wildcard is a development convenience; production builds without the token
// fail `check:env`, and if one slips through, no remote image host is allowed at all.
const tokenHost = blobPublicHost(process.env.BLOB_READ_WRITE_TOKEN);
const blobHost = tokenHost ?? (isDev ? '*.public.blob.vercel-storage.com' : null);
const securityHeaders = buildSecurityHeaders({ isDev, blobHost: blobHost ?? undefined });

const nextConfig: NextConfig = {
  // Do not auto-generate AGENTS.md / CLAUDE.md in `next dev`.
  agentRules: false,
  poweredByHeader: false,
  images: {
    remotePatterns: blobHost ? [{ protocol: 'https', hostname: blobHost }] : [],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/api/:path*', headers: API_HEADERS },
    ];
  },
};

export default nextConfig;
