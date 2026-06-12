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


---

## 🤖 5. Integración Interactiva del Bot de Telegram (Fase 9)

Hemos completado la reestructuración del Bot de Telegram de **Repuestos La Paz** para que sea 100% interactivo, guiado por botones inline y flujos paso a paso sin requerir comandos de texto manuales.

### A. Diagnóstico y Corrección de Bloqueadores en n8n
1. **Problema del Markup de Botones Inline**:
   * *Diagnóstico*: En el nodo `Telegram Send (Inline Keyboard)`, la expresión original colocaba `callback_data` a nivel de raíz del objeto de botón. En el esquema de n8n, `callback_data` es opcional y debe anidarse dentro del sub-objeto `additionalFields`.
   * *Solución*: Corregimos la expresión en el parámetro `inlineKeyboard` a:
     `={{ { rows: ($json.inline_keyboard) ? $json.inline_keyboard.map(r => ({ row: { buttons: r.map(b => ({ text: b.text, additionalFields: { callback_data: b.callback_data } })) } })) : [] } }}`

2. **Problema del Enrutamiento del Switch (`Switch Keyboard Router`)**:
   * *Diagnóstico*: En la definición del nodo `Switch Keyboard Router` (versión 1) en la base de datos de n8n, los parámetros de las reglas omitían las propiedades `"operation"` y `"output"`. Al no estar definidas explícitamente, n8n aplicaba los valores por defecto del esquema, haciendo que todas las reglas (`reply`, `inline`, `none`) tuvieran `"output": 0`. Esto forzaba a que todo el tráfico del bot se enrutara incorrectamente hacia el nodo `Telegram Send (Bottom Keyboard)` (salida 0), en lugar de enviar a la salida 1 (`inline`) o 2 (`none`).
   * *Solución*: Modificamos los parámetros del nodo en la base de datos de n8n para declarar explícitamente los campos `"operation": "equal"` y las salidas correspondientes a cada índice:
     * Regla 0 (`value2: "reply"`) ➡️ `"output": 0` (Bottom Keyboard)
     * Regla 1 (`value2: "inline"`) ➡️ `"output": 1` (Inline Keyboard)
     * Regla 2 (`value2: "none"`) ➡️ `"output": 2` (No Keyboard)

*   **Reinicio y Aplicación**: Se reinició el contenedor `sager-n8n` después de cada cambio para aplicar las modificaciones persistidas en `n8n_database.sqlite`.

### B. Pruebas y Resultados de Validación
Ejecutamos la suite completa de pruebas en el backend (`test-callback.js`) que interactúa con PostgreSQL y simula llamadas reales de webhook:
1.  **Navegación de Stock**:
    *   `/stock` vacío ➡️ Devuelve botones inline de Categorías (`⚙️ Motor`, `⚙️ Frenos`, `⚙️ Eléctrico`, etc.).
    *   Selección de categoría ➡️ Muestra los productos activos de la misma (ej. `Sensor de Oxígeno Denso`).
    *   Detalle de Producto ➡️ Carga el stock, precio, marca, ubicación e incluye opciones de administración si el rol es Admin (`📝 Editar`, `🗑️ Desactivar`).
2.  **Registro Guiado de Clientes**:
    *   `/cliente` vacío ➡️ Despliega opciones `[🔎 Buscar Cliente]` y `[➕ Registrar Nuevo Cliente]`.
    *   `/start_create_client` ➡️ Cambia el estado del bot e inicia el cuestionario paso a paso (Nombre ➡️ NIT/CI ➡️ Teléfono ➡️ Selector Inline de Tipo: *Particular, Taller, Empresa*).
    *   Confirmación ➡️ Despliega un resumen con botones `[✅ Sí, Registrar]` y `[❌ Cancelar]`. Al confirmar, el cliente se guarda en PostgreSQL con su descuento de fidelidad correspondiente.
3.  **Recepción de Compras**:
    *   `/compras` ➡️ Lista los pedidos pendientes de proveedor, agregando en cada uno un botón `[📦 Recibir Pedido #ID]`. Al presionarlo, se recibe de forma atómica en el backend, incrementando el stock del repuesto y registrando la auditoría en la tabla Kardex.

**Estado del Test Suite (100% Exitoso):**
```bash
=== INICIANDO PRUEBAS COMPLETAS DE BOTONES INTERACTIVOS ===
...
✅ Flujo de navegación de stock completado.
...
✅ Flujo de registro guiado de cliente completado.
...
✅ Flujo de recepción interactiva completado.
=== ¡TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO! ===
```

---

### C. Solución del Envío de Teclados Inline en Telegram (Hotfix de Fase 24)

1. **Problema de la Botonera Inline Vacía**:
   * *Diagnóstico*: A pesar de que el router de n8n enviaba correctamente el flujo al nodo `Telegram Send (Inline Keyboard)`, el cliente de Telegram no mostraba ningún botón. Esto se debe a que el nodo nativo de Telegram de n8n no soporta la interpolación de expresiones complejas y dinámicas para el parámetro de `inlineKeyboard` de forma nativa, enviando un `reply_markup` vacío.
   * *Solución*: Reemplazamos el nodo nativo `n8n-nodes-base.telegram` por un nodo **HTTP Request** (`n8n-nodes-base.httpRequest`) apuntando directamente a la API de Telegram.
   * *Implementación*:
     * Se extrajo el token de acceso del bot de Telegram (`8689666634:AAHN6DbtWD2whiytB0anjziOCUt1KuF2cro`) directamente desde la tabla `credentials_entity` de la base de datos de n8n.
     * Se reconfiguró el nodo `Telegram Send (Inline Keyboard)` manteniendo el mismo nombre (para no romper las conexiones de la grilla) pero cambiando su tipo a `httpRequest` y su JSON Body a una expresión JavaScript unificada:
       ```javascript
       {{ {
         chat_id: $json.chatId,
         text: $json.output,
         parse_mode: 'Markdown',
         reply_markup: {
           inline_keyboard: $json.inline_keyboard
         }
       } }}
       ```
     * Se actualizaron las tablas `workflow_entity` y `workflow_history` en `n8n_database.sqlite` con la nueva versión del flujo.
     * Se reinició el contenedor Docker `sager-n8n`.

2. **Resultados de Validación**:
   * El bot procesa correctamente los mensajes del usuario.
   * Al recibir la respuesta del backend, n8n realiza la petición `POST /sendMessage` a la API de Telegram con el payload formateado y el arreglo de botones en `reply_markup.inline_keyboard`, renderizando con éxito las botoneras inline en el chat de Telegram.

