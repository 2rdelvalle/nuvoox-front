import { Avatar } from "primereact/avatar"
import { Divider } from "primereact/divider"
import { Sidebar } from "primereact/sidebar"
import { Tag } from "primereact/tag"
import { FaWhatsapp } from "react-icons/fa"
import { useChatStore } from "../store/chat-store"

const SidebarConversation = () => {
  const { sidebarConversationVisible, setSidebarConversationVisible, selectedSidebarConversationInfo } = useChatStore()
  return (
    <Sidebar
      visible={sidebarConversationVisible}
      position="right"
      onHide={() => setSidebarConversationVisible(false)}
      modal={false}
      className="p-sidebar-md"
      style={{ width: "25rem" }}
    >
      {selectedSidebarConversationInfo && (
        <div className="flex flex-column gap-4 p-3">
          <h2 className="text-900 font-semibold mb-0">Información del Contacto</h2>

          <div className="flex flex-column align-items-center gap-2">
            <Avatar
              label={"US"}
              size="xlarge"
              shape="circle"
              style={{ backgroundColor: "#F97316", color: "#fff", fontSize: "1.5rem" }}
            />
            <span className="text-xl font-semibold">
                {"+" + selectedSidebarConversationInfo.indicative + " " + selectedSidebarConversationInfo.destination_number}
                </span>
          </div>

          <Divider />

          <div className="flex flex-column gap-2">
            <span className="text-sm text-500 font-medium">Información de contacto</span>
            <div className="flex align-items-center gap-2">
              <i className="pi pi-phone text-600" />
              <span>{selectedSidebarConversationInfo.phone}</span>
            </div>
            <div className="flex align-items-center gap-2">
              <FaWhatsapp className="text-green-500" />
              <span>Canal: WhatsApp</span>
            </div>
          </div>

          <Divider />

          <div>
            <span className="text-sm text-500 font-medium mr-2">Estado de la conversación</span>
            <Tag value="Activa" severity="success" className="mt-1" />
          </div>

          <Divider />

          <div>
            <span className="text-sm text-500 font-medium">Canales disponibles</span>
            <div className="flex gap-3 mt-2">
              <FaWhatsapp className="text-green-500 cursor-pointer" />
              {/* <FaFacebookF className="text-blue-600 cursor-pointer" />
              <FaInstagram className="text-pink-500 cursor-pointer" />
              <FaGlobe className="text-gray-600 cursor-pointer" /> */}
            </div>
          </div>

          <Divider />

          <div>
            <span className="text-sm text-500 font-medium">Etiquetas</span>
            <p className="mt-1 text-600">Sin etiquetas</p>
          </div>
        </div>
      )}
    </Sidebar>
  )
}

export default SidebarConversation
