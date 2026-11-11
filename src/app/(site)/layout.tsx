import type { ReactNode } from 'react';
import { SiteFrame } from '@/components/sections/shared/SiteFrame';

// /encargo and /existencia share this layout, so the nav (and the switch inside it) never unmounts when you
// move between them. The pages render only their own content.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
