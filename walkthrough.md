# Resumen de Arquitectura e Integración (Fases 5, 6, 7 y 8)

Este archivo sirve como guía de contexto para desarrolladores u otras inteligencias artificiales para entender la arquitectura actual, los módulos completados y el flujo de base de datos del proyecto.

---

## 🏗️ 1. Arquitectura del Sistema
El sistema se encuentra completamente containerizado con **Docker Compose** y consta de los siguientes servicios:
1.  **Frontend (React + Vite + TypeScript)**:
    *   **Puerto**: [http://localhost:5173](http://localhost:5173)
    *   **Estética**: *Industrial Dark Tech* (Fondos oscuros antracita, tarjetas gris acero con acentos naranja neón).
2.  **Backend (Express + Node.js + TypeScript)**:
    *   **Puerto**: [http://localhost:3000](http://localhost:3000) (API en `/api`)
    *   **Herramienta de Ejecución**: `tsx` (TypeScript Execute en modo watch) para soporte ESM.
    *   **ORM**: Prisma Client.
3.  **Base de Datos (PostgreSQL 17)**:
    *   **Puerto**: `5432`
    *   **Nombre de DB**: `repuestos_db`
    *   **Script de Inicialización**: Localizado en `db-init/init.sql` (13 tablas en español creadas con triggers y datos semilla).
4.  **Adminer (Gestor de base de datos web)**:
    *   **Puerto**: [http://localhost:8080](http://localhost:8080)

### 🔑 Credenciales para entrar a Adminer / Base de datos:
*   **Motor (System)**: `PostgreSQL`
*   **Servidor (Server)**: `db`
*   **Usuario (Username)**: `admin`
*   **Contraseña (Password)**: `admin_pass`
*   **Base de datos (Database)**: `repuestos_db`

---

## ⚙️ 2. Módulos Completados e Integración de Datos

### A. Autenticación, Usuarios y Empleados
*   **API**: `/api/autenticacion/login` comprueba credenciales en texto plano (según el requerimiento inicial) y retorna el rol del usuario (`Admin`, `Vendedor`, `Operario`) y el nombre del empleado asociado.
*   **CRUD de Usuarios**: `/api/usuarios` lista y crea cuentas en el sistema.
*   **CRUD de Empleados**: `/api/empleados` administra la ficha de personal del taller.

### B. Catálogo de Repuestos y Categorías
*   **API**: `/api/productos` y `/api/productos/categorias`.
*   El frontend carga el stock disponible y las categorías mecánicas de los repuestos al iniciar sesión.

### C. Módulo de Órdenes de Producción (Fase 6)
*   **API**: `/api/produccion` y `/api/produccion/:id/estado`.
*   **Regla Crítica de Negocio**: Al marcar una orden de producción como **`Finalizado`**, el backend ejecuta una **transacción Prisma** que:
    1. Registra la fecha de finalización y bloquea el estado de la orden.
    2. Incrementa el stock físico del repuesto en catálogo (`productos.stock`).
    3. Registra un movimiento en `movimientos_inventario` de tipo `Entrada`.

### D. Módulo de Ventas e Historial (Fase 7)
*   **API**: `/api/clientes` y `/api/ventas`.
*   **Regla Crítica de Negocio**: Al presionar "Procesar Venta", el backend ejecuta una **transacción Prisma** de forma atómica:
    1. Valida que haya suficiente stock disponible de cada repuesto. Si no, aborta la operación completa y retorna un mensaje detallando el producto faltante.
    2. Crea el registro de venta general (`ventas`) asociando al vendedor actual y el cliente.
    3. Registra cada ítem en `detalles_ventas`.
    4. **Decrementa el stock** físico de cada repuesto comprado.
    5. Registra un movimiento de auditoría en `movimientos_inventario` de tipo `Salida` con el motivo `"Venta Factura #[ID]"`.

---

## 📊 3. Fase 8: Dashboard en Tiempo Real + Kardex (Trazabilidad)

Implementamos el panel de control dinámico y el historial de auditoría de almacén:

1.  **Dashboard en Tiempo Real**:
    *   **API**: `/api/dashboard/kpis` calcula de manera agregada:
        *   El total del ingreso de caja acumulado hoy (Bs.).
        *   La cantidad de stock físico total en el almacén.
        *   El recuento de órdenes activas (en proceso/pendientes) en torno o fundición.
        *   La cantidad de repuestos en estado de alerta crítica (stock <= 5 unidades).
        *   El feed de las últimas 5 actividades registradas en el sistema (ventas y órdenes de producción).
    *   **Interfaz UI**: El componente [DashboardOverview.tsx](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/src/features/dashboard/components/DashboardOverview.tsx) consume estas métricas reales al iniciar la aplicación, reemplazando los mocks anteriores y mostrando el estado en tiempo real.

2.  **Kardex e Historial de Stock**:
    *   **API**: `/api/inventario/movimientos` lee la tabla `movimientos_inventario` ordenada de forma cronológica descendente.
    *   **Interfaz UI**: Creamos la pestaña de "Trazabilidad Stock" con [InventoryFeature.tsx](file:///c:/Users/Alexwuuu1/Documents/Proyecto%20programacion/src/features/inventory/InventoryFeature.tsx) (con un diseño compacto de 120 líneas para optimizar tokens de contexto) que lista todos los movimientos (Entrada / Salida) con búsqueda interactiva por OEM, repuesto o motivo, y filtrado dinámico por tipo.

---

## 🔬 4. Verificación de Compilación

Ambos proyectos están verificados contra errores de TypeScript mediante compilación estática dentro del contenedor Docker:
*   **Frontend compilation command**: `docker compose exec web npm run build` (Exitoso, 0 errores, compilado con Vite/TypeScript)
*   **Backend compilation command**: `docker compose exec backend npm run build` (Exitoso, 0 errores, compilado con tsc)
