import React, { useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { InputTextarea } from 'primereact/inputtextarea';
import { useToast } from '@/shared/context/toast/toastContext';
import { sendMediaMessage } from '../service/chatServices';
import { MESSAGE_OWNER, MESSAGE_TYPE, MessageModel } from '@/shared/models/conversation/messages.model';
import FileUploadProgress from './FileUploadProgress';

interface FileAttachmentProps {
  activeConversation: any;
  dataToken: string | any; // Aceptar cualquier tipo para manejar JWTAuth
  actualNumberOfMaintanceSelected: any;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
  /**
   * Callback opcional que permite al componente padre añadir el mensaje localmente
   * tras enviarlo correctamente. Dejar undefined si no se requiere.
   */
  onLocalMessage?: (msg: MessageModel) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ACCEPTED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/jpg'],
  video: ['video/mp4', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

function isValidMime(type: string): boolean {
  return Object.values(ACCEPTED_MIME_TYPES).some(arr => arr.includes(type));
}

function detectMediaType(type: string): 'image' | 'video' | 'document' {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  return 'document';
}

const FileAttachment: React.FC<FileAttachmentProps> = ({
  activeConversation,
  dataToken,
  actualNumberOfMaintanceSelected,
  showError,
  showSuccess,
  onLocalMessage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileDescription, setFileDescription] = useState<string>('');
  const { showError: toastError, showSuccess: toastSuccess } = useToast();

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setShowPreview(false);
    setFileDescription('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const msg = 'El archivo excede el límite de 5 MB';
      showError(msg);
      toastError(msg);
      e.target.value = '';
      return;
    }
    if (!isValidMime(file.type)) {
      const msg = 'Tipo de archivo no soportado';
      showError(msg);
      toastError(msg);
      e.target.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  /**
   * Simula el progreso de carga con incrementos artificiales para mejor UX
   */
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    setIsUploading(true);
    setUploadError(null);

    // Simular progreso de carga con intervalos aleatorios
    const interval = setInterval(() => {
      setUploadProgress(current => {
        // Incrementos más lentos cerca del final para simular procesamiento
        const increment = current < 80 ? Math.random() * 10 : Math.random() * 3;
        const next = Math.min(current + increment, 95); // Máximo 95% para esperar confirmación
        return Math.round(next);
      });
    }, 300);

    return interval;
  };

  /**
   * Maneja el envío del archivo y actualiza la UI con el progreso
   */
  const handleSend = async () => {
    if (!selectedFile) return;
    if (!activeConversation?.phone) {
      showError('No hay una conversación activa');
      return;
    }

    // Iniciar simulación de progreso
    const progressInterval = simulateUploadProgress();
    setShowPreview(false); // Cerrar preview

    try {
      const recipientPhone = `+${activeConversation.phone}`;
      const senderId = `${actualNumberOfMaintanceSelected?.idNumberPhone}`;
      const mediaType = detectMediaType(selectedFile.type);

      // Validar que el token sea válido antes de enviar
      if (!dataToken) {
        throw new Error('No se pudo obtener la autenticación necesaria para enviar archivos');
      }
      
      // Obtener el token actual como string para poder enviarlo
      const accessToken = typeof dataToken === 'string' ? dataToken : 
        (dataToken.IdAccountWB || dataToken.token || '');
        
      // Llamada al servicio con la descripción
      await sendMediaMessage(recipientPhone, selectedFile, accessToken, senderId, fileDescription);

      // Completar el progreso al 100% antes de marcar como enviado
      setUploadProgress(100);
      setTimeout(() => {
        // Construir mensaje local opcionalmente
        if (onLocalMessage) {
          // Si hay descripción, mostrarla junto con el nombre del archivo
          const displayContent = fileDescription 
            ? `${selectedFile.name}${fileDescription ? ' - ' + fileDescription : ''}` 
            : selectedFile.name;
            
          const localMsg: MessageModel = {
            content: displayContent,
            owner: MESSAGE_OWNER.AGENT,
            sentAt: Date.now(),
            type: MESSAGE_TYPE[mediaType.toUpperCase() as keyof typeof MESSAGE_TYPE] || MESSAGE_TYPE.DOCUMENT,
            conversationId: activeConversation.conversationid,
            from: senderId,
            id: Date.now(),
            idWhatsapp: undefined as any
          } as MessageModel;
          onLocalMessage(localMsg);
        }

        showSuccess('Archivo enviado correctamente');
        toastSuccess('Archivo enviado correctamente');
        setIsUploading(false);
        reset();
      }, 500);

    } catch (error) {
      console.error('Error sending media message', error);
      setUploadError('Error al enviar el archivo. Intente nuevamente.');
      showError('Error al enviar archivo');
      toastError('Error al enviar archivo');
      setTimeout(() => setIsUploading(false), 1000);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const renderPreviewContent = () => {
    if (!selectedFile) return null;
    const mediaType = detectMediaType(selectedFile.type);

    switch (mediaType) {
      case 'image':
        return (
          <div className="flex flex-column gap-2">
            <img src={previewUrl} alt={selectedFile.name} className="max-w-full" />
            <InputTextarea
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              placeholder="Agregar una descripción (opcional)"
              rows={2}
              className="w-full mt-2"
              autoResize
            />
          </div>
        );
      case 'video':
        return (
          <div className="flex flex-column gap-2">
            <video src={previewUrl} controls className="max-w-full" />
            <InputTextarea
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              placeholder="Agregar una descripción (opcional)"
              rows={2}
              className="w-full mt-2"
              autoResize
            />
          </div>
        );
      default:
        return (
          <div className="flex flex-column align-items-center gap-2 p-4">
            <i className="pi pi-file" style={{ fontSize: '2rem' }}></i>
            <span>{selectedFile.name}</span>
            <InputTextarea
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              placeholder="Agregar una descripción (opcional)"
              rows={2}
              className="w-full mt-2"
              autoResize
            />
          </div>
        );
    }
  };

  const cancelUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    reset();
  };

  return (
    <React.Fragment>
      {/* Para tooltips avanzados */}
      <Tooltip target=".file-attachment-button" />

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept={Object.values(ACCEPTED_MIME_TYPES).flat().join(',')}
      />

      {/* Attachment button */}
      <Button
        className="justify-content-center file-attachment-button"
        severity="secondary"
        icon="pi pi-paperclip"
        onClick={triggerFileDialog}
        tooltip="Adjuntar archivo (imágenes, videos, documentos)"
        tooltipOptions={{ position: 'top', showDelay: 700 }}
        disabled={isUploading}
      />

      {/* Preview dialog */}
      <Dialog
        header="Vista previa de archivo"
        visible={showPreview}
        onHide={reset}
        style={{ width: '30vw', maxWidth: '450px' }}
        breakpoints={{ '960px': '90vw', '641px': '95vw' }}
      >
        <div className="flex flex-column gap-3">
          {renderPreviewContent()}
          <div className="flex justify-content-end gap-2 mt-3">
            <Button label="Cancelar" severity="secondary" outlined onClick={reset} />
            <Button 
              label="Enviar" 
              icon="pi pi-send" 
              onClick={handleSend} 
              className="p-button-success"
            />
          </div>
          <div className="text-xs text-500 mt-2 text-center">
            Tamaño máximo: 5MB | Formatos soportados: imágenes, videos, documentos
          </div>
        </div>
      </Dialog>

      {/* Indicador de progreso de carga - Usando Portal para evitar problemas de DOM */}
      <div id="file-upload-progress-container" className="file-upload-container">
        {isUploading && (
          <div 
            className="fixed bottom-0 right-0 p-3 z-5"
            style={{ width: '300px' }}
          >
            <FileUploadProgress
              fileName={selectedFile?.name || 'archivo'}
              progress={uploadProgress}
              onCancel={cancelUpload}
              error={uploadError || undefined}
            />
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default FileAttachment;
