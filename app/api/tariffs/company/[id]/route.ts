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

// Almacenamiento en memoria temporal para demostración (en producción usar base de datos)
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
 * Obtiene las tarifas configuradas para una empresa específica
 * @param request - Solicitud HTTP
 * @param params - Parámetros de ruta, incluyendo el ID de la empresa
 * @returns Lista de tarifas configuradas para la empresa
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
    
    // Filtrar tarifas por empresa (en un entorno real, esto sería una consulta a la base de datos)
    const companyTariffs = mockTariffs.filter(tariff => tariff.companyId === companyId);
    
    // Devolver las tarifas encontradas
    return NextResponse.json(companyTariffs);
  } catch (error) {
    console.error('Error al obtener tarifas de la empresa:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener tarifas de la empresa' },
      { status: 500 }
    );
  }
}
