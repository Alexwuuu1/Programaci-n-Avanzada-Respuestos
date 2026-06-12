import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando vaciado de transacciones para una siembra limpia...");

  // Eliminar datos transaccionales previos para evitar inconsistencias
  await prisma.abonoCredito.deleteMany();
  await prisma.detalleVenta.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.ordenProduccion.deleteMany();
  await prisma.movimientoInventario.deleteMany();
  await prisma.detallePedidoProveedor.deleteMany();
  await prisma.pedidoProveedor.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.empleado.deleteMany();
  await prisma.role.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.categoria.deleteMany();

  console.log("Creando roles del sistema...");
  const roleAdmin = await prisma.role.create({
    data: { nombre: "Admin", descripcion: "Administrador con control completo", color: "purple" }
  });
  const roleVendedor = await prisma.role.create({
    data: { nombre: "Vendedor", descripcion: "Ejecutivo de ventas y atención al cliente", color: "blue" }
  });
  const roleOperario = await prisma.role.create({
    data: { nombre: "Operario", descripcion: "Operario de planta y maquinados", color: "green" }
  });

  console.log("Creando expedientes de empleados...");
  const empCarlos = await prisma.empleado.create({
    data: {
      nombre: "Carlos Mendoza",
      ci: "1234567",
      email: "carlos.m@repuestos.com",
      telefono: "77889911",
      direccion: "Av. Arce #123, Sopocachi, La Paz",
      cargo: "Administrador de Sistemas",
      turno: "Completo",
      salario: 7500.00,
      fechaNacimiento: new Date("1985-04-12"),
      fechaContratacion: new Date("2020-01-15"),
      contactoEmergencia: "Laura Mendoza (Esposa) - 77889922",
      estado: "Activo"
    }
  });

  const empAndrea = await prisma.empleado.create({
    data: {
      nombre: "Andrea Rojas",
      ci: "7654321",
      email: "andrea.r@repuestos.com",
      telefono: "71223344",
      direccion: "Calle 15, Obrajes, La Paz",
      cargo: "Vendedor Comercial",
      turno: "Completo",
      salario: 3500.00,
      fechaNacimiento: new Date("1992-08-22"),
      fechaContratacion: new Date("2022-03-01"),
      contactoEmergencia: "Pedro Rojas (Padre) - 71223355",
      estado: "Activo"
    }
  });

  const empJose = await prisma.empleado.create({
    data: {
      nombre: "Jose Mamani",
      ci: "9876543",
      email: "jose.m@repuestos.com",
      telefono: "60112233",
      direccion: "Zona 16 de Julio, El Alto",
      cargo: "Operario de Fundición",
      turno: "Mañana",
      salario: 4000.00,
      fechaNacimiento: new Date("1990-11-05"),
      fechaContratacion: new Date("2021-06-10"),
      contactoEmergencia: "Sofia Mamani (Hermana) - 60112244",
      estado: "Activo"
    }
  });

  const empLuis = await prisma.empleado.create({
    data: {
      nombre: "Luis Torrico",
      ci: "4567890",
      email: "luis.t@repuestos.com",
      telefono: "68877665",
      direccion: "Zona Miraflores, Av. Busch, La Paz",
      cargo: "Operario de Torno",
      turno: "Tarde",
      salario: 4000.00,
      fechaNacimiento: new Date("1988-02-18"),
      fechaContratacion: new Date("2021-08-01"),
      contactoEmergencia: "Carmen Torrico (Madre) - 68877660",
      estado: "Activo"
    }
  });

  const empMaria = await prisma.empleado.create({
    data: {
      nombre: "Maria Chavez",
      ci: "8529637",
      email: "maria.c@repuestos.com",
      telefono: "73549210",
      direccion: "Zona Sur, Calacoto, La Paz",
      cargo: "Cajera Comercial",
      turno: "Completo",
      salario: 3500.00,
      fechaNacimiento: new Date("1995-07-30"),
      fechaContratacion: new Date("2023-02-15"),
      contactoEmergencia: "Juan Chavez (Hermano) - 73549211",
      estado: "Activo"
    }
  });

  console.log("Creando cuentas de usuario...");
  const uAdmin = await prisma.usuario.create({
    data: { usuario: "admin", contrasena: "admin123", email: "admin@repuestos.com", rolId: roleAdmin.id, empleadoId: empCarlos.id }
  });
  const uAndrea = await prisma.usuario.create({
    data: { usuario: "andrea", contrasena: "andrea123", email: "andrea@repuestos.com", rolId: roleVendedor.id, empleadoId: empAndrea.id }
  });
  const uJose = await prisma.usuario.create({
    data: { usuario: "jose", contrasena: "jose123", email: "jose@repuestos.com", rolId: roleOperario.id, empleadoId: empJose.id }
  });
  const uLuis = await prisma.usuario.create({
    data: { usuario: "luis", contrasena: "luis123", email: "luis@repuestos.com", rolId: roleOperario.id, empleadoId: empLuis.id }
  });
  const uMaria = await prisma.usuario.create({
    data: { usuario: "maria", contrasena: "maria123", email: "maria@repuestos.com", rolId: roleVendedor.id, empleadoId: empMaria.id }
  });

  console.log("Creando categorías de repuestos...");
  const catMotor = await prisma.categoria.create({ data: { nombre: "Motor", descripcion: "Repuestos y componentes internos del motor", icono: "Cpu", color: "red", orden: 1 } });
  const catFrenos = await prisma.categoria.create({ data: { nombre: "Frenos", descripcion: "Pastillas, discos y cilindros de frenado", icono: "Disc", color: "blue", orden: 2 } });
  const catSuspension = await prisma.categoria.create({ data: { nombre: "Suspensión", descripcion: "Amortiguadores, resortes y bujes", icono: "Activity", color: "green", orden: 3 } });
  const catTransmision = await prisma.categoria.create({ data: { nombre: "Transmisión", descripcion: "Cajas de cambio, embragues y juntas", icono: "Shuffle", color: "purple", orden: 4 } });
  const catElectrico = await prisma.categoria.create({ data: { nombre: "Eléctrico", descripcion: "Alternadores, baterías y sensores", icono: "Zap", color: "yellow", orden: 5 } });

  console.log("Creando proveedores de repuestos...");
  const provBosch = await prisma.proveedor.create({ data: { nombre: "Bosch Bolivia", nit: "1020304050", email: "contacto@bosch.bo", telefono: "22446688", direccion: "Av. Blanco Galindo Km 3, Cochabamba", condicionesPago: "Crédito 30 días", calificacion: 5 } });
  const provBrembo = await prisma.proveedor.create({ data: { nombre: "Brembo Latam", nit: "9876543210", email: "info@brembo-latam.com", telefono: "33123456", direccion: "Zona Industrial, Santa Cruz", condicionesPago: "Contado", calificacion: 5 } });
  const provDenso = await prisma.proveedor.create({ data: { nombre: "Denso Corp", nit: "1122334455", email: "sales@denso.bo", telefono: "22115599", direccion: "Calle Loayza #456, La Paz", condicionesPago: "Crédito 15 días", calificacion: 4 } });
  const provToyota = await prisma.proveedor.create({ data: { nombre: "Toyota Genuine Parts", nit: "5566778899", email: "parts@toyota.bo", telefono: "22791000", direccion: "Av. Ballivián, Calacoto, La Paz", condicionesPago: "Crédito 45 días", calificacion: 5 } });
  const provZF = await prisma.proveedor.create({ data: { nombre: "ZF Aftermarket", nit: "4433221100", email: "soporte@zf.bo", telefono: "33445566", direccion: "Av. Cristo Redentor, Santa Cruz", condicionesPago: "Contado", calificacion: 4 } });

  console.log("Creando catálogo de repuestos (15 productos)...");
  // Motor
  const p1 = await prisma.producto.create({
    data: { oem: "13101-0C020", nombre: "Pistón Original Toyota 2.4L", marca: "Toyota", categoriaId: catMotor.id, precioCompra: 450.00, precio: 680.00, stock: 45, stockMinimo: 5, ubicacion: "Pasillo A-3", peso: 0.850, compatibilidad: "Toyota Hilux 2016-2022, Toyota Tacoma", proveedorId: provToyota.id }
  });
  const p2 = await prisma.producto.create({
    data: { oem: "FR7KPP33U+", nombre: "Bujía de Iridio Bosch", marca: "Bosch", categoriaId: catMotor.id, precioCompra: 35.00, precio: 65.00, stock: 240, stockMinimo: 20, ubicacion: "Cajón E-1", peso: 0.050, compatibilidad: "Universal, Hyundai, Toyota, Suzuki, Nissan", proveedorId: provBosch.id }
  });
  const p3 = await prisma.producto.create({
    data: { oem: "90915-YZZD2", nombre: "Filtro de Aceite Hilux", marca: "Toyota", categoriaId: catMotor.id, precioCompra: 40.00, precio: 75.00, stock: 150, stockMinimo: 15, ubicacion: "Estante C-2", peso: 0.320, compatibilidad: "Toyota Hilux, Land Cruiser, Prado", proveedorId: provToyota.id }
  });

  // Frenos
  const p4 = await prisma.producto.create({
    data: { oem: "P83085N", nombre: "Pastillas de Freno Brembo Delanteras", marca: "Brembo", categoriaId: catFrenos.id, precioCompra: 180.00, precio: 320.00, stock: 32, stockMinimo: 5, ubicacion: "Pasillo B-1", peso: 1.500, compatibilidad: "Toyota Corolla 2014-2019, RAV4", proveedorId: provBrembo.id }
  });
  const p5 = await prisma.producto.create({
    data: { oem: "09.A123.11", nombre: "Disco de Freno Brembo Ventilado", marca: "Brembo", categoriaId: catFrenos.id, precioCompra: 280.00, precio: 450.00, stock: 22, stockMinimo: 4, ubicacion: "Pasillo B-2", peso: 6.200, compatibilidad: "Toyota Corolla, Nissan Sentra", proveedorId: provBrembo.id }
  });
  const p6 = await prisma.producto.create({
    data: { oem: "LCF-600-500ML", nombre: "Líquido de Frenos Brembo LCF 600", marca: "Brembo", categoriaId: catFrenos.id, precioCompra: 90.00, precio: 150.00, stock: 68, stockMinimo: 10, ubicacion: "Cajón E-4", peso: 0.550, compatibilidad: "Universal, sistemas de alto rendimiento", proveedorId: provBrembo.id }
  });

  // Suspensión
  const p7 = await prisma.producto.create({
    data: { oem: "339114", nombre: "Amortiguador Delantero Kayaba", marca: "KYB", categoriaId: catSuspension.id, precioCompra: 310.00, precio: 490.00, stock: 26, stockMinimo: 4, ubicacion: "Pasillo C-1", peso: 4.800, compatibilidad: "Toyota RAV4 2006-2012, Vanguard", proveedorId: provZF.id }
  });
  const p8 = await prisma.producto.create({
    data: { oem: "RA3948", nombre: "Resorte de Suspensión Reforzado", marca: "ZF Sachs", categoriaId: catSuspension.id, precioCompra: 190.00, precio: 310.00, stock: 16, stockMinimo: 2, ubicacion: "Pasillo C-3", peso: 3.500, compatibilidad: "Nissan Frontier 2015+, Pathfinder", proveedorId: provZF.id }
  });
  const p9 = await prisma.producto.create({
    data: { oem: "48815-02190", nombre: "Buje de Barra Estabilizadora", marca: "Toyota", categoriaId: catSuspension.id, precioCompra: 15.00, precio: 35.00, stock: 95, stockMinimo: 10, ubicacion: "Cajón E-2", peso: 0.080, compatibilidad: "Toyota Corolla, Yaris, Etios", proveedorId: provToyota.id }
  });

  // Transmisión
  const p10 = await prisma.producto.create({
    data: { oem: "3000-951-098", nombre: "Kit de Embrague ZF Sachs", marca: "Sachs", categoriaId: catTransmision.id, precioCompra: 850.00, precio: 1350.00, stock: 10, stockMinimo: 2, ubicacion: "Pasillo D-1", peso: 8.500, compatibilidad: "Suzuki Grand Vitara 2.0, SX4", proveedorId: provZF.id }
  });
  const p11 = await prisma.producto.create({
    data: { oem: "CO-3801", nombre: "Junta Homocinética Lado Rueda", marca: "ZF", categoriaId: catTransmision.id, precioCompra: 160.00, precio: 270.00, stock: 24, stockMinimo: 3, ubicacion: "Pasillo D-2", peso: 2.100, compatibilidad: "Toyota Caldina, Corolla, Fielder", proveedorId: provZF.id }
  });
  const p12 = await prisma.producto.create({
    data: { oem: "ZF-GEAR-1L", nombre: "Aceite de Transmisión Manual 75W-90", marca: "ZF", categoriaId: catTransmision.id, precioCompra: 70.00, precio: 120.00, stock: 55, stockMinimo: 8, ubicacion: "Estante C-4", peso: 0.950, compatibilidad: "Universal, cajas manuales sincrónicas", proveedorId: provZF.id }
  });

  // Eléctrico
  const p13 = await prisma.producto.create({
    data: { oem: "104210-9010", nombre: "Alternador Denso 12V 90A", marca: "Denso", categoriaId: catElectrico.id, precioCompra: 950.00, precio: 1580.00, stock: 8, stockMinimo: 2, ubicacion: "Pasillo A-1", peso: 5.400, compatibilidad: "Toyota Corolla, Auris, Rav4", proveedorId: provDenso.id }
  });
  const p14 = await prisma.producto.create({
    data: { oem: "228000-7560", nombre: "Motor de Arranque Denso", marca: "Denso", categoriaId: catElectrico.id, precioCompra: 720.00, precio: 1180.00, stock: 12, stockMinimo: 2, ubicacion: "Pasillo A-2", peso: 3.800, compatibilidad: "Toyota Hilux, Land Cruiser, Prado 2.7L", proveedorId: provDenso.id }
  });
  const p15 = await prisma.producto.create({
    data: { oem: "234-4209", nombre: "Sensor de Oxígeno Denso", marca: "Denso", categoriaId: catElectrico.id, precioCompra: 190.00, precio: 340.00, stock: 28, stockMinimo: 4, ubicacion: "Cajón E-3", peso: 0.120, compatibilidad: "Honda Civic, Accord, CR-V, HR-V", proveedorId: provDenso.id }
  });

  console.log("Creando clientes realistas (15 clientes)...");
  // Clientes Particulares
  const c1 = await prisma.cliente.create({ data: { nombre: "Juan Perez", nit: "349581023", email: "juan.perez@gmail.com", telefono: "78912345", direccion: "Calle Sagárnaga #45, La Paz", tipo: "Particular", nivelFidelidad: "Regular" } });
  const c2 = await prisma.cliente.create({ data: { nombre: "Roberto Flores", nit: "492019482", email: "r.flores@outlook.com", telefono: "60234581", direccion: "Av. Buenos Aires, La Paz", tipo: "Particular", nivelFidelidad: "Regular" } });
  const c3 = await prisma.cliente.create({ data: { nombre: "Carlos Rojas", nit: "8920148102", email: "crojas@hotmail.com", telefono: "71283749", direccion: "Calle Comercio #20, La Paz", tipo: "Particular", nivelFidelidad: "Nuevo" } });
  const c4 = await prisma.cliente.create({ data: { nombre: "David Condori", nit: "1028394812", email: "david.condori@gmail.com", telefono: "72561940", direccion: "Calle Ballivián, El Alto", tipo: "Particular", nivelFidelidad: "VIP", descuentoPorcentaje: 5.00 } });
  const c5 = await prisma.cliente.create({ data: { nombre: "Maria Alvarez", nit: "71930284", email: "maria.a@gmail.com", telefono: "70928374", direccion: "Calacoto Calle 23, La Paz", tipo: "Particular", nivelFidelidad: "Regular" } });
  const c6 = await prisma.cliente.create({ data: { nombre: "Sonia Quispe", nit: "59102834", email: "sonia.q@gmail.com", telefono: "61102938", direccion: "Zona San Pedro, La Paz", tipo: "Particular", nivelFidelidad: "Nuevo" } });

  // Talleres
  const c7 = await prisma.cliente.create({ data: { nombre: "Taller Mecánico El Veloz", nit: "830291023", email: "veloz.mecanica@gmail.com", telefono: "22849102", direccion: "Av. Baptista #552, La Paz", tipo: "Taller", nivelFidelidad: "VIP", descuentoPorcentaje: 10.00, limiteCredito: 5000.00 } });
  const c8 = await prisma.cliente.create({ data: { nombre: "Frenos El Tío", nit: "9201938210", email: "frenos.tio@gmail.com", telefono: "22129482", direccion: "Zona Tembladerani, La Paz", tipo: "Taller", nivelFidelidad: "VIP", descuentoPorcentaje: 12.00, limiteCredito: 8000.00 } });
  const c9 = await prisma.cliente.create({ data: { nombre: "Multiservicios La Paz", nit: "193810239", email: "contact@multipaz.com", telefono: "22791823", direccion: "Av. 20 de Octubre, La Paz", tipo: "Taller", nivelFidelidad: "Regular", descuentoPorcentaje: 5.00, limiteCredito: 3000.00 } });
  const c10 = await prisma.cliente.create({ data: { nombre: "AutoClínica Sopocachi", nit: "2938102938", email: "sopocachi.clinica@gmail.com", telefono: "22449120", direccion: "Calle Belisario Salinas, La Paz", tipo: "Taller", nivelFidelidad: "Nuevo" } });
  const c11 = await prisma.cliente.create({ data: { nombre: "Torno Automotriz El Alto", nit: "3810293041", email: "torno.alto@gmail.com", telefono: "22819230", direccion: "Av. Juan Pablo II, El Alto", tipo: "Taller", nivelFidelidad: "VIP", descuentoPorcentaje: 8.00, limiteCredito: 4000.00 } });

  // Empresas
  const c12 = await prisma.cliente.create({ data: { nombre: "Transportes El Chasqui SRL", nit: "100293021", email: "logistica@chasqui.bo", telefono: "33829102", direccion: "Parque Industrial, Santa Cruz", tipo: "Empresa", nivelFidelidad: "VIP", descuentoPorcentaje: 15.00, limiteCredito: 25000.00 } });
  const c13 = await prisma.cliente.create({ data: { nombre: "Minera San Cristóbal", nit: "302910294", email: "adquisiciones@sancristobal.bo", telefono: "22119230", direccion: "Av. Hernando Siles, La Paz", tipo: "Empresa", nivelFidelidad: "VIP", descuentoPorcentaje: 15.00, limiteCredito: 50000.00 } });
  const c14 = await prisma.cliente.create({ data: { nombre: "Cervecería Boliviana Nacional", nit: "492019482", email: "distribucion@cbn.bo", telefono: "22409120", direccion: "Av. Montes, La Paz", tipo: "Empresa", nivelFidelidad: "Regular", descuentoPorcentaje: 10.00, limiteCredito: 20000.00 } });
  const c15 = await prisma.cliente.create({ data: { nombre: "Constructora El Sol", nit: "502910293", email: "proyectos@elsol.bo", telefono: "22798102", direccion: "Zona Achumani, La Paz", tipo: "Empresa", nivelFidelidad: "Nuevo", limiteCredito: 10000.00 } });

  console.log("Creando transacciones de ventas históricas (15+ ventas en el último mes)...");
  const now = new Date();
  
  const createSale = async (daysAgo: number, client: any, user: any, items: { prod: any, qty: number }[], payment: string, docNum: string) => {
    const saleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Calcular total
    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.prod.precio) * item.qty;
    }
    
    const discount = client.descuentoPorcentaje ? subtotal * (Number(client.descuentoPorcentaje) / 100) : 0;
    const finalTotal = subtotal - discount;

    const venta = await prisma.venta.create({
      data: {
        clienteId: client.id,
        usuarioId: user.id,
        fecha: saleDate,
        total: finalTotal,
        descuento: discount,
        metodoPago: payment,
        nroFactura: docNum,
        observaciones: `Siembra de venta - ${daysAgo} días atrás.`,
        estado: "Completada"
      }
    });

    for (const item of items) {
      await prisma.detalleVenta.create({
        data: {
          ventaId: venta.id,
          productoId: item.prod.id,
          cantidad: item.qty,
          precioUnitario: item.prod.precio
        }
      });

      // Crear registro en el Kardex
      await prisma.movimientoInventario.create({
        data: {
          productoId: item.prod.id,
          tipoMovimiento: "Salida",
          cantidad: item.qty,
          fecha: saleDate,
          motivo: `Factura #${venta.id}${venta.nroFactura ? ` / ${venta.nroFactura}` : ""}`,
          usuarioId: user.id
        }
      });
    }

    return venta;
  };

  // Ventas de hoy (daysAgo: 0) - Soluciona KPIs del Dashboard en Bs. 0.00
  await createSale(0, c1, uAndrea, [{ prod: p2, qty: 22 }, { prod: p3, qty: 5 }], "Efectivo", "FACT-1011");
  await createSale(0, c4, uAndrea, [{ prod: p9, qty: 10 }], "QR", "FACT-1012");
  await createSale(0, c9, uMaria, [{ prod: p5, qty: 9 }], "Tarjeta", "FACT-2008");

  // Ventas Históricas
  await createSale(1, c1, uAndrea, [{ prod: p2, qty: 4 }, { prod: p3, qty: 1 }], "Efectivo", "FACT-1001");
  await createSale(3, c7, uAndrea, [{ prod: p4, qty: 2 }, { prod: p5, qty: 2 }], "Transferencia", "FACT-1002");
  await createSale(4, c12, uAndrea, [{ prod: p10, qty: 1 }, { prod: p11, qty: 2 }, { prod: p12, qty: 5 }], "QR", "FACT-1003");
  await createSale(6, c3, uAndrea, [{ prod: p1, qty: 1 }, { prod: p3, qty: 2 }], "Efectivo", "FACT-1004");
  await createSale(8, c8, uAndrea, [{ prod: p4, qty: 4 }, { prod: p6, qty: 3 }], "Tarjeta", "FACT-1005");
  await createSale(10, c13, uAndrea, [{ prod: p13, qty: 1 }, { prod: p14, qty: 1 }], "Transferencia", "FACT-1006");
  await createSale(12, c2, uAndrea, [{ prod: p2, qty: 8 }], "Efectivo", "FACT-1007");
  await createSale(15, c14, uAndrea, [{ prod: p7, qty: 4 }, { prod: p8, qty: 4 }], "QR", "FACT-1008");
  await createSale(18, c9, uAndrea, [{ prod: p9, qty: 6 }, { prod: p5, qty: 1 }], "Tarjeta", "FACT-1009");
  await createSale(22, c4, uAndrea, [{ prod: p1, qty: 2 }, { prod: p13, qty: 1 }], "QR", "FACT-1010");

  // Ventas de Maria
  await createSale(2, c2, uMaria, [{ prod: p3, qty: 2 }, { prod: p9, qty: 4 }], "Efectivo", "FACT-2001");
  await createSale(5, c9, uMaria, [{ prod: p4, qty: 2 }, { prod: p6, qty: 1 }], "Tarjeta", "FACT-2002");
  await createSale(7, c15, uMaria, [{ prod: p15, qty: 2 }, { prod: p14, qty: 1 }], "Transferencia", "FACT-2003");
  await createSale(11, c5, uMaria, [{ prod: p2, qty: 6 }, { prod: p3, qty: 1 }], "Efectivo", "FACT-2004");
  await createSale(14, c11, uMaria, [{ prod: p10, qty: 1 }, { prod: p12, qty: 3 }], "QR", "FACT-2005");
  await createSale(19, c10, uMaria, [{ prod: p5, qty: 2 }], "Tarjeta", "FACT-2006");
  await createSale(25, c6, uMaria, [{ prod: p2, qty: 4 }], "Efectivo", "FACT-2007");

  // Ventas a Crédito
  const vCred1 = await createSale(15, c7, uAndrea, [{ prod: p10, qty: 2 }, { prod: p13, qty: 1 }], "Credito", "FACT-CRED-01");
  const vCred2 = await createSale(10, c12, uAndrea, [{ prod: p1, qty: 3 }, { prod: p5, qty: 4 }], "Credito", "FACT-CRED-02");
  const vCred3 = await createSale(5, c13, uAndrea, [{ prod: p7, qty: 2 }, { prod: p8, qty: 2 }], "Credito", "FACT-CRED-03");

  console.log("Registrando abonos a ventas al crédito...");
  await prisma.abonoCredito.create({
    data: {
      ventaId: vCred1.id,
      monto: 1500.00,
      fecha: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      metodoPago: "Efectivo",
      comprobante: "RECIBO-ABONO-01",
      notas: "Primer abono a cuenta de embragues."
    }
  });

  await prisma.abonoCredito.create({
    data: {
      ventaId: vCred2.id,
      monto: 2500.00,
      fecha: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      metodoPago: "Transferencia",
      comprobante: "RECIBO-ABONO-02",
      notas: "Abono transferencia bancaria."
    }
  });

  console.log("Creando compras a proveedores (Egresos)...");
  const createPurchase = async (daysAgo: number, provider: any, user: any, items: { prod: any, qty: number }[], refNum: string) => {
    const purDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.prod.precioCompra || item.prod.precio * 0.6) * item.qty;
    }

    const order = await prisma.pedidoProveedor.create({
      data: {
        proveedorId: provider.id,
        usuarioId: user.id,
        fecha: purDate,
        fechaRecepcion: purDate,
        fechaEntregaEstimada: purDate,
        nroReferencia: refNum,
        estado: "Recibido",
        total: subtotal,
        observaciones: `Siembra de compra recibida - ${daysAgo} días atrás.`
      }
    });

    for (const item of items) {
      await prisma.detallePedidoProveedor.create({
        data: {
          pedidoId: order.id,
          productoId: item.prod.id,
          cantidad: item.qty,
          precioCompra: item.prod.precioCompra || item.prod.precio * 0.6
        }
      });

      // Crear registro en el Kardex
      await prisma.movimientoInventario.create({
        data: {
          productoId: item.prod.id,
          tipoMovimiento: "Entrada",
          cantidad: item.qty,
          fecha: purDate,
          motivo: `Recepción Compra #${order.id}${order.nroReferencia ? ` / Ref ${order.nroReferencia}` : ""}`,
          usuarioId: user.id
        }
      });
    }
  };

  await createPurchase(25, provToyota, uAdmin, [{ prod: p1, qty: 10 }, { prod: p3, qty: 50 }], "REF-TOY-01");
  await createPurchase(20, provBosch, uAdmin, [{ prod: p2, qty: 100 }], "REF-BOS-01");
  await createPurchase(15, provBrembo, uAdmin, [{ prod: p4, qty: 20 }, { prod: p5, qty: 10 }], "REF-BRE-01");
  await createPurchase(10, provDenso, uAdmin, [{ prod: p13, qty: 5 }, { prod: p14, qty: 5 }], "REF-DEN-01");
  await createPurchase(5, provZF, uAdmin, [{ prod: p10, qty: 5 }, { prod: p12, qty: 20 }], "REF-ZF-01");

  console.log("Creando órdenes de producción (15 órdenes)...");
  const createProdOrder = async (daysAgo: number, product: any, quantity: number, responsible: any, priority: string, status: string, cost: number) => {
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const endDate = status === "Finalizado" ? new Date(orderDate.getTime() + 12 * 60 * 60 * 1000) : null;

    const order = await prisma.ordenProduccion.create({
      data: {
        productoId: product.id,
        cantidad: quantity,
        cantidadProducida: status === "Finalizado" ? quantity : null,
        prioridad: priority,
        costoProduccion: cost,
        observaciones: `Siembra de producción histórica - ${status}.`,
        fechaInicio: orderDate,
        fechaFin: endDate,
        estado: status,
        responsableId: responsible.id
      }
    });

    // Crear registro en el Kardex para producción finalizada
    if (status === "Finalizado") {
      await prisma.movimientoInventario.create({
        data: {
          productoId: product.id,
          tipoMovimiento: "Entrada",
          cantidad: quantity,
          fecha: endDate || orderDate,
          motivo: `Producción de taller OP #${order.id}`,
          usuarioId: uAdmin.id
        }
      });
    }
  };

  // Jose Mamani (Operario de Fundición)
  await createProdOrder(1, p1, 10, empJose, "Alta", "Finalizado", 4500.00);
  await createProdOrder(3, p5, 5, empJose, "Media", "Finalizado", 1400.00);
  await createProdOrder(5, p1, 15, empJose, "Alta", "Finalizado", 6750.00);
  await createProdOrder(7, p11, 20, empJose, "Baja", "Finalizado", 3200.00);
  await createProdOrder(10, p8, 8, empJose, "Media", "Finalizado", 1520.00);
  await createProdOrder(14, p5, 10, empJose, "Alta", "Finalizado", 2800.00);
  await createProdOrder(18, p1, 5, empJose, "Alta", "Finalizado", 2250.00);
  await createProdOrder(2, p11, 12, empJose, "Media", "En Proceso", 1920.00);

  // Luis Torrico (Operario de Torno)
  await createProdOrder(2, p5, 8, empLuis, "Media", "Finalizado", 2240.00);
  await createProdOrder(4, p8, 12, empLuis, "Baja", "Finalizado", 2280.00);
  await createProdOrder(6, p11, 15, empLuis, "Media", "Finalizado", 2400.00);
  await createProdOrder(9, p5, 10, empLuis, "Alta", "Finalizado", 2800.00);
  await createProdOrder(12, p11, 10, empLuis, "Media", "Finalizado", 1600.00);
  await createProdOrder(16, p1, 8, empLuis, "Alta", "Finalizado", 3600.00);
  await createProdOrder(20, p8, 6, empLuis, "Baja", "Finalizado", 1140.00);
  await createProdOrder(1, p5, 15, empLuis, "Alta", "En Proceso", 4200.00);
  await createProdOrder(0, p1, 6, empLuis, "Media", "Pendiente", 2700.00);

  console.log("Base de datos sembrada con éxito.");
}

main()
  .catch((e) => {
    console.error("Error al sembrar la base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
