/**
 * Utilidad para descargar plantilla CSV de contactos para campañas WhatsApp
 */

export interface ContactTemplate {
  nombre: string;
  telefono: string;
  email: string;
}

/**
 * Genera y descarga un archivo CSV con el formato de ejemplo para contactos
 * @param filename - Nombre del archivo (opcional)
 */
export function downloadContactsCsvTemplate(filename?: string): void {
  // Datos de ejemplo para la plantilla
  const templateData: ContactTemplate[] = [
    {
      nombre: 'Ramiro Rodelo',
      telefono: '+573126486075',
      email: 'ramiro@email.com'
    },
    {
      nombre: 'María García',
      telefono: '+573001234567',
      email: 'maria@email.com'
    },
    {
      nombre: 'Juan Pérez',
      telefono: '+573157890123',
      email: 'juan@email.com'
    }
  ];

  // Convertir datos a formato CSV
  const csvContent = convertToCsv(templateData);
  
  // Crear y descargar archivo
  const fileName = filename || `formato_contactos_${Date.now()}.csv`;
  downloadCsvFile(csvContent, fileName);
}

/**
 * Convierte array de objetos a formato CSV
 */
function convertToCsv(data: ContactTemplate[]): string {
  if (data.length === 0) return '';

  // Obtener headers
  const headers = Object.keys(data[0]);
  
  // Crear línea de headers
  const csvHeaders = headers.join(',');
  
  // Crear líneas de datos
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header as keyof ContactTemplate];
      // Escapar valores que contengan comas o comillas
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    }).join(',')
  );
  
  // Combinar headers y datos
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Descarga un archivo CSV
 */
function downloadCsvFile(csvContent: string, fileName: string): void {
  // Crear blob con el contenido CSV
  const blob = new Blob([csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Crear elemento anchor para descarga
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Crear URL del blob
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    // Agregar al DOM, hacer click y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL del blob
    URL.revokeObjectURL(url);
  }
}
