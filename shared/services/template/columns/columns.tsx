import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { Badge } from "primereact/badge"
import { Button } from "primereact/button"
import { Dialog } from "primereact/dialog"
import { Card } from "primereact/card"
import { Divider } from "primereact/divider"
import React, { useState } from "react"

// Funciones de utilidad para mostrar los badges
const badgeStatus = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Badge severity="info" value="Pendiente" className="mr-2">Pendiente</Badge>
    case "APPROVED":
      return <Badge severity="success" value="Aprobado" className="mr-2">Aprobado</Badge>
    default:
      return <span className="badge badge-secondary">Desconocido</span>
  }
}

const badgeCategory = (category: string) => {
  switch (category) {
    case "MARKETING":
      return <Badge severity="info" value="Marketing" className="mr-2">Marketing</Badge>
    case "UTILITY":
      return <Badge severity="info" value="Utilidad" className="mr-2">Utilidad</Badge>
    default:
      return <span className="badge badge-secondary">Desconocido</span>
  }
}

// Componente para visualizar los detalles de la plantilla
interface PreviewTemplateProps {
  template: any;
  visible: boolean;
  onHide: () => void;
}

/**
 * Componente para mostrar una previsualización detallada de una plantilla
 * @param template - Datos de la plantilla a mostrar
 * @param visible - Estado de visibilidad del diálogo
 * @param onHide - Función para cerrar el diálogo
 */
const PreviewTemplate: React.FC<PreviewTemplateProps> = ({ template, visible, onHide }) => {
  if (!template) return null;
  
  // Variables seguras con valores por defecto
  let templateName = '(Sin nombre)';
  let templateId = '(ID no disponible)';
  let companyId = '(ID de empresa no disponible)';
  let templateContent = '(Sin contenido)';
  
  try {
    // Intenta obtener el nombre de la plantilla
    if (template.name) {
      templateName = template.name;
    }
    
    // Intenta obtener el ID de la plantilla
    if (template.id) {
      templateId = String(template.id);
    }
    
    // Intenta obtener el ID de empresa (con múltiples rutas posibles)
    if (template.companyID) {
      companyId = String(template.companyID);
    } else if (template.company && template.company.id) {
      companyId = String(template.company.id);
    } else if (template.company && template.company.companyId) {
      companyId = String(template.company.companyId);
    }
    
    // Intenta obtener el contenido de la plantilla
    if (template.textTemplate) {
      templateContent = template.textTemplate;
    }
  } catch (error) {
    console.error('Error al extraer datos de la plantilla:', error);
  }
  
  const headerTitle = (
    <div className="flex align-items-center justify-content-between">
      <span>Vista previa de plantilla: {templateName}</span>
    </div>
  );
  
  return (
    <Dialog 
      header={headerTitle}
      visible={visible} 
      style={{ width: '70vw', maxWidth: '800px' }} 
      modal 
      onHide={onHide}
      footer={
        <div className="flex justify-content-end">
          <Button label="Cerrar" icon="pi pi-times" onClick={onHide} className="p-button-secondary" />
        </div>
      }
    >
      <div className="grid">
        <div className="col-12">
          <Card>
            <div className="flex align-items-center mb-3">
              <i className="pi pi-info-circle mr-2" style={{ fontSize: '1.5rem' }}></i>
              <h3 className="m-0">Información de la plantilla</h3>
            </div>
            <Divider />
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="mb-3">
                  <label className="font-bold block mb-1">Nombre:</label>
                  <span>{templateName}</span>
                </div>
                
                <div className="mb-3">
                  <label className="font-bold block mb-1">Estado:</label>
                  {badgeStatus(template.statusTemplateWhatsapp)}
                </div>
                
                <div className="mb-3">
                  <label className="font-bold block mb-1">Categoría:</label>
                  {badgeCategory(template.categoryTemplateWhatsapp)}
                </div>
              </div>
              
              <div className="col-12 md:col-6">
                <div className="mb-3">
                  <label className="font-bold block mb-1">ID de plantilla:</label>
                  <span>{templateId}</span>
                </div>
                
                <div className="mb-3">
                  <label className="font-bold block mb-1">ID de empresa:</label>
                  <span>{companyId}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-12 mt-3">
          <Card>
            <div className="flex align-items-center mb-3">
              <i className="pi pi-comment mr-2" style={{ fontSize: '1.5rem' }}></i>
              <h3 className="m-0">Contenido de la plantilla</h3>
            </div>
            <Divider />
            <div className="whatsapp-preview p-3 border-round" style={{ backgroundColor: '#e5ddd5' }}>
              <div className="message-bubble p-3 border-round" style={{ backgroundColor: '#ffffff', maxWidth: '80%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <div className="font-medium">
                  {templateContent}
                </div>
                
                {template.mediaUrl && (
                  <div className="mt-3">
                    <label className="font-bold block mb-1">Archivo multimedia:</label>
                    {template.mediaType === 'image' ? (
                      <img src={template.mediaUrl} alt="Imagen de plantilla" className="w-full border-round" />
                    ) : (
                      <a href={template.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                        Ver archivo multimedia ({template.mediaType})
                      </a>
                    )}
                    
                    {template.mediaCaption && (
                      <div className="mt-2 text-sm">{template.mediaCaption}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Dialog>
  );
};

export const COLUMNS_TEMPLATE = () => {
  // Estado para el control de la previsualización
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  const showPreview = (template: any) => {
    setPreviewTemplate(template);
    setPreviewVisible(true);
  };
  
  const hidePreview = () => {
    setPreviewVisible(false);
  };

  const columns : ColumnsType[] = [
    {
      field: "templateId",
      header: "#",
      style: { width: "5%" },
      // render # count of the table
      body: ((_rowData: any, options: any) => <span>{options.rowIndex + 1}</span>) as (rowData: any) => any
    },
    {
      field: "name",
      header: "Nombre",
      style: { width: "45%" }
    },
    {
      field: "statusTemplateWhatsapp",
      header: "Estado",
      style: { width: "15%" },
      body: (rowData: any) => {
        return badgeStatus(rowData.statusTemplateWhatsapp)
      }
    },
    {
      field: "categoryTemplateWhatsapp",
      header: "Categoría",
      style: { width: "15%" },
      body: (rowData: any) => {
        return badgeCategory(rowData.categoryTemplateWhatsapp)
      }
    },
    {
      field: "actions",
      header: "Acciones",
      style: { width: "20%" },
      body: (rowData: any) => {
        return (
          <div className="flex justify-content-center">
            <Button 
              icon="pi pi-eye" 
              className="p-button-rounded p-button-info p-button-text" 
              tooltip="Previsualizar plantilla"
              onClick={() => showPreview(rowData)}
            />
          </div>
        )
      }
    }
  ]

  return { 
    columns,
    PreviewTemplate,
    previewTemplate,
    previewVisible,
    hidePreview
  }
}
