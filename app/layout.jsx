import React from 'react';

export const metadata = {
  title: 'Investor Tracking System',
  description: 'Theatre Production Investor Tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
