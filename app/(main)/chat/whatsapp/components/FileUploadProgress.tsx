import React, { useEffect, useRef } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

interface FileUploadProgressProps {
  fileName: string;
  progress: number;
  onCancel: () => void;
  error?: string;
}

/**
 * Componente para mostrar el progreso de carga de archivos
 * Incluye una barra de progreso y un botón para cancelar
 */
/**
 * Componente para mostrar el progreso de carga de archivos
 * Implementa un manejo seguro del DOM y previene errores de renderizado
 */
const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  fileName,
  progress,
  onCancel,
  error
}) => {
  // Referencia para control seguro del componente
  const componentMounted = useRef(true);
  
  // Truncar nombre de archivo si es muy largo
  const displayName = fileName.length > 25 
    ? fileName.substring(0, 22) + '...' 
    : fileName;
  
  // Efecto de limpieza para evitar actualizaciones en componentes desmontados
  useEffect(() => {
    componentMounted.current = true;
    
    return () => {
      componentMounted.current = false;
    };
  }, []);
  
  // Función segura para cancelar, previene operaciones en componentes desmontados
  const handleCancel = () => {
    if (componentMounted.current) {
      onCancel();
    }
  };
  
  return (
    <Card className="mb-3 shadow-2">
      <div className="flex flex-column gap-2">
        <div className="flex justify-content-between align-items-center">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-file text-primary text-xl"></i>
            <span className="font-medium">{displayName}</span>
          </div>
          <Button 
            icon="pi pi-times" 
            className="p-button-rounded p-button-text p-button-sm" 
            onClick={handleCancel}
            tooltip="Cancelar"
          />
        </div>
        
        {error ? (
          <div className="p-error text-sm mt-2 mb-1">{error}</div>
        ) : (
          <>
            <ProgressBar 
              value={progress} 
              showValue={false} 
              style={{ height: '8px' }}
              className="mt-2"
            />
            <div className="text-right text-sm text-500">{progress}%</div>
          </>
        )}
      </div>
    </Card>
  );
};

export default FileUploadProgress;
