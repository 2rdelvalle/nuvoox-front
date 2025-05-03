/* eslint-disable max-len */
import { Sidebar } from "primereact/sidebar"
import { useContext } from "react"
import { LayoutContext } from "./context/layoutcontext"
import { usePush } from "@/shared/hooks/usePush"
import { useChatStore } from "@/app/(main)/chat/whatsapp/store/chat-store"

const AppProfileSidebar = () => {
  const { layoutState, setLayoutState } = useContext(LayoutContext)
  const { onClickAction } = usePush("/auth/login")

  const { user } = useChatStore()

  const onProfileSidebarHide = () => {
    setLayoutState((prevState) => ({
      ...prevState,
      profileSidebarVisible: false
    }))
  }

  function closeSession () {
    // borrar localStorage
    localStorage.removeItem("token")
    // borrar la cookie
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    onClickAction()
  }

  return (
        <Sidebar
            visible={layoutState.profileSidebarVisible}
            onHide={onProfileSidebarHide}
            position="right"
            className="layout-profile-sidebar w-full sm:w-25rem"
        >
            <div className="flex flex-column mx-auto md:mx-0">
                <span className="mb-2 font-semibold">Hola</span>
                <span className="text-color-secondary font-medium mb-5">
                    {user?.name}
                </span>
            </div>

            <ul className="list-none m-0 p-0">
                    <li>
                        <a
                        className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150"
                        onClick={() => closeSession()}
                        >
                            <span>
                                <i className="pi pi-user text-xl text-primary"></i>
                            </span>
                            <div className="ml-3">
                                <span className="mb-2 font-semibold">
                                    Cerrar Sesion
                                </span>
                                <p className="text-color-secondary m-0">
                                    Pulse aqui para salir del aplicativo
                                </p>
                            </div>
                        </a>
                        </li>
                </ul>
        </Sidebar>
  )
}

export default AppProfileSidebar
