import type { ChatContextProps, Demo } from "@/types"
import React, { useCallback, useState } from "react"

export const ChatContext = React.createContext({} as ChatContextProps)

interface ChatProviderProps {
    children: React.ReactNode;
}

export const ChatProvider = (props: ChatProviderProps) => {
  const [users, setUsers] = useState<Demo.User[]>([])
  const [activeUser, setActiveUser] = useState<Demo.User>({})

  const getChatData = useCallback(() => {
    return fetch("/demo/data/chat.json", {
      headers: { "Cache-Control": "no-cache" }
    })
      .then((res) => res.json())
      .then((d) => d.data)
  }, [])

  const changeActiveChat = (user: Demo.User) => {
    setActiveUser(user)
  }

  const sendMessage = (message: Demo.Message) => {
    const _users = [...users]
    _users.forEach((user) => {
      if (user.id === activeUser.id) {
        if (user.messages) {
          user.messages.push(message)
        } else {
          user.messages = [message]
        }
      }
    })
    setActiveUser((prevState) => ({
      ...prevState,
      messages: [...(prevState.messages || []), message]
    }))
    setUsers(_users)
  }

  const value = {
    users,
    setUsers,
    activeUser,
    setActiveUser,
    getChatData,
    changeActiveChat,
    sendMessage
  }

  return (
        <ChatContext.Provider value={value}>
            {props.children}
        </ChatContext.Provider>
  )
}
