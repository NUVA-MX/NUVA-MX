import { DM_Sans, DM_Serif_Display } from 'next/font/google';

/** Fonts of the "taller" theme. Imported only by TallerFonts, so they are preloaded only on the routes that render it (/encargo, /existencia). */
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

/** className with both font variables (set on the TallerFonts wrapper). */
export const tallerFonts = `${dmSerif.variable} ${dmSans.variable}`;
