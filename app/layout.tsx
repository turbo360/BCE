import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Image from "next/image";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "BCE Case Studies Portal | Professional Practices Compliance Program",
  description: "Brisbane Catholic Education - Professional Practices: Compliance Program Case Studies",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUser();
  let userName: string | null = null;
  if (session) {
    const db = getDb();
    const user = db.prepare("SELECT first_name, last_name FROM users WHERE id = ?").get(session.userId) as {
      first_name: string; last_name: string;
    } | undefined;
    if (user) userName = `${user.first_name} ${user.last_name}`;
  }

  return (
    <html lang="en">
      <body className={`${openSans.className} antialiased bg-bce-cream`}>
        {/* Logo bar - white background per brand guidelines */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <a href="/">
              <Image
                src="/bce-logo.png"
                alt="Brisbane Catholic Education - teaching, challenging, transforming"
                width={240}
                height={125}
                className="h-14 sm:h-16 w-auto"
                priority
              />
            </a>
            {userName && (
              <div className="flex items-center gap-4">
                <span className="text-base text-bce-navy-dark hidden sm:inline font-bold">{userName}</span>
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
        {/* Navy accent bar */}
        <div className="h-1 bg-bce-navy"></div>
        <main className="min-h-[calc(100vh-8rem)]">
          {children}
        </main>
        {/* Footer */}
        <footer className="bg-zinc-800 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-white/70">
              Portal developed by <a href="https://turbo.net.au" target="_blank" rel="noopener noreferrer" className="text-white hover:text-bce-light-blue transition-colors font-medium">Turbo 360</a> (turbo.net.au)
            </p>
            <a href="/admin" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Admin
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
