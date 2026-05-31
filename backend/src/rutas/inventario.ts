import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaInventario = Router();

// Listar movimientos de inventario (Kardex)
rutaInventario.get("/movimientos", async (req: Request, res: Response) => {
  try {
    const list = await prisma.movimientoInventario.findMany({
      include: {
        producto: true,
        usuario: {
          include: { empleado: true },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    const mapped = list.map((m) => ({
      id: String(m.id),
      productId: String(m.productoId),
      productName: m.producto.nombre,
      productOem: m.producto.oem,
      type: m.tipoMovimiento as "Entrada" | "Salida" | "Ajuste",
      quantity: m.cantidad,
      date: m.fecha.toISOString(),
      reason: m.motivo,
      responsibleName: m.usuario?.empleado?.nombre || m.usuario?.usuario || "Sistema (Automático)",
    }));

    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener el historial de movimientos." });
  }
});
