import { Metadata } from "next"
import Layout from "../../layout/layout"
import React from "react"

interface MainLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "Nuvoox App",
  description:
        "Not Desciption",
  robots: { index: false, follow: false },
  viewport: { initialScale: 1, width: "device-width" },
  openGraph: {
    type: "website",
    title: "Nuvoox App",
    url: "https://Nuvoox/",
    description:
            "Not Desciption",
    ttl: 604800
  },
  icons: {
    icon: "/favicon.ico"
  }
}

export default function MainLayout ({ children }: MainLayoutProps) {
  return <Layout>{children}</Layout>
}
