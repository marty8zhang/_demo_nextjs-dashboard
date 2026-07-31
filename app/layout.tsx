import '@/app/ui/global.css'
import { inter } from '@/app/ui/fonts';

export const metadata = {
  title: 'Egghdz Demos - Next.js Dashboard',
  description: 'A dashboard demo built with Next.js.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
