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
// Este array es compartido con otros endpoints como company/[id]/route.ts
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

// Contador para generar IDs únicos
let nextId = 3;

/**
 * Crea una nueva tarifa para una empresa
 * @param request - Solicitud HTTP con los datos de la tarifa a crear
 * @returns La tarifa creada
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.companyId || data.additionalCost === undefined) {
      return NextResponse.json(
        { error: 'Se requiere companyId y additionalCost' },
        { status: 400 }
      );
    }
    
    // Crear nueva tarifa
    const newTariff: CompanyTariff = {
      id: nextId++,
      companyId: data.companyId,
      additionalCost: data.additionalCost,
      templateType: data.templateType || 'all',
      country: data.country || 'all',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Agregar a la lista (en un entorno real, esto sería una inserción en la base de datos)
    mockTariffs.push(newTariff);
    
    // Devolver la tarifa creada
    return NextResponse.json(newTariff, { status: 201 });
  } catch (error) {
    console.error('Error al crear tarifa:', error);
    
    return NextResponse.json(
      { error: 'Error al crear tarifa' },
      { status: 500 }
    );
  }
}

/**
 * Obtiene todas las tarifas configuradas
 * @returns Lista de todas las tarifas
 */
export async function GET() {
  try {
    // Devolver todas las tarifas (en un entorno real, esto sería una consulta a la base de datos)
    return NextResponse.json(mockTariffs);
  } catch (error) {
    console.error('Error al obtener tarifas:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener tarifas' },
      { status: 500 }
    );
  }
}
