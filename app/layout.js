import './globals.css';

export const metadata = {
  title: 'Velvet Club',
  description: 'More than a server. A place to belong.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
