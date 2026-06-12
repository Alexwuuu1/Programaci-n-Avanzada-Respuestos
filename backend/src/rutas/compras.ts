import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaCompras = Router();

// 1. Listar pedidos de compra (compras)
rutaCompras.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.pedidoProveedor.findMany({
      include: {
        proveedor: true,
        usuario: {
          include: { empleado: true },
        },
        detalles: {
          include: { producto: true },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const mapped = list.map((c) => ({
      id: String(c.id),
      providerId: String(c.proveedorId),
      providerName: c.proveedor.nombre,
      buyerName: c.usuario.empleado?.nombre || c.usuario.usuario || "Sistema",
      date: c.fecha.toISOString(),
      status: c.estado, // "Pendiente", "Recibido", "Cancelado"
      total: Number(c.total),
      fechaEntregaEstimada: c.fechaEntregaEstimada ? c.fechaEntregaEstimada.toISOString() : undefined,
      fechaRecepcion: c.fechaRecepcion ? c.fechaRecepcion.toISOString() : undefined,
      nroReferencia: c.nroReferencia ?? undefined,
      observaciones: c.observaciones ?? undefined,
      items: c.detalles.map((d) => ({
        id: String(d.id),
        productId: String(d.productoId),
        productName: d.producto.nombre,
        productOem: d.producto.oem,
        quantity: d.cantidad,
        pricePurchase: Number(d.precioCompra),
        subtotal: d.cantidad * Number(d.precioCompra),
      })),
    }));

    res.json(mapped);
  } catch (e) {
    console.error("Error al obtener compras:", e);
    res.status(500).json({ error: "Error al obtener las compras a proveedores." });
  }
});

// 2. Crear pedido de compra pendiente
rutaCompras.post("/", async (req: Request, res: Response): Promise<void> => {
  const { providerId, items, username, fechaEntregaEstimada, nroReferencia, observaciones } = req.body;

  if (!providerId || !items || !Array.isArray(items) || items.length === 0 || !username) {
    res.status(400).json({ error: "Datos de compra incompletos (requiere proveedor, ítems y usuario)." });
    return;
  }

  try {
    // Buscar el usuario que registra la compra para asociar su id
    const dbUser = await prisma.usuario.findUnique({
      where: { usuario: username.toLowerCase().trim() },
    });

    if (!dbUser) {
      res.status(400).json({ error: "Comprador no registrado en el sistema." });
      return;
    }

    // Validar que el proveedor exista
    const dbProvider = await prisma.proveedor.findUnique({
      where: { id: Number(providerId) },
    });

    if (!dbProvider) {
      res.status(400).json({ error: "El proveedor especificado no existe." });
      return;
    }

    // Ejecutar transacción Prisma para registrar la compra pendiente de forma atómica
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const verifiedItems = [];

      // Validar que los productos existan y estructurar detalles
      for (const item of items) {
        const product = await tx.producto.findUnique({
          where: { id: Number(item.productId) },
        });

        if (!product) {
          throw new Error(`El repuesto con ID ${item.productId} no existe en catálogo.`);
        }

        const quantity = Number(item.quantity);
        const pricePurchase = Number(item.pricePurchase);

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`La cantidad para el producto "${product.nombre}" debe ser mayor a 0.`);
        }

        if (isNaN(pricePurchase) || pricePurchase < 0) {
          throw new Error(`El precio de compra para el producto "${product.nombre}" no puede ser negativo.`);
        }

        const itemTotal = quantity * pricePurchase;
        totalAmount += itemTotal;

        verifiedItems.push({
          productId: product.id,
          name: product.nombre,
          oem: product.oem,
          quantity,
          pricePurchase,
        });
      }

      // Crear cabecera del pedido de proveedor
      const purchaseHeader = await tx.pedidoProveedor.create({
        data: {
          proveedorId: Number(providerId),
          usuarioId: dbUser.id,
          total: totalAmount,
          estado: "Pendiente",
          ...(fechaEntregaEstimada && { fechaEntregaEstimada: new Date(fechaEntregaEstimada) }),
          ...(nroReferencia && { nroReferencia: String(nroReferencia) }),
          ...(observaciones && { observaciones: String(observaciones) }),
        },
      });

      // Crear detalles de la compra
      for (const item of verifiedItems) {
        await tx.detallePedidoProveedor.create({
          data: {
            pedidoId: purchaseHeader.id,
            productoId: item.productId,
            cantidad: item.quantity,
            precioCompra: item.pricePurchase,
          },
        });
      }

      return { purchaseHeader, verifiedItems };
    });

    res.status(201).json({
      id: String(result.purchaseHeader.id),
      providerId: String(result.purchaseHeader.proveedorId),
      providerName: dbProvider.nombre,
      buyerName: username,
      date: result.purchaseHeader.fecha.toISOString(),
      status: result.purchaseHeader.estado,
      total: Number(result.purchaseHeader.total),
      fechaEntregaEstimada: result.purchaseHeader.fechaEntregaEstimada ? result.purchaseHeader.fechaEntregaEstimada.toISOString() : undefined,
      fechaRecepcion: result.purchaseHeader.fechaRecepcion ? result.purchaseHeader.fechaRecepcion.toISOString() : undefined,
      nroReferencia: result.purchaseHeader.nroReferencia ?? undefined,
      observaciones: result.purchaseHeader.observaciones ?? undefined,
      items: result.verifiedItems.map((item) => ({
        productId: String(item.productId),
        productName: item.name,
        productOem: item.oem,
        quantity: item.quantity,
        pricePurchase: item.pricePurchase,
        subtotal: item.quantity * item.pricePurchase,
      })),
    });
  } catch (e: any) {
    console.error("Error al crear pedido de compra:", e);
    res.status(400).json({ error: e.message || "Error al procesar la compra." });
  }
});

// 3. Cambiar estado de pedido (Recibir o Cancelar)
rutaCompras.put("/:id/estado", async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const { status, username } = req.body; // status: "Recibido" o "Cancelado"

  if (!status || !["Recibido", "Cancelado"].includes(status)) {
    res.status(400).json({ error: "Estado inválido. Debe ser 'Recibido' o 'Cancelado'." });
    return;
  }

  if (!username) {
    res.status(400).json({ error: "El nombre de usuario es obligatorio para registrar el cambio." });
    return;
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID de compra inválido." });
    return;
  }

  try {
    // Buscar el usuario para la auditoría
    const dbUser = await prisma.usuario.findUnique({
      where: { usuario: username.toLowerCase().trim() },
    });

    if (!dbUser) {
      res.status(400).json({ error: "Usuario no registrado." });
      return;
    }

    // Ejecutar transacción Prisma para cambiar estado y actualizar stock/Kardex si aplica
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.pedidoProveedor.findUnique({
        where: { id },
        include: { detalles: { include: { producto: true } } },
      });

      if (!order) {
        throw new Error("El pedido a proveedor no existe.");
      }

      if (order.estado !== "Pendiente") {
        throw new Error(`El pedido ya se encuentra en estado "${order.estado}" y no puede modificarse.`);
      }

      // Actualizar cabecera del estado
      const updated = await tx.pedidoProveedor.update({
        where: { id },
        data: {
          estado: status,
          ...(status === "Recibido" && { fechaRecepcion: new Date() }),
        },
      });

      // Si el nuevo estado es "Recibido", actualizamos stock y Kardex
      if (status === "Recibido") {
        for (const detail of order.detalles) {
          // 1. Incrementar stock
          await tx.producto.update({
            where: { id: detail.productoId },
            data: {
              stock: {
                increment: detail.cantidad,
              },
            },
          });

          // 2. Registrar movimiento en Kardex (Entrada)
          await tx.movimientoInventario.create({
            data: {
              productoId: detail.productoId,
              tipoMovimiento: "Entrada",
              cantidad: detail.cantidad,
              motivo: `Compra Proveedor #${order.id}`,
              usuarioId: dbUser.id,
            },
          });
        }
      }

      return updated;
    });

    res.json({
      id: String(updatedOrder.id),
      status: updatedOrder.estado,
      message: `El pedido de compra fue marcado como ${status} exitosamente.`,
    });
  } catch (e: any) {
    console.error("Error al actualizar estado de compra:", e);
    res.status(400).json({ error: e.message || "Error al actualizar estado del pedido." });
  }
});
