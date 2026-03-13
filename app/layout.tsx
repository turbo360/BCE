import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "BCE Case Studies Portal | Professional Practices Compliance Program",
  description: "Brisbane Catholic Education - Professional Practices: Compliance Program Case Studies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${raleway.className} antialiased bg-bce-cream`}>
        {/* Logo bar - white background per brand guidelines */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
          </div>
        </div>
        {/* Navy accent bar */}
        <div className="h-1 bg-bce-navy"></div>
        <main className="min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}
