'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useRouter } from 'next/navigation';

const FlowListPage: React.FC = () => {
  const router = useRouter();

  // Mock data - TODO: Replace with real API call
  const flows = [
    {
      id: 1,
      name: 'Flujo de Bienvenida',
      description: 'Flujo automático para nuevos usuarios',
      status: 'Activo',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'Seguimiento de Ventas',
      description: 'Flujo para seguimiento de leads',
      status: 'Inactivo',
      createdAt: '2024-01-10'
    }
  ];

  const statusBodyTemplate = (rowData: any) => {
    const severity = rowData.status === 'Activo' ? 'success' : 'warning';
    return (
      <span className={`p-tag p-tag-${severity}`}>
        {rowData.status}
      </span>
    );
  };

  const actionBodyTemplate = (rowData: any) => {
    const isFlowDesignerEnabled = process.env.NEXT_PUBLIC_ENABLE_FLOW_DESIGNER === 'true';
    
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-text p-button-sm"
          tooltip="Ver"
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          tooltip="Editar"
        />
        {isFlowDesignerEnabled && (
          <Button
            icon="pi pi-sitemap"
            className="p-button-text p-button-sm p-button-info"
            tooltip="Diseñador Visual"
            onClick={() => router.push(`/flows/${rowData.id}/designer`)}
          />
        )}
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-sm p-button-danger"
          tooltip="Eliminar"
        />
      </div>
    );
  };

  return (
    <div className="grid">
      <div className="col-12">
        <Card>
          <div className="flex justify-content-between align-items-center mb-4">
            <h2 className="m-0">Gestión de Flujos</h2>
            <Button
              label="Crear Flujo"
              icon="pi pi-plus"
              onClick={() => router.push('/flows/create')}
            />
          </div>

          <DataTable
            value={flows}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="p-datatable-gridlines"
            emptyMessage="No se encontraron flujos"
          >
            <Column field="name" header="Nombre" sortable />
            <Column field="description" header="Descripción" />
            <Column field="status" header="Estado" body={statusBodyTemplate} />
            <Column field="createdAt" header="Fecha de Creación" sortable />
            <Column header="Acciones" body={actionBodyTemplate} />
          </DataTable>
        </Card>
      </div>
    </div>
  );
};

export default FlowListPage;
