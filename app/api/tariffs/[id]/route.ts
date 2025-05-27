import { NextRequest, NextResponse } from 'next/server';

// Tarifa personalizada para una empresa
interface CompanyTariff {
  id: number;
  companyId: number;
  additionalCost: number;
  templateType?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Referencia al mismo almacenamiento en memoria usado en otros endpoints
// En un entorno real, esto sería una base de datos
// Este array es compartido con route.ts principal
let mockTariffs: CompanyTariff[] = [
  {
    id: 1,
    companyId: 1,
    additionalCost: 0.01,
    templateType: 'all',
    country: 'all',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    companyId: 1,
    additionalCost: 0.015,
    templateType: 'marketing',
    country: 'CO',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Obtiene una tarifa específica por su ID
 * @param request - Solicitud HTTP
 * @param params - Parámetros de ruta, incluyendo el ID de la tarifa
 * @returns La tarifa encontrada
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de la tarifa de los parámetros de ruta
    const tariffId = parseInt(params.id);
    
    if (isNaN(tariffId)) {
      return NextResponse.json(
        { error: 'ID de tarifa inválido' },
        { status: 400 }
      );
    }
    
    // Buscar tarifa por ID (en un entorno real, esto sería una consulta a la base de datos)
    const tariff = mockTariffs.find(t => t.id === tariffId);
    
    if (!tariff) {
      return NextResponse.json(
        { error: 'Tarifa no encontrada' },
        { status: 404 }
      );
    }
    
    // Devolver la tarifa encontrada
    return NextResponse.json(tariff);
  } catch (error) {
    console.error('Error al obtener tarifa:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener tarifa' },
      { status: 500 }
    );
  }
}

/**
 * Actualiza una tarifa existente
 * @param request - Solicitud HTTP con los datos de la tarifa actualizada
 * @param params - Parámetros de ruta, incluyendo el ID de la tarifa
 * @returns La tarifa actualizada
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de la tarifa de los parámetros de ruta
    const tariffId = parseInt(params.id);
    
    if (isNaN(tariffId)) {
      return NextResponse.json(
        { error: 'ID de tarifa inválido' },
        { status: 400 }
      );
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Buscar el índice de la tarifa (en un entorno real, esto sería una consulta a la base de datos)
    const tariffIndex = mockTariffs.findIndex(t => t.id === tariffId);
    
    if (tariffIndex === -1) {
      return NextResponse.json(
        { error: 'Tarifa no encontrada' },
        { status: 404 }
      );
    }
    
    // Actualizar tarifa
    const updatedTariff: CompanyTariff = {
      ...mockTariffs[tariffIndex], // Mantener los datos existentes
      additionalCost: data.additionalCost !== undefined ? data.additionalCost : mockTariffs[tariffIndex].additionalCost,
      templateType: data.templateType || mockTariffs[tariffIndex].templateType,
      country: data.country || mockTariffs[tariffIndex].country,
      updatedAt: new Date()
    };
    
    // Guardar la tarifa actualizada (en un entorno real, esto sería una actualización en la base de datos)
    mockTariffs[tariffIndex] = updatedTariff;
    
    // Devolver la tarifa actualizada
    return NextResponse.json(updatedTariff);
  } catch (error) {
    console.error('Error al actualizar tarifa:', error);
    
    return NextResponse.json(
      { error: 'Error al actualizar tarifa' },
      { status: 500 }
    );
  }
}

/**
 * Elimina una tarifa existente
 * @param request - Solicitud HTTP
 * @param params - Parámetros de ruta, incluyendo el ID de la tarifa
 * @returns Mensaje de éxito
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de la tarifa de los parámetros de ruta
    const tariffId = parseInt(params.id);
    
    if (isNaN(tariffId)) {
      return NextResponse.json(
        { error: 'ID de tarifa inválido' },
        { status: 400 }
      );
    }
    
    // Buscar el índice de la tarifa (en un entorno real, esto sería una consulta a la base de datos)
    const tariffIndex = mockTariffs.findIndex(t => t.id === tariffId);
    
    if (tariffIndex === -1) {
      return NextResponse.json(
        { error: 'Tarifa no encontrada' },
        { status: 404 }
      );
    }
    
    // Eliminar la tarifa (en un entorno real, esto sería una eliminación en la base de datos)
    mockTariffs.splice(tariffIndex, 1);
    
    // Devolver mensaje de éxito
    return NextResponse.json({ message: 'Tarifa eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarifa:', error);
    
    return NextResponse.json(
      { error: 'Error al eliminar tarifa' },
      { status: 500 }
    );
  }
}
