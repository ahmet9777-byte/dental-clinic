import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title       : 'DentaCare — Clinical Sanctuary',
  description : 'Modern dental clinic appointment management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
