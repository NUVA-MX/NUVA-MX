'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Grid } from '@/components/primitives/Grid';
import { Heading } from '@/components/primitives/Heading';
import { Lines } from '@/components/primitives/Lines';
import { Stack } from '@/components/primitives/Stack';
import { Text } from '@/components/primitives/Text';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteNav } from '@/components/layout/SiteNav';
import { Card } from '@/components/patterns/Card';
import { CartPanel } from '@/components/patterns/CartPanel';
import { CrossLink } from '@/components/patterns/CrossLink';
import { CtaBand } from '@/components/patterns/CtaBand';
import { InfoGrid } from '@/components/patterns/InfoGrid';
import { Modal } from '@/components/patterns/Modal';
import { ProductCard } from '@/components/patterns/ProductCard';
import { ProductSkeleton } from '@/components/patterns/ProductSkeleton';
import { ProjectCard } from '@/components/patterns/ProjectCard';
import { Rail } from '@/components/patterns/Rail';
import { Reveal } from '@/components/patterns/Reveal';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { SplitChooser } from '@/components/patterns/SplitChooser';
import { SplitHero } from '@/components/patterns/SplitHero';
import { Stat } from '@/components/patterns/Stat';
import { StatusMessage } from '@/components/patterns/StatusMessage';
import { StepList } from '@/components/patterns/StepList';
import { StockBadge } from '@/components/patterns/StockBadge';
import styles from './page.module.css';

// Test data for the dev page. Components never know these strings.
const switchOptions = [
  { key: 'encargo', label: 'POR ENCARGO', href: '/encargo' },
  { key: 'existencia', label: 'EN EXISTENCIA', href: '/existencia' },
];
const navLabels = { openMenu: 'Abrir menú', closeMenu: 'Cerrar menú', nav: 'Secciones', switch: 'Forma de comprar', home: 'Inicio' };
const demoProjects = Array.from({ length: 6 }, (_, i) => ({
  id: `demo-${i}`,
  name: `Proyecto demo ${i + 1}`,
  technique: i % 2 ? 'Estampado' : 'Bordado',
  meta: '12 GORRAS · BORDADO FRONTAL',
  image: null,
  imageAlt: `Foto demo ${i + 1}`,
}));
const demoProducts = [
  { id: 'p1', name: 'Gorra demo', meta: 'TALLA ÚNICA', price: 390, stock: 14, image: null, imageAlt: null, category: null },
  { id: 'p2', name: 'Trucker demo', meta: 'MALLA', price: 420, stock: 3, image: null, imageAlt: null, category: null },
  { id: 'p3', name: 'Gorro demo', meta: 'TEJIDO', price: 320, stock: 0, image: null, imageAlt: null, category: null },
  { id: 'p4', name: 'Sin precio ni stock', meta: null, price: null, stock: null, image: null, imageAlt: null, category: null },
];
const badgeLabels = { out: 'AGOTADO', low: 'ÚLTIMAS {n}', ok: '{n} EN STOCK' };
const cardLabels = { add: 'Añadir', added: 'Añadido · {n}', notify: 'Avísame', addAria: 'Añadir {name}', notifyAria: 'Avísame: {name}', noPrice: 'Precio por confirmar' };
const cartLabels = {
  title: 'TU PEDIDO',
  empty: 'Vacío',
  total: 'Total estimado',
  send: 'Enviar pedido por WhatsApp',
  note: 'Nota demo',
  close: 'Cerrar',
  remove: 'Quitar',
  removeAria: 'Quitar {name}',
  qty: 'Cantidad',
  increase: 'Sumar {name}',
  decrease: 'Restar {name}',
  noticesTitle: 'Cambios en tu carrito:',
  verifying: 'Revisando inventario…',
};
const panels = [
  { key: 'a', href: '/encargo', theme: 'taller', tone: 'olive' as const, eyebrow: 'Por encargo', titleLines: ['Hecho a', 'tu medida.'], body: 'Texto demo del panel izquierdo.', preview: 'Vista previa demo', cue: 'Entrar', image: null, imageAlt: '' },
  { key: 'b', href: '/existencia', theme: 'taller', tone: 'wine' as const, eyebrow: 'En existencia', titleLines: ['Listo para', 'enviar.'], body: 'Texto demo del panel derecho.', preview: 'Vista previa demo', cue: 'Entrar', image: null, imageAlt: '' },
];

export function PatternsDemo({ theme }: { theme: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const open = demoProjects.find((p) => p.id === openId);
  const titleId = `modal-title-${theme}`;

  return (
    <Stack gap={10}>
      <SiteNav
        brand="NUVA"
        brandHref="/"
        switchOptions={switchOptions}
        current={theme === 'existencia' ? 'existencia' : 'encargo'}
        links={[
          { label: 'Uno', href: '#a' },
          { label: 'Dos', href: '#b' },
        ]}
        action={
          <Button size="sm" variant="secondary" onClick={() => setCartOpen(true)} ariaHaspopup="dialog">
            Carrito (2)
          </Button>
        }
        labels={navLabels}
      />
      <SplitHero
        title="NUVA"
        tagline="HECHO A TU MEDIDA"
        body="Hero demo con texto y botones."
        actions={
          <>
            <Button href="#a">Primario</Button>
            <Button href="#b" variant="ghost-inverse">
              Ghost
            </Button>
          </>
        }
        media={{ src: null, alt: '' }}
      />
      <Container>
        <SectionHeader eyebrow="EYEBROW" title="SECCIÓN DEMO" lead="Lead de la sección demo." aside="ASIDE →" />
      </Container>
      <Rail ariaLabel={`Carrusel demo ${theme}`}>
        {demoProjects.map((p) => (
          <ProjectCard key={p.id} project={p} openLabel={`Ver ${p.name}`} ctaLabel="Ver proyecto" onOpen={setOpenId} />
        ))}
      </Rail>
      <Modal open={!!open} onClose={() => setOpenId(null)} labelledBy={titleId}>
        <div className={styles.demoBlock}>
          <Heading level={2} size="modal" id={titleId}>
            {open?.name}
          </Heading>
          <Text>Contenido del modal demo.</Text>
          <InfoGrid
            items={[
              { label: 'TÉCNICA', value: 'Bordado' },
              { label: 'PIEZAS MÍNIMAS', value: '1 pieza' },
              { label: 'COLORES', value: 'negro' },
              { label: 'ENTREGA', value: '7 a 10 días' },
            ]}
          />
          <Stack direction="row" gap={3}>
            <Button href="https://wa.me/" external>
              Primario
            </Button>
            <Button variant="secondary" onClick={() => setOpenId(null)}>
              Cerrar
            </Button>
          </Stack>
        </div>
      </Modal>
      <Container>
        <Grid min="md" gap={6}>
          {demoProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              quantityInCart={qty[p.id] ?? 0}
              onAdd={(prod) => setQty((q) => ({ ...q, [prod.id]: (q[prod.id] ?? 0) + 1 }))}
              notifyHref="https://wa.me/"
              labels={cardLabels}
              badgeLabels={badgeLabels}
              lowThreshold={5}
            />
          ))}
          <ProductSkeleton />
        </Grid>
      </Container>
      <Container>
        <Stack gap={6}>
          <Stack direction="row" gap={3} wrap>
            <StockBadge stock={0} lowThreshold={5} labels={badgeLabels} />
            <StockBadge stock={3} lowThreshold={5} labels={badgeLabels} />
            <StockBadge stock={22} lowThreshold={5} labels={badgeLabels} />
          </Stack>
          <StatusMessage title="Estado vacío" body="Texto del estado vacío." action={<Button>Acción</Button>} />
          <StatusMessage tone="error" title="Estado de error" action={<Button variant="secondary">Reintentar</Button>} />
          <Card>
            <div className={styles.demoBlock}>
              <Text>Card base</Text>
            </div>
          </Card>
          <dl className={styles.statRow}>
            <Stat value="XX" label="PIEZAS" />
            <Stat value="7-10" label="DÍAS" />
          </dl>
          <InfoGrid
            columns={3}
            items={[
              { label: 'UNO', value: 'Valor uno' },
              { label: 'DOS', value: 'Valor dos' },
              { label: 'TRES', value: 'Valor tres' },
            ]}
          />
        </Stack>
      </Container>
      <div className={styles.inverse}>
        <Container>
          <StepList
            steps={[
              { n: '01', title: 'PASO UNO', body: 'Texto del paso.' },
              { n: '02', title: 'PASO DOS', body: 'Texto del paso.' },
            ]}
          />
        </Container>
      </div>
      <Reveal>
        <Container size="narrow">
          <CtaBand
            eyebrow="CONTACTO"
            title="¿CTA DEMO?"
            body="Cuerpo del bloque centrado."
            actions={<Button size="lg">Acción grande</Button>}
          />
        </Container>
      </Reveal>
      <CrossLink
        href="/existencia"
        theme="existencia"
        eyebrow="EL OTRO LADO"
        title={<Lines lines={['¿NO QUIERES', 'ESPERAR?']} />}
        body="Cuerpo del puente."
        cue="VER"
        media={{ src: null, alt: '' }}
      />
      <Container>
        <CrossLink variant="compact" href="/encargo" eyebrow="¿COMPACTO?" body="Versión compacta." cue="IR" />
      </Container>
      <SplitChooser panels={panels} />
      <SiteFooter brand="NUVA" brandHref="/" brandLabel="Inicio" tagline="Tagline demo" copyright="© demo" />
      <CartPanel
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={[{ id: 'x', name: 'Gorra demo', qty: 2, priceLabel: '$780', max: 3 }]}
        totalLabel="$780"
        sendHref="https://wa.me/"
        onSetQty={() => {}}
        onRemove={() => {}}
        labels={cartLabels}
        notices={['Aviso de ejemplo: la cantidad se ajustó al stock.']}
      />
    </Stack>
  );
}
