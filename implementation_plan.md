# Plan de Implementación - Fase 16: Reportes y Exportación Integrada (Excel + PDF) en Todos los Módulos

Este plan detalla la creación de un sistema de reportes integrado en cada pantalla. Se implementará una utilidad genérica para descargar datos filtrados en formato Excel (CSV con UTF-8 BOM compatible) y otra para inyectar hojas de estilo A4 para imprimir reportes consolidados en PDF de forma nativa desde cualquier módulo.

## User Review Required

> [!IMPORTANT]
> *   **Integración en Tablas de Módulos**: Agregaremos un grupo de botones estilizados (`"Exportar Excel"`, `"Imprimir Reporte A4"`) en las siguientes secciones, respetando los filtros de búsqueda y estados activos:
>     1. **Catálogo de Repuestos**: Inventario actual filtrado, valor total y alertas de stock.
>     2. **CRM Clientes**: Directorio de clientes con sus deudas vigentes y total de compras acumuladas.
>     3. **Historial de Ventas**: Ventas filtradas por rango de fechas, cliente o método de pago.
>     4. **Trazabilidad de Stock (Kardex)**: Historial completo de movimientos de inventario.
>     5. **Compras**: Pedidos vigentes e históricos hechos a proveedores.
>     6. **Producción**: Estado de órdenes de fundición/torno activas e históricas.
> *   **Mecanismo de Exportación a Excel (Cero Librerías)**:
>     - Crearemos una utilidad cliente `exportarAExcel(nombreArchivo, columnas, datos)` que genera un archivo CSV con codificación UTF-8 y marca BOM (`\uFEFF`), asegurando compatibilidad nativa e inmediata con Microsoft Excel y Google Sheets (manteniendo tildes, caracteres especiales como "Ñ" y formato numérico).
> *   **Motor de Impresión PDF de Reportes**:
>     - Desarrollaremos una utilidad `imprimirReporteA4(titulo, columnas, datos, filtrosAplicados)` que generará una página A4 con un membrete formal corporativo, metadatos del reporte, tabla estructurada de datos y pie de página con firmas y fecha/hora de emisión.

## Proposed Changes

### Utilidades de Reportes (`/src/utils`)

#### [NEW] [exportUtils.ts](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/utils/exportUtils.ts)
*   Implementar `exportarAExcel(filename, headers, keys, data)` para construir el archivo CSV delimitado por comas con BOM para compatibilidad con Excel.

#### [MODIFY] [printUtils.ts](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/features/finances/utils/printUtils.ts)
*   Añadir la función exportada `imprimirReporteA4(titulo, headers, keys, data, filtersDesc)` que inyecta un iframe temporal de impresión estilizado con membrete industrial de Antigravity Motors.

---

### Integración de Botones en Módulos (`/src/features`)

#### [MODIFY] [ProductsFeature.tsx](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/features/products/ProductsFeature.tsx) & [ProductList.tsx](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/features/products/components/ProductList.tsx)
*   Agregar botones en la barra de herramientas del Catálogo para exportar el inventario activo.

#### [MODIFY] [ClientsFeature.tsx](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/features/clients/ClientsFeature.tsx)
*   Agregar botones de reportes sobre el listado del CRM y el listado de Cuentas por Cobrar.

#### [MODIFY] [SaleHistory.tsx](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/features/sales/components/SaleHistory.tsx)
*   Agregar botones para exportar/imprimir el listado de facturas procesadas.

#### [MODIFY] [InventoryFeature.tsx](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/features/inventory/InventoryFeature.tsx)
*   Agregar botones en la grilla del Kardex de Trazabilidad de Stock.

#### [MODIFY] [PurchasesFeature.tsx](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/features/purchases/PurchasesFeature.tsx)
*   Agregar botones sobre el listado de pedidos a proveedor.

#### [MODIFY] [ProductionFeature.tsx](file:///c:/Users/Ale/Documents/Proyecto%20Programacion/src/features/production/ProductionFeature.tsx)
*   Agregar botones en el gestor de órdenes de producción.

---

## Plan de Verificación

### Pruebas de Exportación y Visualización
1.  **Exportación a Excel**:
    *   Ir al Catálogo de Repuestos, buscar `"Toyota"` y presionar `"Exportar Excel"`.
    *   Verificar que se descarga el archivo `.csv`, abrirlo en Excel/Sheets y confirmar que la codificación UTF-8 es correcta (Ñs y acentos legibles) y que solo contiene los datos filtrados.
2.  **Impresión de Reporte en PDF**:
    *   Ir al Kardex, filtrar por `"Salida"` y presionar `"Imprimir Reporte"`.
    *   Validar que se lanza el diálogo de impresión con el listado completo estructurado en A4, cabecera de reporte y fecha de impresión.
