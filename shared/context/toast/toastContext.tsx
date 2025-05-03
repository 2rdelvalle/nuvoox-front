// ToastContext.js
"use client"
import { Toast, ToastMessage } from "primereact/toast"
import { ReactNode, createContext, useContext, useRef } from "react"

interface ToastContextType {
  showToast: (severity : any, summary: string, message: string) => void;
  showSuccess: (message: string) => void;
  showSuccessMany: (message: string[]) => void;
  showInfo: (message: string) => void;
  showInfoMany: (message: string[]) => void;
  showWarn: (message: string) => void;
  showWarnMany: (message: string[]) => void;
  showError: (message: string) => void;
  showErrorMany: (message: string[]) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  showSuccess: () => {},
  showSuccessMany: () => {},
  showInfo: () => {},
  showInfoMany: () => {},
  showWarn: () => {},
  showWarnMany: () => {},
  showError: () => {},
  showErrorMany: () => {},
  hideToast: () => {}
})

export function ToastProvider ({ children }: { children: ReactNode }) {
  const toast = useRef<Toast>(null)

  const showToast = (severity : any, summary : string, detail : string) => {
    toast.current?.show({ severity, summary, detail })
  }
  const showSuccess = (detail : string) => {
    toast.current?.show({ severity: "success", summary: "Exito", detail })
  }
  const showSuccessMany = (detail : string[]) => {
    toast.current?.show(detail.map((message) => {
      return { severity: "success", summary: "Exito", detail: message, life: 3000 } as ToastMessage
    }))
  }
  const showInfo = (detail : string) => {
    toast.current?.show({ severity: "info", summary: "Informacion", detail })
  }
  const showInfoMany = (detail : string[]) => {
    toast.current?.show(detail.map((message) => {
      return { severity: "info", summary: "Informacion", detail: message } as ToastMessage
    }))
  }
  const showWarn = (detail : string) => {
    toast.current?.show({ severity: "warn", summary: "Alerta", detail })
  }
  const showWarnMany = (detail : string[]) => {
    toast.current?.show(detail.map((message) => {
      return { severity: "warn", summary: "Alerta", detail: message } as ToastMessage
    }))
  }
  const showError = (detail : string) => {
    toast.current?.show({ severity: "error", summary: "Error", detail })
  }
  const showErrorMany = (detail : string[]) => {
    toast.current?.show(detail.map((message) => {
      return { severity: "error", summary: "Error", detail: message } as ToastMessage
    }))
  }

  const hideToast = () => {
    toast.current?.clear()
  }

  return (
    <ToastContext.Provider value={
      {
        showToast,
        showSuccess,
        showSuccessMany,
        showInfo,
        showInfoMany,
        showWarn,
        showWarnMany,
        showError,
        showErrorMany,
        hideToast
      }}>
      <Toast ref={toast}/>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast () {
  return useContext(ToastContext)
}
