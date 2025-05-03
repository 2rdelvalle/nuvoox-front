import React from "react"
import { Avatar } from "primereact/avatar"
import { MessageTProps } from "./types/messageTypes"

function InfoMessage ({ message } : MessageTProps) {
  return (
    <div className="flex flex-nowrap gap-2 align-items-baseline">
        <Avatar icon="pi pi-info" style={{ backgroundColor: "#0000008", color: "#1d47a2" }} shape="circle" />
        <>{message}</>
    </div>
  )
}

export default InfoMessage
