import './globals.css'
import React from 'react'
import type { Metadata } from 'next'
import { SettingsProvider } from '@/lib/SettingsContext'

export const metadata: Metadata = {
  title: 'Intercom Logger',
  description: 'Voice to text logger application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  )
}
