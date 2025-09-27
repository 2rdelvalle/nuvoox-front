// Función para determinar si la aplicación está en entorno de producción
const isProduction = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.hostname !== 'localhost';
  }
  return process.env.NODE_ENV === 'production';
};

/**
 * Servicio para gestionar la carga de archivos al servidor
 */
export class FileUploadService {
  /**
   * Sube un archivo al servidor y devuelve la URL pública del archivo guardado
   * @param file El archivo a subir
   * @param subDirectory Subdirectorio opcional donde guardar el archivo (ej: 'templates')
   * @returns La URL pública del archivo subido
   */
  static async uploadFile(file: File, subDirectory: string = 'templates'): Promise<{ url: string; filename: string }> {
    try {
      // Construir la URL base del API según el entorno
      const API_BASE_URL = isProduction()
        ? '/web/nuvoox/api'
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/nuvoox/api');
      
      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subDirectory', subDirectory);
      
      // Utilizar el endpoint de plantillas multimedia para subir el archivo
      const response = await fetch(`${API_BASE_URL}/templates/multimedia/upload`, {
        method: 'POST',
        body: formData,
        // No establecer Content-Type, fetch lo hará automáticamente para FormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el archivo');
      }
      
      const data = await response.json();
      console.log('Archivo subido exitosamente:', data);
      
      return {
        url: data.url,
        filename: data.filename || file.name
      };
    } catch (error) {
      console.error('Error en el servicio de carga de archivos:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si una URL es una URL de Cloudinary
   * @param url URL a verificar
   * @returns true si es una URL de Cloudinary
   */
  static isCloudinaryUrl(url: string): boolean {
    return url?.includes('cloudinary.com');
  }
  
  /**
   * Determina si debemos usar la URL directamente (para URLs existentes) o subir el archivo
   * @param fileOrUrl Puede ser un archivo o una URL
   * @param subDirectory Subdirectorio opcional
   * @returns Objeto con URL y nombre de archivo
   */
  static async processFileOrUrl(
    fileOrUrl: File | string, 
    subDirectory: string = 'templates'
  ): Promise<{ url: string; filename: string }> {
    // Si es una string y parece una URL, la devolvemos directamente
    if (typeof fileOrUrl === 'string') {
      // Extraer el nombre del archivo de la URL
      const urlParts = fileOrUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      return {
        url: fileOrUrl,
        filename
      };
    }
    
    // Si es un archivo, lo subimos
    if (fileOrUrl instanceof File) {
      return this.uploadFile(fileOrUrl, subDirectory);
    }
    
    throw new Error('El parámetro debe ser un archivo o una URL');
  }
}
