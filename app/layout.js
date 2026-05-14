import "./globals.css";

export const metadata = {
  title: "Kong",
  description: "팀 이슈 트래커",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-slate-900">{children}</body>
    </html>
  );
}
