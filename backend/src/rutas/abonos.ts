import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaAbonos = Router();

// 1. Registrar un nuevo abono a una venta a crédito
rutaAbonos.post("/", async (req: Request, res: Response): Promise<void> => {
  const { ventaId, monto, metodoPago, comprobante, notas } = req.body;

  if (!ventaId || !monto || Number(monto) <= 0 || !metodoPago) {
    res.status(400).json({ error: "Datos de abono incompletos o inválidos (requiere ventaId, monto > 0 y metodoPago)." });
    return;
  }

  try {
    const vId = Number(ventaId);

    // Buscar la venta
    const dbVenta = await prisma.venta.findUnique({
      where: { id: vId },
      include: { abonos: true },
    });

    if (!dbVenta) {
      res.status(404).json({ error: "La venta especificada no existe." });
      return;
    }

    if (dbVenta.metodoPago !== "Credito") {
      res.status(400).json({ error: "Esta venta no fue registrada con método de pago a Crédito." });
      return;
    }

    if (dbVenta.estado === "Anulada") {
      res.status(400).json({ error: "No se pueden registrar abonos a una venta anulada." });
      return;
    }

    // Calcular saldo pendiente
    const totalAbonado = dbVenta.abonos.reduce((sum, a) => sum + Number(a.monto), 0);
    const totalVenta = Number(dbVenta.total);
    const saldoPendiente = totalVenta - totalAbonado;

    const montoAbono = Number(monto);
    if (montoAbono > saldoPendiente + 0.01) { // tolerar pequeñas diferencias de decimales
      res.status(400).json({ error: `El monto a abonar (${montoAbono} Bs.) supera el saldo pendiente (${saldoPendiente.toFixed(2)} Bs.).` });
      return;
    }

    // Crear el abono
    const created = await prisma.abonoCredito.create({
      data: {
        ventaId: vId,
        monto: montoAbono,
        metodoPago: String(metodoPago),
        comprobante: comprobante ? String(comprobante) : null,
        notas: notas ? String(notas) : null,
      },
    });

    res.status(201).json({
      id: String(created.id),
      ventaId: String(created.ventaId),
      monto: Number(created.monto),
      fecha: created.fecha.toISOString(),
      metodoPago: created.metodoPago,
      comprobante: created.comprobante ?? undefined,
      notas: created.notas ?? undefined,
      saldoRestante: Math.max(0, saldoPendiente - montoAbono),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar el abono." });
  }
});

// 2. Obtener estado de cuenta de un cliente
rutaAbonos.get("/cliente/:clienteId", async (req: Request, res: Response): Promise<void> => {
  const { clienteId } = req.params;

  try {
    const cId = Number(clienteId);

    const client = await prisma.cliente.findUnique({
      where: { id: cId },
    });

    if (!client) {
      res.status(404).json({ error: "Cliente no encontrado." });
      return;
    }

    // Buscar todas las ventas a crédito asociadas al cliente (completadas)
    const ventasCredito = await prisma.venta.findMany({
      where: {
        clienteId: cId,
        metodoPago: "Credito",
        estado: "Completada",
      },
      include: {
        abonos: true,
      },
      orderBy: {
        fecha: "desc",
      },
    });

    // Calcular estado de cuenta
    let deudaConsolidada = 0;
    const facturasPendientes = [];
    const historialAbonos = [];

    for (const v of ventasCredito) {
      const totalVenta = Number(v.total);
      const totalAbonado = v.abonos.reduce((sum, a) => sum + Number(a.monto), 0);
      const saldoPendiente = totalVenta - totalAbonado;

      deudaConsolidada += saldoPendiente;

      facturasPendientes.push({
        id: String(v.id),
        fecha: v.fecha.toISOString(),
        total: totalVenta,
        saldoPendiente: Math.max(0, saldoPendiente),
        nroFactura: v.nroFactura ?? undefined,
        estado: v.estado,
        estaPagada: saldoPendiente <= 0.01,
      });

      for (const a of v.abonos) {
        historialAbonos.push({
          id: String(a.id),
          ventaId: String(a.ventaId),
          fecha: a.fecha.toISOString(),
          monto: Number(a.monto),
          metodoPago: a.metodoPago,
          comprobante: a.comprobante ?? undefined,
          notas: a.notas ?? undefined,
        });
      }
    }

    // Ordenar historial de abonos por fecha descendente
    historialAbonos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    res.json({
      clienteId: String(client.id),
      nombreCliente: client.nombre,
      deudaConsolidada: Math.max(0, deudaConsolidada),
      limiteCredito: client.limiteCredito != null ? Number(client.limiteCredito) : null,
      facturas: facturasPendientes,
      abonos: historialAbonos,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener el estado de cuenta del cliente." });
  }
});
