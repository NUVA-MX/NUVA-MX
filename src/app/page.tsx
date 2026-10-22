import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
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
    <PageShell theme="taller" nav={<EntryBar />} footer={<EntryFooter />}>
      <SplitChooser panels={entrada.panels} />
    </PageShell>
  );
}
