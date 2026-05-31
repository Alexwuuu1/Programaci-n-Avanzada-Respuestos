-- Base de Datos para el Sistema de Repuestos La Paz V3

-- 1. Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- 2. Tabla de Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Usuarios (Cuentas del sistema)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    empleado_id INT UNIQUE REFERENCES empleados(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Categorías de Repuestos
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- 5. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Productos (Catálogo de Repuestos)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    oem VARCHAR(50) NOT NULL UNIQUE, -- Código de pieza
    nombre VARCHAR(150) NOT NULL,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio > 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    compatibilidad TEXT NOT NULL,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE RESTRICT,
    usuario_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0)
);

-- 9. Tabla de Detalle de Ventas
CREATE TABLE IF NOT EXISTS detalles_ventas (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario > 0)
);

-- 10. Tabla de Pedidos a Proveedor
CREATE TABLE IF NOT EXISTS pedidos_proveedor (
    id SERIAL PRIMARY KEY,
    proveedor_id INT NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Recibido', 'Cancelado')),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0)
);

-- 11. Tabla de Detalle de Pedidos a Proveedor
CREATE TABLE IF NOT EXISTS detalles_pedidos_proveedor (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos_proveedor(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_compra NUMERIC(10, 2) NOT NULL CHECK (precio_compra > 0)
);

-- 12. Tabla de Movimientos de Inventario (Trazabilidad)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('Entrada', 'Salida', 'Ajuste')),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(255) NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 13. Tabla de Órdenes de Producción (Seguimiento de Fabricación)
CREATE TABLE IF NOT EXISTS ordenes_produccion (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Finalizado', 'Cancelado')),
    responsable_id INT REFERENCES empleados(id) ON DELETE SET NULL
);

-- =======================================================
-- SEMILLAS DE DATOS (INSERTS INICIALES)
-- =======================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('Admin', 'Administración total del sistema'),
('Vendedor', 'Registro de ventas y consulta de repuestos'),
('Operario', 'Gestión de inventarios, pedidos a proveedores y producción')
ON CONFLICT (nombre) DO NOTHING;

-- Empleados
INSERT INTO empleados (nombre, telefono, cargo, estado) VALUES
('Juan Espinoza', '78945612', 'Gerente de Producción', 'Activo'),
('Alejandro Villalpando', '75612348', 'Encargado de Ventas', 'Activo'),
('Takeshi Carvajal', '60124859', 'Jefe de Almacén', 'Activo'),
('Israel Castañeta', '71245896', 'Operador de Torno', 'Activo'),
('Luz Daniela Mamani', '62489512', 'Control de Calidad', 'Activo')
ON CONFLICT DO NOTHING;

-- Usuarios (Contraseña de prueba en texto plano para testing)
INSERT INTO usuarios (usuario, contrasena, rol_id, empleado_id) VALUES
('admin', 'admin123', 1, 1),
('vendedor', 'vendedor123', 2, 2),
('operario', 'operario123', 3, 3)
ON CONFLICT (usuario) DO NOTHING;

-- Categorías
INSERT INTO categorias (nombre) VALUES
('Motor'),
('Frenos'),
('Transmisión'),
('Suspensión'),
('Eléctrico')
ON CONFLICT (nombre) DO NOTHING;

-- Proveedores
INSERT INTO proveedores (nombre, telefono, direccion) VALUES
('Fundiciones El Alto', '2840591', 'Av. Juan Pablo II, El Alto'),
('Frenos Bolivia', '2214589', 'Zona Gran Poder, La Paz'),
('Importadora Toyo', '2245896', 'Av. Tejada Sorzano, La Paz'),
('Amortiguadores Pacajes', '2856941', 'Zona Pacajes, El Alto')
ON CONFLICT (nombre) DO NOTHING;

-- Productos (Catálogo)
INSERT INTO productos (oem, nombre, categoria_id, precio, stock, compatibilidad, proveedor_id) VALUES
('13011-22010', 'Pistón Motor Toyota 1.8', 1, 350.00, 25, 'Toyota Corolla 2003-2008, Matrix 1.8L', 1),
('04465-12110', 'Pastilla de Freno Delantera', 2, 120.00, 5, 'Toyota Yaris 2005-2012, Yaris Sport', 2),
('41201-29535', 'Corona y Piñón Transmisión', 3, 1200.00, 8, 'Toyota Hilux 4x4 2005-2015', 3),
('48530-09810', 'Amortiguador Trasero Gas', 4, 280.00, 15, 'Suzuki Grand Vitara 2006-2015', 4)
ON CONFLICT (oem) DO NOTHING;

-- Clientes
INSERT INTO clientes (nombre, telefono, direccion) VALUES
('Taller Mecánico El Veloz', '71245896', 'Av. Buenos Aires, La Paz'),
('Repuestos Murillo', '70124859', 'Calle Murillo, La Paz')
ON CONFLICT DO NOTHING;
