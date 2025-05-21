/**
 * Tipos de medios soportados para plantillas multimedia
 */
export enum TemplateMediaType {
  NONE = 'none',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

/**
 * Modelo para plantillas multimedia
 */
export interface MultimediaTemplateModel {
  /**
   * Nombre de la plantilla
   */
  name: string;
  
  /**
   * ID de la compañía
   */
  companyId: number;
  
  /**
   * Tipo de contenido multimedia
   */
  mediaType: TemplateMediaType;
  
  /**
   * URL del archivo multimedia (obligatorio para tipos diferentes a none)
   */
  mediaUrl?: string;
  
  /**
   * Descripción o leyenda del medio
   */
  mediaCaption?: string;
  
  /**
   * Nombre del archivo (para documentos)
   */
  mediaFilename?: string;
  
  /**
   * Idioma de la plantilla
   */
  language?: string;
  
  /**
   * Categoría de la plantilla
   */
  category?: string;
  
  /**
   * Texto principal del mensaje
   */
  text: string;
}
