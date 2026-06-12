import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaProduccion = Router();

// 1. Listar órdenes de producción
rutaProduccion.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.ordenProduccion.findMany({
      include: {
        producto: true,
        responsable: true,
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    const mapped = list.map((o) => ({
      id: String(o.id),
      productId: String(o.productoId),
      productName: o.producto.nombre,
      productOem: o.producto.oem,
      quantity: o.cantidad,
      startDate: o.fechaInicio.toISOString(),
      endDate: o.fechaFin ? o.fechaFin.toISOString() : undefined,
      status: o.estado as "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado",
      responsibleId: o.responsableId ? String(o.responsableId) : undefined,
      responsibleName: o.responsable ? o.responsable.nombre : "Sin Asignar",
      cantidadProducida: o.cantidadProducida ?? undefined,
      prioridad: o.prioridad,
      costoProduccion: o.costoProduccion != null ? Number(o.costoProduccion) : undefined,
      observaciones: o.observaciones ?? undefined,
    }));

    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar las órdenes de producción." });
  }
});

// 2. Crear nueva orden de producción
rutaProduccion.post("/", async (req: Request, res: Response): Promise<void> => {
  const { productId, quantity, responsibleId, prioridad, costoProduccion, observaciones } = req.body;

  if (!productId || !quantity || Number(quantity) <= 0) {
    res.status(400).json({ error: "Datos de orden incompletos o inválidos." });
    return;
  }

  try {
    const created = await prisma.ordenProduccion.create({
      data: {
        productoId: Number(productId),
        cantidad: Number(quantity),
        responsableId: responsibleId ? Number(responsibleId) : null,
        estado: "Pendiente",
        ...(prioridad && { prioridad: String(prioridad) }),
        ...(costoProduccion != null && { costoProduccion: Number(costoProduccion) }),
        ...(observaciones && { observaciones: String(observaciones) }),
      },
      include: {
        producto: true,
        responsable: true,
      },
    });

    res.status(201).json({
      id: String(created.id),
      productId: String(created.productoId),
      productName: created.producto.nombre,
      productOem: created.producto.oem,
      quantity: created.cantidad,
      startDate: created.fechaInicio.toISOString(),
      endDate: undefined,
      status: "Pendiente",
      responsibleId: created.responsableId ? String(created.responsableId) : undefined,
      responsibleName: created.responsable ? created.responsable.nombre : "Sin Asignar",
      cantidadProducida: created.cantidadProducida ?? undefined,
      prioridad: created.prioridad,
      costoProduccion: created.costoProduccion != null ? Number(created.costoProduccion) : undefined,
      observaciones: created.observaciones ?? undefined,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al crear la orden de producción." });
  }
});

// 3. Actualizar estado de una orden (Flujo con transacción Prisma)
rutaProduccion.put("/:id/estado", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, cantidadProducida } = req.body;

  const validStatuses = ["Pendiente", "En Proceso", "Finalizado", "Cancelado"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Estado no válido." });
    return;
  }

  try {
    // Buscar la orden actual
    const currentOrder = await prisma.ordenProduccion.findUnique({
      where: { id: Number(id) },
      include: { producto: true },
    });

    if (!currentOrder) {
      res.status(404).json({ error: "Orden de producción no encontrada." });
      return;
    }

    // Bloquear cambios si ya está terminada o cancelada
    if (currentOrder.estado === "Finalizado" || currentOrder.estado === "Cancelado") {
      res.status(400).json({ error: "No se puede modificar una orden que ya fue finalizada o cancelada." });
      return;
    }

    let updatedOrder;

    if (status === "Finalizado") {
      // PROCESO TRANSACCIONAL: Finalizar orden + Incrementar stock + Registrar movimiento
      updatedOrder = await prisma.$transaction(async (tx) => {
        // a. Cambiar estado de la orden
        const order = await tx.ordenProduccion.update({
          where: { id: Number(id) },
          data: {
            estado: "Finalizado",
            fechaFin: new Date(),
            ...(cantidadProducida != null && { cantidadProducida: Number(cantidadProducida) }),
          },
          include: {
            producto: true,
            responsable: true,
          },
        });

        // Cantidad real fabricada (fallback a planeada si no se indica)
        const finalQty = order.cantidadProducida != null ? order.cantidadProducida : order.cantidad;

        // b. Incrementar el stock del repuesto con la cantidad REAL producida
        await tx.producto.update({
          where: { id: order.productoId },
          data: {
            stock: {
              increment: finalQty,
            },
          },
        });

        // c. Registrar movimiento de trazabilidad con la cantidad REAL
        await tx.movimientoInventario.create({
          data: {
            productoId: order.productoId,
            tipoMovimiento: "Entrada",
            cantidad: finalQty,
            motivo: `Producción Orden #${order.id}`,
            usuarioId: null, // Sistema / Automático
          },
        });

        return order;
      });
    } else if (status === "Cancelado") {
      // Cancelar orden
      updatedOrder = await prisma.ordenProduccion.update({
        where: { id: Number(id) },
        data: {
          estado: "Cancelado",
          fechaFin: new Date(),
        },
        include: {
          producto: true,
          responsable: true,
        },
      });
    } else {
      // Pasar a En Proceso o Pendiente
      updatedOrder = await prisma.ordenProduccion.update({
        where: { id: Number(id) },
        data: {
          estado: status,
        },
        include: {
          producto: true,
          responsable: true,
        },
      });
    }

    res.json({
      id: String(updatedOrder.id),
      productId: String(updatedOrder.productoId),
      productName: updatedOrder.producto.nombre,
      productOem: updatedOrder.producto.oem,
      quantity: updatedOrder.cantidad,
      startDate: updatedOrder.fechaInicio.toISOString(),
      endDate: updatedOrder.fechaFin ? updatedOrder.fechaFin.toISOString() : undefined,
      status: updatedOrder.estado as "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado",
      responsibleId: updatedOrder.responsableId ? String(updatedOrder.responsableId) : undefined,
      responsibleName: updatedOrder.responsable ? updatedOrder.responsable.nombre : "Sin Asignar",
      cantidadProducida: updatedOrder.cantidadProducida ?? undefined,
      prioridad: updatedOrder.prioridad,
      costoProduccion: updatedOrder.costoProduccion != null ? Number(updatedOrder.costoProduccion) : undefined,
      observaciones: updatedOrder.observaciones ?? undefined,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar el estado de la orden." });
  }
});
