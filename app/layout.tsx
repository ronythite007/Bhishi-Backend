import type { ReactNode } from "react";

export const metadata = {
  title: "Chitti Bhishi API",
  description: "Next.js API service for Chitti Bhishi",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
