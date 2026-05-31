# Plan de Implementación - Fase 8: Dashboard en Tiempo Real + Kardex (Trazabilidad)

Este plan detalla la conexión de las métricas del panel de inicio con datos reales agregados de PostgreSQL y la implementación del Kardex (historial de movimientos de stock) para auditar las entradas por producción y salidas por ventas.

## User Review Required

> [!IMPORTANT]
> *   **Integración del Kardex (Trazabilidad)**: Habilitaremos la pestaña `"Trazabilidad Stock"` para visualizar la auditoría de inventarios. Cada vez que ocurra una venta (Salida) o se complete una orden de producción (Entrada), el Kardex reflejará la transacción automáticamente, asociando el OEM, cantidad, fecha y usuario/responsable del movimiento.
> *   **Cálculo de KPI en Servidor**: El servidor calculará dinámicamente:
>     1. Suma de ingresos por ventas registradas hoy.
>     2. Stock total acumulado en planta (repuestos físicos).
>     3. Cantidad de repuestos actualmente en torno/fundición (órdenes pendientes/en proceso).
>     4. Repuestos críticos bajo el umbral de alerta (stock <= 5 unidades).

## Proposed Changes

### Backend API (`/backend`)

#### [NEW] [dashboard.ts](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/backend/src/rutas/dashboard.ts)
*   `GET /kpis`: Agrega y retorna:
    - `ventasHoy` (Bs. total acumulado hoy)
    - `stockTotal` (Suma física de todos los productos)
    - `ordenesActivas` (Conteo de órdenes de producción pendientes o en proceso)
    - `alertasStock` (Conteo de repuestos con stock <= 5)
    - `actividadReciente` (Lista de las últimas 5 ventas y órdenes para mostrar en el feed de novedades).

#### [NEW] [inventario.ts](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/backend/src/rutas/inventario.ts)
*   `GET /movimientos`: Retorna el historial de movimientos de stock (`movimientos_inventario`), ordenado por fecha descendente, incluyendo repuestos y usuarios implicados.

#### [MODIFY] [server.ts](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/backend/src/server.ts)
*   Registrar `/api/dashboard` y `/api/inventario`.

---

### Frontend React (`/src`)

#### [NEW] [types.ts](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/src/features/inventory/types.ts)
*   Definición de interfaz `InventoryMovement` para la grilla de auditoría.

#### [NEW] [api.ts](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/src/features/inventory/api.ts)
*   Llamada HTTP `getInventoryMovements` para el Kardex.

#### [NEW] [InventoryFeature.tsx](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/src/features/inventory/InventoryFeature.tsx)
*   Componente de trazabilidad. Muestra una grilla tabular (Kardex) con filtros de búsqueda rápida por OEM o tipo de movimiento.

#### [MODIFY] [DashboardOverview.tsx](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/src/features/dashboard/components/DashboardOverview.tsx)
*   Conectar a `GET /api/dashboard/kpis` al montar el componente para desplegar números reales en lugar del mock inicial.

#### [MODIFY] [App.tsx](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/src/App.tsx)
*   Integrar la pestaña `"inventory"` para redireccionar al nuevo módulo de trazabilidad.

---

## Plan de Verificación

### Pruebas de Flujo Completo (Happy Path)
1.  **Validar Novedades Recientes**:
    *   Registrar una nueva venta y marcar una orden de producción como "En Proceso".
    *   Entrar al Dashboard y verificar que ambas actividades aparecen ordenadas en la lista de "Actividad Reciente del Sistema".
2.  **Validar Auditoría (Kardex)**:
    *   Ir a la pestaña "Trazabilidad Stock" y confirmar que aparecen tanto el egreso (Salida) de la venta como el ingreso (Entrada) de la producción, detallando el OEM y la cantidad exacta descontada/sumada.
