import type { Metadata } from 'next';
import './style.css';

export const metadata: Metadata = {
  title: 'Smart Attendance — SE/Registrar',
  description: 'Restricted administrative reporting prototype',
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}