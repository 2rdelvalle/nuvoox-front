"use client"
import { ToastProvider } from "@/shared/context/toast/toastContext"
import "primeflex/primeflex.css"
import "primeicons/primeicons.css"
import { PrimeReactProvider } from "primereact/api"
import "primereact/resources/primereact.css"
import * as React from "react"
import { LayoutProvider } from "../layout/context/layoutcontext"
import "../styles/layout/layout.scss"

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
                <PrimeReactProvider>
                    <LayoutProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </LayoutProvider>
                </PrimeReactProvider>
            </body>
        </html>
  )
}
