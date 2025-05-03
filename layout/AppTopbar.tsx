import { useToast } from "@/shared/context/toast/toastContext"
import type { AppTopbarRef } from "@/types"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { forwardRef, useContext, useImperativeHandle, useRef } from "react"
import AppBreadcrumb from "./AppBreadCrumb"
import { LayoutContext } from "./context/layoutcontext"
import Clock from "@/shared/components/clock/clock"

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
  const { onMenuToggle, showProfileSidebar, showConfigSidebar } =
        useContext(LayoutContext)
  const menubuttonRef = useRef(null)

  const { showError } = useToast()

  const onConfigButtonClick = () => {
    showConfigSidebar()
  }

  useImperativeHandle(ref, () => ({
    menubutton: menubuttonRef.current
  }))

  return (
        <div className="layout-topbar">
            <div className="topbar-start">
                <button
                    ref={menubuttonRef}
                    type="button"
                    className="topbar-menubutton p-link p-trigger"
                    onClick={onMenuToggle}
                >
                    <i className="pi pi-bars"></i>
                </button>

                <AppBreadcrumb className="topbar-breadcrumb"></AppBreadcrumb>
            </div>
            <div className="ml-3 mr-3">
                <Clock />
            </div>
            <div className="topbar-end">
                <ul className="topbar-menu">
                    <li className="topbar-search">
                        <span className="p-input-icon-left">
                            <i className="pi pi-search"></i>
                            <InputText
                                type="text"
                                placeholder="Busqueda"
                                className="w-12rem sm:w-full"
                                onClick={() => showError("No Implementado")}
                            />
                        </span>
                    </li>
                    <li className="ml-3">
                        <Button
                            type="button"
                            icon="pi pi-cog"
                            text
                            rounded
                            severity="secondary"
                            className="flex-shrink-0"
                            onClick={onConfigButtonClick}
                        ></Button>
                    </li>
                    <li className="topbar-profile">
                        <button
                            type="button"
                            className="p-link"
                            onClick={showProfileSidebar}
                        >
                            <img
                                src="/layout/images/avatar/avatar.png"
                                alt="Profile"
                            />
                        </button>
                    </li>
                </ul>
            </div>
        </div>
  )
})

AppTopbar.displayName = "AppTopbar"

export default AppTopbar
