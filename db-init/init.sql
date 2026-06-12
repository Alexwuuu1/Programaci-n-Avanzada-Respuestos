-- Base de Datos para el Sistema de Repuestos La Paz V4

-- 1. Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    permisos TEXT,
    color VARCHAR(20)
);

-- 2. Tabla de Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ci VARCHAR(20),
    email VARCHAR(150),
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT,
    cargo VARCHAR(100) NOT NULL,
    turno VARCHAR(30),
    salario NUMERIC(10, 2),
    fecha_nacimiento DATE,
    fecha_contratacion DATE,
    contacto_emergencia VARCHAR(150),
    notas TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Usuarios (Cuentas del sistema)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    ultimo_acceso TIMESTAMP,
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    empleado_id INT UNIQUE REFERENCES empleados(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Categorias de Repuestos
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50),
    color VARCHAR(20),
    orden INT
);

-- 5. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    nit VARCHAR(30),
    email VARCHAR(150),
    telefono VARCHAR(20) NOT NULL,
    telefono_secundario VARCHAR(20),
    contacto_principal VARCHAR(100),
    direccion TEXT,
    condiciones_pago VARCHAR(100),
    calificacion INT CHECK (calificacion IS NULL OR calificacion BETWEEN 1 AND 5),
    notas TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Productos (Catalogo de Repuestos)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    oem VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    marca VARCHAR(100),
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio > 0),
    precio_compra NUMERIC(10, 2),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    ubicacion VARCHAR(50),
    peso NUMERIC(8, 3),
    compatibilidad TEXT NOT NULL,
    imagen VARCHAR(500),
    notas TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Descontinuado')),
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(30),
    email VARCHAR(150),
    telefono VARCHAR(20),
    direccion TEXT,
    tipo VARCHAR(30) NOT NULL DEFAULT 'Particular',
    vehiculos TEXT,
    nivel_fidelidad VARCHAR(20) NOT NULL DEFAULT 'Nuevo',
    descuento_porcentaje NUMERIC(5, 2),
    limite_credito NUMERIC(10, 2),
    notas TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE RESTRICT,
    usuario_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    descuento NUMERIC(10, 2),
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'Efectivo',
    nro_factura VARCHAR(30),
    observaciones TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Completada' CHECK (estado IN ('Completada', 'Anulada'))
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
    fecha_entrega_estimada DATE,
    fecha_recepcion TIMESTAMP,
    nro_referencia VARCHAR(50),
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Recibido', 'Cancelado')),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    observaciones TEXT
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

-- 13. Tabla de Ordenes de Produccion (Seguimiento de Fabricacion)
CREATE TABLE IF NOT EXISTS ordenes_produccion (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    cantidad_producida INT,
    prioridad VARCHAR(20) NOT NULL DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente')),
    costo_produccion NUMERIC(10, 2),
    observaciones TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Finalizado', 'Cancelado')),
    responsable_id INT REFERENCES empleados(id) ON DELETE SET NULL
);

-- =======================================================
-- SEMILLAS DE DATOS (INSERTS INICIALES)
-- =======================================================

-- Roles
INSERT INTO roles (nombre, descripcion, color) VALUES
('Admin', 'Administracion total del sistema', 'purple'),
('Vendedor', 'Registro de ventas y consulta de repuestos', 'blue'),
('Operario', 'Gestion de inventarios, pedidos a proveedores y produccion', 'cyan')
ON CONFLICT (nombre) DO NOTHING;

-- Empleados
INSERT INTO empleados (nombre, telefono, cargo, estado) VALUES
('Juan Espinoza', '78945612', 'Gerente de Produccion', 'Activo'),
('Alejandro Villalpando', '75612348', 'Encargado de Ventas', 'Activo'),
('Takeshi Carvajal', '60124859', 'Jefe de Almacen', 'Activo'),
('Israel Castaneta', '71245896', 'Operador de Torno', 'Activo'),
('Luz Daniela Mamani', '62489512', 'Control de Calidad', 'Activo')
ON CONFLICT DO NOTHING;

-- Usuarios (Contrasena de prueba en texto plano para testing)
INSERT INTO usuarios (usuario, contrasena, rol_id, empleado_id, estado) VALUES
('admin', 'admin123', 1, 1, 'Activo'),
('vendedor', 'vendedor123', 2, 2, 'Activo'),
('operario', 'operario123', 3, 3, 'Activo')
ON CONFLICT (usuario) DO NOTHING;

-- Categorias
INSERT INTO categorias (nombre, icono, color, orden) VALUES
('Motor', 'Cog', 'blue', 1),
('Frenos', 'Disc3', 'red', 2),
('Transmision', 'Settings', 'purple', 3),
('Suspension', 'Wrench', 'cyan', 4),
('Electrico', 'Zap', 'yellow', 5)
ON CONFLICT (nombre) DO NOTHING;

-- Proveedores
INSERT INTO proveedores (nombre, telefono, direccion, estado) VALUES
('Fundiciones El Alto', '2840591', 'Av. Juan Pablo II, El Alto', 'Activo'),
('Frenos Bolivia', '2214589', 'Zona Gran Poder, La Paz', 'Activo'),
('Importadora Toyo', '2245896', 'Av. Tejada Sorzano, La Paz', 'Activo'),
('Amortiguadores Pacajes', '2856941', 'Zona Pacajes, El Alto', 'Activo')
ON CONFLICT (nombre) DO NOTHING;

-- Productos (Catalogo)
INSERT INTO productos (oem, nombre, categoria_id, precio, stock, compatibilidad, proveedor_id, stock_minimo, estado) VALUES
('13011-22010', 'Piston Motor Toyota 1.8', 1, 350.00, 25, 'Toyota Corolla 2003-2008, Matrix 1.8L', 1, 5, 'Activo'),
('04465-12110', 'Pastilla de Freno Delantera', 2, 120.00, 5, 'Toyota Yaris 2005-2012, Yaris Sport', 2, 5, 'Activo'),
('41201-29535', 'Corona y Pinon Transmision', 3, 1200.00, 8, 'Toyota Hilux 4x4 2005-2015', 3, 5, 'Activo'),
('48530-09810', 'Amortiguador Trasero Gas', 4, 280.00, 15, 'Suzuki Grand Vitara 2006-2015', 4, 5, 'Activo')
ON CONFLICT (oem) DO NOTHING;

-- Clientes
INSERT INTO clientes (nombre, telefono, direccion, tipo, nivel_fidelidad, estado) VALUES
('Taller Mecanico El Veloz', '71245896', 'Av. Buenos Aires, La Paz', 'Taller', 'Nuevo', 'Activo'),
('Repuestos Murillo', '70124859', 'Calle Murillo, La Paz', 'Empresa', 'Nuevo', 'Activo')
ON CONFLICT DO NOTHING;
