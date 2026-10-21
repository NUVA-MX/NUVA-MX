import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Divider } from '@/components/primitives/Divider';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Field } from '@/components/primitives/Field';
import { Grid } from '@/components/primitives/Grid';
import { Heading } from '@/components/primitives/Heading';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { Lines } from '@/components/primitives/Lines';
import { Media } from '@/components/primitives/Media';
import { Pill } from '@/components/primitives/Pill';
import { Stack } from '@/components/primitives/Stack';
import { Text } from '@/components/primitives/Text';
import { VisuallyHidden } from '@/components/primitives/VisuallyHidden';
import styles from './page.module.css';

// Test data: lives in the dev page, never inside the components.
const icons: IconName[] = ['whatsapp', 'arrow', 'plus', 'minus', 'close', 'cart', 'menu'];

export function PrimitivesDemo() {
  return (
    <Stack gap={8}>
      <Container size="default">
        <Stack gap={3}>
          <Eyebrow>Eyebrow default</Eyebrow>
          <Eyebrow tracking="tagline" size="sm">
            Tagline
          </Eyebrow>
          <Heading level={3} size="hero">
            NUVA
          </Heading>
          <Heading level={3} size="split">
            <Lines lines={['HECHO A', 'TU MEDIDA']} />
          </Heading>
          <Heading level={3} size="2xl">
            TÍTULO 2XL
          </Heading>
          <Heading level={3} size="xl">
            TÍTULO XL
          </Heading>
          <Heading level={3} size="lg">
            Título lg
          </Heading>
          <Heading level={3} size="md">
            Título md
          </Heading>
          <Heading level={3} size="sm">
            Título sm
          </Heading>
          <Text size="xl" measure="lead">
            Texto xl default con medida lead para comprobar el ancho máximo del párrafo en la escala.
          </Text>
          <Text tone="muted">Texto muted</Text>
          <Text tone="subtle" size="sm">
            Texto subtle sm
          </Text>
        </Stack>
      </Container>

      <div className={styles.inverse}>
        <Container>
          <Stack gap={3}>
            <Eyebrow tone="inverse">Eyebrow inverse</Eyebrow>
            <Heading level={3} tone="inverse" size="xl">
              TÍTULO INVERSE
            </Heading>
            <Text tone="inverse">Texto inverse</Text>
            <Text tone="inverse-muted">Texto inverse-muted</Text>
            <Stack direction="row" gap={3} wrap>
              <Button variant="primary">Primary</Button>
              <Button variant="ghost-inverse">Ghost inverse</Button>
            </Stack>
            <Divider tone="inverse" />
          </Stack>
        </Container>
      </div>

      <Container>
        <Stack gap={4}>
          <Stack direction="row" gap={3} wrap align="center">
            <Button size="sm">Primary sm</Button>
            <Button>Primary md</Button>
            <Button size="lg">Primary lg</Button>
            <Button variant="secondary" size="sm">
              Secondary sm
            </Button>
            <Button variant="secondary">Secondary md</Button>
            <Button variant="secondary" size="lg">
              Secondary lg
            </Button>
            <Button icon="whatsapp" href="https://wa.me/" external>
              Con icono externo
            </Button>
            <Button href="/encargo" variant="secondary" icon="arrow" iconPosition="end">
              Enlace interno
            </Button>
            <Button variant="secondary" icon="close" ariaLabel="Cerrar" />
            <Button disabled>Deshabilitado</Button>
          </Stack>
          <Stack direction="row" gap={3} wrap>
            <Pill>Neutral</Pill>
            <Pill tone="accent">Accent</Pill>
            <Pill tone="status-ok">22 en stock</Pill>
            <Pill tone="status-low">Últimas 3</Pill>
            <Pill tone="status-out">Agotado</Pill>
          </Stack>
          <Stack direction="row" gap={3}>
            {icons.map((name) => (
              <span key={name} className={styles.icon}>
                <Icon name={name} size="md" />
                <VisuallyHidden>{name}</VisuallyHidden>
              </span>
            ))}
          </Stack>
          <Divider />
          <Grid min="sm" gap={4}>
            <Media alt="" ratio="4/5" />
            <Media alt="" ratio="16/10" radius="lg" />
            <Media alt="" ratio="1/1" tone="inverse" radius="lg" />
            <div className={styles.fillBox}>
              <Media alt="" ratio="fill" />
            </div>
          </Grid>
          <Grid min="md" gap={4}>
            <Field label="Nombre" name="demo-name" hint="Ayuda del campo" />
            <Field label="Precio" name="demo-price" type="number" error="Error de ejemplo" />
            <Field label="Notas" name="demo-notes" as="textarea" />
            <Field
              label="Categoría"
              name="demo-cat"
              as="select"
              options={[
                { value: 'gorras', label: 'Gorras' },
                { value: 'playeras', label: 'Playeras' },
              ]}
            />
            <Field label="Visible" name="demo-visible" as="checkbox" defaultChecked />
          </Grid>
        </Stack>
      </Container>
    </Stack>
  );
}
