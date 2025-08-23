import ClientSessionProvider from './client-session-provider';

export const metadata = {
  title: 'Bill Generator',
  description: 'Generate and manage bills for different branches',
  keywords: ['bill generator', 'invoice generator', 'document management'],
};

export default function RootLayout({ children }) {
  // Simple HTML structure that works for all pages
  return (
    <html lang="en">
      <body className="overflow-x-hidden">
        <ClientSessionProvider>{children}</ClientSessionProvider>
      </body>
    </html>
  );
}
