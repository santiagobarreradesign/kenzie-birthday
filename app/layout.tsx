import type { Metadata } from "next";
import { Caveat, Libre_Baskerville, Rubik_Wet_Paint } from "next/font/google";
import "./globals.css";

const display = Rubik_Wet_Paint({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

const script = Caveat({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "Happy Birthday Kenzie ★",
  description:
    "A vintage-grunge interactive birthday tribute — decorate Kenzie, leave love notes, make a wish.",
  openGraph: {
    title: "Happy Birthday Kenzie ★",
    description: "Decorate, doodle, and leave love notes for Kenzie.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${script.variable} grain antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
