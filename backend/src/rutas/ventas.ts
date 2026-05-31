import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaVentas = Router();

// 1. Listar historial de ventas
rutaVentas.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.venta.findMany({
      include: {
        cliente: true,
        usuario: {
          include: { empleado: true },
        },
        detalles: {
          include: { producto: true },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const mapped = list.map((v) => ({
      id: String(v.id),
      clientId: v.clienteId ? String(v.clienteId) : undefined,
      clientName: v.cliente ? v.cliente.nombre : "Cliente General",
      sellerName: v.usuario?.empleado?.nombre || v.usuario?.usuario || "Sistema",
      date: v.fecha.toISOString(),
      total: Number(v.total),
      items: v.detalles.map((d) => ({
        id: String(d.id),
        productId: String(d.productoId),
        productName: d.producto.nombre,
        productOem: d.producto.oem,
        quantity: d.cantidad,
        priceUnit: Number(d.precioUnitario),
        subtotal: d.cantidad * Number(d.precioUnitario),
      })),
    }));

    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener el historial de ventas." });
  }
});

// 2. Procesar una venta (Con transacción Prisma)
rutaVentas.post("/", async (req: Request, res: Response): Promise<void> => {
  const { clientId, items, username } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !username) {
    res.status(400).json({ error: "Datos de venta incompletos (requiere items y usuario)." });
    return;
  }

  try {
    // Buscar el usuario que vende para asociar su id
    const dbUser = await prisma.usuario.findUnique({
      where: { usuario: username.toLowerCase().trim() },
      include: { empleado: true },
    });

    if (!dbUser) {
      res.status(400).json({ error: "Vendedor no registrado en el sistema." });
      return;
    }

    // Ejecutar transacción Prisma para validar y registrar la venta de forma atómica
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const verifiedItems = [];

      // a. Validar stock de cada ítem en el carro de compras
      for (const item of items) {
        const product = await tx.producto.findUnique({
          where: { id: Number(item.productId) },
        });

        if (!product) {
          throw new Error(`El repuesto con ID ${item.productId} no existe en catálogo.`);
        }

        if (product.stock < Number(item.quantity)) {
          throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}, solicitado: ${item.quantity}.`);
        }

        const itemTotal = Number(item.quantity) * Number(item.priceUnit);
        totalAmount += itemTotal;

        verifiedItems.push({
          productId: product.id,
          name: product.nombre,
          oem: product.oem,
          quantity: Number(item.quantity),
          priceUnit: Number(item.priceUnit),
        });
      }

      // b. Crear cabecera de la venta
      const saleHeader = await tx.venta.create({
        data: {
          clienteId: clientId ? Number(clientId) : null,
          usuarioId: dbUser.id,
          total: totalAmount,
        },
        include: {
          cliente: true,
        },
      });

      // c. Crear detalles y descontar stock de cada ítem
      for (const item of verifiedItems) {
        // Crear detalle de venta
        await tx.detalleVenta.create({
          data: {
            ventaId: saleHeader.id,
            productoId: item.productId,
            cantidad: item.quantity,
            precioUnitario: item.priceUnit,
          },
        });

        // Decrementar el stock
        await tx.producto.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Registrar trazabilidad de salida de inventario
        await tx.movimientoInventario.create({
          data: {
            productoId: item.productId,
            tipoMovimiento: "Salida",
            cantidad: item.quantity,
            motivo: `Venta Factura #${saleHeader.id}`,
            usuarioId: dbUser.id,
          },
        });
      }

      return { saleHeader, verifiedItems };
    });

    res.status(201).json({
      id: String(result.saleHeader.id),
      clientId: result.saleHeader.clienteId ? String(result.saleHeader.clienteId) : undefined,
      clientName: result.saleHeader.cliente ? result.saleHeader.cliente.nombre : "Cliente General",
      sellerName: dbUser.empleado?.nombre || dbUser.usuario,
      date: result.saleHeader.fecha.toISOString(),
      total: Number(result.saleHeader.total),
      items: result.verifiedItems.map((item) => ({
        productId: String(item.productId),
        productName: item.name,
        productOem: item.oem,
        quantity: item.quantity,
        priceUnit: item.priceUnit,
        subtotal: item.quantity * item.priceUnit,
      })),
    });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message || "Error al procesar la venta." });
  }
});
