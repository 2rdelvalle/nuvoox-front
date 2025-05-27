import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/nuvoox/api';

/**
 * Maneja solicitudes GET para obtener estadísticas de una empresa en un rango de fechas
 * 
 * @param request - Solicitud HTTP
 * @param params - Parámetros de ruta, incluyendo el ID de la empresa
 * @returns Respuesta con los datos de estadísticas o error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de la empresa de los parámetros de ruta
    const companyId = parseInt(params.id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'ID de empresa inválido' },
        { status: 400 }
      );
    }
    
    // Obtener los parámetros de consulta para el rango de fechas
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Validar fechas
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Se requieren fechas de inicio y fin' },
        { status: 400 }
      );
    }
    
    // En un escenario real, aquí llamaríamos a la API del backend
    // Para fines de demostración, generamos datos simulados
    // En producción, descomentar el código siguiente y configurar la API real:
    
    /*
    const url = `${API_BASE_URL}/companies/${companyId}/stats?startDate=${startDate}&endDate=${endDate}`;
    const response = await axios.get(url);
    const data = response.data;
    */
    
    // Datos simulados para demostración
    const mockData = {
      messagesSent: Math.floor(Math.random() * 1000) + 500,
      messagesReceived: Math.floor(Math.random() * 800) + 300,
      templates: {
        total: Math.floor(Math.random() * 100) + 50,
        marketing: Math.floor(Math.random() * 40) + 20,
        utility: Math.floor(Math.random() * 30) + 15,
        authentication: Math.floor(Math.random() * 20) + 10
      },
      dailySentMessages: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 20),
      dailyReceivedMessages: Array.from({ length: 7 }, () => Math.floor(Math.random() * 80) + 10),
      daysLabels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    };
    
    // Devolver los datos como JSON
    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error al obtener estadísticas de la empresa:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de la empresa' },
      { status: 500 }
    );
  }
}
