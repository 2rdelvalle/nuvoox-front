'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { flowService, Flow } from '@/shared/services';
import { useRef } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';

const FlowListPage: React.FC = () => {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {}
  });

  // Cargar flujos desde el backend
  const loadFlows = async () => {
    try {
      setLoading(true);
      const response = await flowService.getFlows(lazyState.page, lazyState.rows);
      setFlows(response.data);
      setTotalRecords(response.total);
    } catch (error) {
      console.error('Error cargando flujos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los flujos'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlows();
  }, [lazyState]);

  const statusBodyTemplate = (rowData: Flow) => {
    const severity = rowData.isActive ? 'success' : 'warning';
    const status = rowData.isActive ? 'Activo' : 'Inactivo';
    return (
      <span className={`p-tag p-tag-${severity}`}>
        {status}
      </span>
    );
  };

  const handleViewFlow = (flow: Flow) => {
    router.push(`/flows/${flow.id}`);
  };

  const handleEditFlow = (flow: Flow) => {
    router.push(`/flows/${flow.id}/edit`);
  };

  const handleDeleteFlow = (flow: Flow) => {
    confirmDialog({
      message: `¿Estás seguro de que deseas eliminar el flujo "${flow.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await flowService.deleteFlow(flow.id);
          toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Flujo eliminado correctamente'
          });
          await loadFlows();
        } catch (error) {
          console.error('Error eliminando flujo:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar el flujo'
          });
        }
      }
    });
  };

  const handleToggleFlow = async (flow: Flow) => {
    try {
      await flowService.toggleFlow(flow.id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `Flujo ${flow.isActive ? 'desactivado' : 'activado'} correctamente`
      });
      await loadFlows();
    } catch (error) {
      console.error('Error cambiando estado del flujo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cambiar el estado del flujo'
      });
    }
  };

  const onPage = (event: any) => {
    setLazyState({
      ...lazyState,
      first: event.first,
      rows: event.rows,
      page: Math.floor(event.first / event.rows) + 1
    });
  };

  const actionBodyTemplate = (rowData: Flow) => {
    const isFlowDesignerEnabled = process.env.NEXT_PUBLIC_ENABLE_FLOW_DESIGNER === 'true';
    
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-text p-button-sm"
          tooltip="Ver"
          onClick={() => handleViewFlow(rowData)}
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          tooltip="Editar"
          onClick={() => handleEditFlow(rowData)}
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
          icon={rowData.isActive ? "pi pi-pause" : "pi pi-play"}
          className={`p-button-text p-button-sm ${rowData.isActive ? 'p-button-warning' : 'p-button-success'}`}
          tooltip={rowData.isActive ? "Desactivar" : "Activar"}
          onClick={() => handleToggleFlow(rowData)}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-sm p-button-danger"
          tooltip="Eliminar"
          onClick={() => handleDeleteFlow(rowData)}
        />
      </div>
    );
  };

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
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
              lazy
              loading={loading}
              paginator
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={totalRecords}
              onPage={onPage}
              rowsPerPageOptions={[5, 10, 25]}
              className="p-datatable-gridlines"
              emptyMessage="No se encontraron flujos"
            >
              <Column field="name" header="Nombre" sortable />
              <Column field="description" header="Descripción" />
              <Column field="isActive" header="Estado" body={statusBodyTemplate} />
              <Column field="createdAt" header="Fecha de Creación" sortable />
              <Column header="Acciones" body={actionBodyTemplate} />
            </DataTable>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FlowListPage;
