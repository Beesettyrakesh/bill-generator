import { Metadata } from "next";
import ClientSessionProvider from "./client-session-provider";
import ClientLayout from "./client-layout";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "Billezy",
  description: "Generate and manage bills for different branches",
  keywords: ["bill generator", "invoice generator", "document management"],
  icons: {
    icon: "/electric-generator.png",
    apple: "/electric-generator.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClientSessionProvider>
            <ClientLayout>{children}</ClientLayout>
          </ClientSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
