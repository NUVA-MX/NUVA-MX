import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { admin } from '@/content/admin';

export const metadata: Metadata = {
  title: admin.meta.title,
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div data-theme="encargo">{children}</div>;
}
