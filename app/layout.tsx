import { DocumentProvider } from '@/contexts/DocumentContext';
import { FuelPriceProvider } from '@/contexts/FuelPriceContext';
import './globals.css';

export const metadata = {
  title: 'Bill Generator',
  description: 'Generate and manage bills for different branches',
  keywords: ['bill generator', 'invoice generator', 'document management'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <DocumentProvider>
          <FuelPriceProvider>
            <main className="app-main">
              {children}
            </main>
            <footer className="app-footer">
              <p>&copy; {new Date().getFullYear()} Bill Generator</p>
            </footer>
          </FuelPriceProvider>
        </DocumentProvider>
      </body>
    </html>
  )
}
