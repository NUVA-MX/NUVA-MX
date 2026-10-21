import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PromoMarquee } from '@/components/patterns/PromoMarquee';
import { AnnouncementBar } from '@/components/sections/shared/AnnouncementBar';
import { Contacto } from '@/components/sections/encargo/Contacto';
import { Equipos } from '@/components/sections/encargo/Equipos';
import { Hero } from '@/components/sections/encargo/Hero';
import { Intro } from '@/components/sections/encargo/Intro';
import { Proceso } from '@/components/sections/encargo/Proceso';
import { Projects } from '@/components/sections/encargo/Projects';
import { QueHacemos } from '@/components/sections/encargo/QueHacemos';
import { StickyWhatsapp } from '@/components/sections/encargo/StickyWhatsapp';
import { StoreLink } from '@/components/sections/encargo/StoreLink';
import { Taller } from '@/components/sections/encargo/Taller';
import { Tecnicas } from '@/components/sections/encargo/Tecnicas';
import { TallerNav } from '@/components/sections/shared/TallerNav';
import { encargo } from '@/content/encargo';
import { site } from '@/content/site';
import { ui } from '@/content/ui';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { getEncargoPage } from '@/server/content/encargo';

export const metadata: Metadata = {
  title: encargo.meta.title,
  description: encargo.meta.description,
};

// Static page (ISR). Saving content in the admin calls revalidatePath('/encargo'); the 5 minute window is the
// safety net for promo start/end, and PromoMarquee switches the marquee at the exact boundary in the browser.
export const revalidate = 300;

export default async function EncargoPage() {
  const { content, projects, marquee } = await getEncargoPage();
  return (
    <PageShell
      theme="taller"
      side="encargo"
      skipLabel={ui.skipToContent}
      nav={
        <>
          <AnnouncementBar text={content.announcement} tag={site.sideTag.encargo} />
          <TallerNav current="encargo" links={encargo.nav.links} />
        </>
      }
      footer={
        <SiteFooter
          brand={encargo.chrome.wordmark}
          brandHref="/"
          brandLabel={site.homeLabel}
          tagline={site.tagline}
          copyright={site.copyright}
          links={site.social}
        />
      }
    >
      <Hero content={content.hero} />
      <StickyWhatsapp
        href={buildWhatsAppLink({ phone: site.whatsapp.phone, message: encargo.whatsapp.messages.general })}
        label={encargo.whatsapp.sticky.label}
        ariaLabel={encargo.whatsapp.sticky.ariaLabel}
      />
      <PromoMarquee defaultText={marquee.defaultText} serverText={marquee.text} promo={marquee.promo} />
      <Intro />
      <Proceso />
      <QueHacemos content={content.queHacemos} />
      <Tecnicas content={content.tecnicas} />
      {projects.length > 0 && <Projects content={content.projects} projects={projects} />}
      <Equipos content={content.equipos} />
      <Taller content={content.taller} />
      <Contacto />
      <StoreLink content={content.crossLink} />
    </PageShell>
  );
}
