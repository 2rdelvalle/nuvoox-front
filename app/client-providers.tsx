"use client"

import { ToastProvider } from "@/shared/context/toast/toastContext"
import { PrimeReactProvider } from "primereact/api"
import * as React from "react"
import { LayoutProvider } from "../layout/context/layoutcontext"

interface ClientProvidersProps {
  children: React.ReactNode
}

/**
 * Client-side providers wrapper component
 * All client-side context providers should be placed here
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <PrimeReactProvider>
      <LayoutProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </LayoutProvider>
    </PrimeReactProvider>
  )
}
