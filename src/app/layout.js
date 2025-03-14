// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import TanstackLayout from "@/providers/tanstackLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "EdaptAI - Personalized Learning Assistant",
  description: "Adaptive learning platform powered by AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <TanstackLayout>
        <body className={inter.className}>
          <div className="min-h-screen bg-background">{children}</div>
        </body>
      </TanstackLayout>
    </html>
  );
}
