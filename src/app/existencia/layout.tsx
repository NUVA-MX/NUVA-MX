import type { ReactNode } from 'react';
import { TallerFonts } from '@/components/layout/TallerFonts';

export default function ExistenciaLayout({ children }: { children: ReactNode }) {
  return <TallerFonts>{children}</TallerFonts>;
}
