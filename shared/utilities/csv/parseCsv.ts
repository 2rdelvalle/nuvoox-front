/**
 * Utilidad para procesar archivos CSV de contactos
 */

export interface ParsedContact {
  nombre: string;
  telefono: string;
  email?: string;
}

export interface CsvParseResult {
  contacts: ParsedContact[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

/**
 * Parsea un archivo CSV y extrae los contactos
 * @param file - Archivo CSV a procesar
 * @returns Promise con los contactos parseados y errores
 */
export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const result = parseCsvText(csvText);
        resolve(result);
      } catch (error) {
        reject(new Error(`Error al procesar el archivo: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo CSV'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Parsea texto CSV y extrae contactos
 * @param csvText - Contenido del archivo CSV como texto
 * @returns Resultado del parseo con contactos y errores
 */
function parseCsvText(csvText: string): CsvParseResult {
  const lines = csvText.trim().split('\n');
  const contacts: ParsedContact[] = [];
  const errors: string[] = [];
  
  if (lines.length === 0) {
    return {
      contacts: [],
      errors: ['El archivo CSV está vacío'],
      totalRows: 0,
      validRows: 0
    };
  }
  
  // Procesar header
  const headerLine = lines[0].trim();
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  // Validar headers requeridos
  const requiredHeaders = ['nombre', 'telefono'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  if (missingHeaders.length > 0) {
    errors.push(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
  }
  
  // Obtener índices de columnas
  const nombreIndex = headers.indexOf('nombre');
  const telefonoIndex = headers.indexOf('telefono');
  const emailIndex = headers.indexOf('email');
  
  // Procesar filas de datos
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Saltar líneas vacías
    
    try {
      const values = parseCSVLine(line);
      const rowNumber = i + 1;
      
      // Validar que tenga suficientes columnas
      if (values.length < Math.max(nombreIndex + 1, telefonoIndex + 1)) {
        errors.push(`Fila ${rowNumber}: Faltan columnas requeridas`);
        continue;
      }
      
      const nombre = values[nombreIndex]?.trim();
      const telefono = values[telefonoIndex]?.trim();
      const email = emailIndex >= 0 ? values[emailIndex]?.trim() : undefined;
      
      // Validaciones
      if (!nombre) {
        errors.push(`Fila ${rowNumber}: El nombre es obligatorio`);
        continue;
      }
      
      if (!telefono) {
        errors.push(`Fila ${rowNumber}: El teléfono es obligatorio`);
        continue;
      }
      
      // Validar formato de teléfono (básico)
      if (!isValidPhoneNumber(telefono)) {
        errors.push(`Fila ${rowNumber}: Formato de teléfono inválido (${telefono}). Use formato internacional: +573126486075`);
        continue;
      }
      
      // Validar email si existe
      if (email && !isValidEmail(email)) {
        errors.push(`Fila ${rowNumber}: Formato de email inválido (${email})`);
        continue;
      }
      
      // Agregar contacto válido
      contacts.push({
        nombre,
        telefono,
        email: email || undefined
      });
      
    } catch (error) {
      errors.push(`Fila ${i + 1}: Error al procesar la línea - ${error}`);
    }
  }
  
  return {
    contacts,
    errors,
    totalRows: lines.length - 1, // Excluir header
    validRows: contacts.length
  };
}

/**
 * Parsea una línea CSV manejando comillas y comas
 * @param line - Línea de CSV a parsear
 * @returns Array de valores
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Comilla escapada
        current += '"';
        i += 2;
      } else {
        // Cambiar estado de comillas
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Separador de campo
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Agregar último campo
  result.push(current);
  
  return result;
}

/**
 * Valida formato básico de número de teléfono
 * @param phone - Número de teléfono a validar
 * @returns true si el formato es válido
 */
function isValidPhoneNumber(phone: string): boolean {
  // Remover espacios y caracteres especiales excepto + y números
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Validar formato básico: debe empezar con + seguido de números
  // O solo números (mínimo 10 dígitos)
  const phoneRegex = /^(\+\d{10,15}|\d{10,15})$/;
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Valida formato básico de email
 * @param email - Email a validar
 * @returns true si el formato es válido
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
