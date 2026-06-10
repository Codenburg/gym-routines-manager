import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { getGymConfigForServer } from "@/app/actions/gym";
import { resolveGymName } from "@/lib/gym-display";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

/**
 * Dynamic metadata. Resolves the gym name through the
 * `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` chain via `resolveGymName`,
 * so the `<title>` reflects the deployed gym's identity (or the generic
 * last-resort when neither the DB nor the env var is available).
 *
 * Wrapped in try/catch so an outage on `getGymConfigForServer` does NOT
 * fail the root render — we fall through to the env/chain default.
 */
export async function generateMetadata(): Promise<Metadata> {
  let dbName: string | null = null;
  try {
    const gym = await getGymConfigForServer();
    dbName = gym?.nombre ?? null;
  } catch {
    // Fall through to env/chain default
  }
  const name = resolveGymName(dbName);
  return {
    title: name,
    description: `Explora las mejores rutinas de ${name}`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme-storage');
                  var theme = saved ? JSON.parse(saved).state.theme : 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  // Default to dark
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${roboto.variable} ${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          {children}
          <Footer />
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
