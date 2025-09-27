import "primeflex/primeflex.css"
import "primeicons/primeicons.css"
import "primereact/resources/primereact.css"
import * as React from "react"
import "../styles/layout/layout.scss"
import ClientProviders from "./client-providers"

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout ({ children }: RootLayoutProps) {
  return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    id="theme-link"
                    href={"/theme/theme-light/indigo/theme.css"}
                    rel="stylesheet"
                ></link>
            </head>
            <body>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
  )
}
