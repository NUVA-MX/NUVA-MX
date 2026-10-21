import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { TallerFonts } from '@/components/layout/TallerFonts';
import { SplitChooser } from '@/components/patterns/SplitChooser';
import { EntryBar } from '@/components/sections/entrada/EntryBar';
import { EntryFooter } from '@/components/sections/entrada/EntryFooter';
import { entrada } from '@/content/entrada';

export const metadata: Metadata = {
  title: { absolute: entrada.meta.title },
  description: entrada.meta.description,
};

export default function EntradaPage() {
  return (
    // The "por encargo" panel uses the taller theme, so the page carries its DM fonts.
    <TallerFonts>
      <PageShell theme="taller" nav={<EntryBar />} footer={<EntryFooter />}>
        <SplitChooser panels={entrada.panels} />
      </PageShell>
    </TallerFonts>
  );
}
