import { JWTAuth } from "@/shared/models"

// set token to session Storage
export const setToken = (token: string) => {
  sessionStorage.setItem("token", token)
}

export const clearToken = () => {
  sessionStorage.removeItem("token")
}

// get token from session Storage
export const getToken = () => {
  return sessionStorage.getItem("token")
}

export const createCookieToken = (token: string) => {
  // Verificar si estamos en el navegador
  if (typeof window === 'undefined') {
    return; // Estamos en el servidor, no podemos crear cookies
  }
  
  try {
    document.cookie = `token=${token}; path=/; max-age=86400`; // 1 día de duración
  } catch (error) {
    console.error('Error al crear cookie:', error);
  }
}

// Bandera para controlar los mensajes de consola
// Evita llenar la consola con mensajes innecesarios
let hasLoggedTokenError = false;

// get data from token con mejor manejo de errores
export const getDataFromToken = (token?: string) : JWTAuth | null => {
  // Si estamos en servidor, devolvemos null silenciosamente
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    // Verificar que el token exista y tenga un formato válido
    if (!token || typeof token !== 'string') {
      // Solo mostrar el error una vez por sesión
      if (!hasLoggedTokenError) {
        console.log('No hay token disponible, se requiere iniciar sesión');
        hasLoggedTokenError = true;
      }
      return null;
    }
    
    // Verificar formato JWT (xxx.yyy.zzz)
    if (token.split(".").length < 2) {
      // Solo mostrar el error una vez por sesión
      if (!hasLoggedTokenError) {
        console.warn('Token con formato incorrecto');
        hasLoggedTokenError = true;
      }
      return null;
    }
    
    const base64Url = token.split(".")[1];
    // Verificar que base64Url exista
    if (!base64Url) {
      if (!hasLoggedTokenError) {
        console.warn('No se pudo extraer la parte de datos del token');
        hasLoggedTokenError = true;
      }
      return null;
    }
    
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Usar try-catch específico para la decodificación
    try {
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join("")
      );
      
      const parsed = JSON.parse(jsonPayload);
      hasLoggedTokenError = false; // Resetear la bandera si tenemos éxito
      return parsed;
    } catch (decodeError) {
      if (!hasLoggedTokenError) {
        console.error('Error al decodificar el contenido del token:', decodeError);
        hasLoggedTokenError = true;
      }
      return null;
    }
  } catch (error) {
    // Capturar cualquier error durante el proceso completo
    if (!hasLoggedTokenError) {
      console.error('Error general al procesar el token:', error);
      hasLoggedTokenError = true;
    }
    return null;
  }
}

// get token from cookie
export const getCookieToken = () => {
  // Verificar si estamos en el navegador
  if (typeof window === 'undefined') {
    return null; // Estamos en el servidor, no hay cookies disponibles
  }
  
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token"))
      ?.split("=")[1];
    return token;
  } catch (error) {
    console.error('Error al obtener cookie:', error);
    return null;
  }
}

// delete cookie token
export const deleteCookieToken = () => {
  // Verificar si estamos en el navegador
  if (typeof window === 'undefined') {
    return; // Estamos en el servidor, no podemos modificar cookies
  }
  
  try {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
  } catch (error) {
    console.error('Error al eliminar cookie:', error);
  }
}
