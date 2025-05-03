"use client"
import React from "react"
import { ChatProvider } from "@/shared/components/chat/context/chatcontext"

interface ChatLayoutProps {
    children: React.ReactNode;
}

export default function ChatLayout ({ children }: ChatLayoutProps) {
  return <ChatProvider>{children}</ChatProvider>
}
