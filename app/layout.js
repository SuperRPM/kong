import { Inter } from 'next/font/google'
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "Kong",
  description: "팀 이슈 트래커",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} min-h-full bg-white text-[#171717]`}>{children}</body>
    </html>
  );
}
