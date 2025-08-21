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
      <body className="pt-0 mt-0">
        <DocumentProvider>
          <FuelPriceProvider>
            <header className="app-header sticky top-0 z-50">
              <div className="max-w-[98%] mx-auto flex justify-center items-center">
                <h1 className="text-3xl font-bold font-heading">Bill Generator</h1>
              </div>
            </header>
            <main className="app-main pt-4">
              {children}
            </main>
            <footer className="app-footer">
              <p className="font-serif">&copy; {new Date().getFullYear()} Bill Generator</p>
            </footer>
          </FuelPriceProvider>
        </DocumentProvider>
      </body>
    </html>
  )
}
