import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaFinanzas = Router();

// 1. Obtener consolidado del flujo de caja de los últimos 30 días
rutaFinanzas.get("/flujo-caja", async (req: Request, res: Response) => {
  try {
    const datesLimit = new Date();
    datesLimit.setDate(datesLimit.getDate() - 30);
    datesLimit.setHours(0, 0, 0, 0);

    // a. Obtener todas las ventas al contado completadas en los últimos 30 días
    const sales = await prisma.venta.findMany({
      where: {
        estado: "Completada",
        metodoPago: { not: "Credito" },
        fecha: { gte: datesLimit },
      },
    });

    // b. Obtener todos los abonos en los últimos 30 días
    const abonos = await prisma.abonoCredito.findMany({
      where: {
        fecha: { gte: datesLimit },
      },
    });

    // c. Obtener todas las compras a proveedores recibidas en los últimos 30 días
    const purchases = await prisma.pedidoProveedor.findMany({
      where: {
        estado: "Recibido",
        OR: [
          { fechaRecepcion: { gte: datesLimit } },
          { AND: [{ fechaRecepcion: null }, { fecha: { gte: datesLimit } }] }
        ]
      },
    });

    // d. Agrupar por día (año-mes-día)
    const dailyData: Record<string, { label: string; inflows: number; outflows: number }> = {};

    // Inicializar los últimos 30 días
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString("es-BO", { day: "numeric", month: "short" });
      dailyData[key] = { label, inflows: 0, outflows: 0 };
    }

    // Sumar ingresos por ventas al contado
    sales.forEach((s) => {
      const key = s.fecha.toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].inflows += Number(s.total);
      }
    });

    // Sumar ingresos por abonos de créditos
    abonos.forEach((a) => {
      const key = a.fecha.toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].inflows += Number(a.monto);
      }
    });

    // Sumar egresos por compras recibidas
    purchases.forEach((p) => {
      const dateToUse = p.fechaRecepcion || p.fecha;
      const key = dateToUse.toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].outflows += Number(p.total);
      }
    });

    const flowHistory = Object.values(dailyData);

    // Calcular KPIs agregados totales (de todos los tiempos o últimos 30 días)
    const [allSalesCount, allSalesSumRaw] = await Promise.all([
      prisma.venta.count({ where: { estado: "Completada" } }),
      prisma.venta.aggregate({
        where: { estado: "Completada" },
        _sum: { total: true }
      })
    ]);

    const [allAbonosSumRaw, allPurchasesSumRaw] = await Promise.all([
      prisma.abonoCredito.aggregate({
        _sum: { monto: true }
      }),
      prisma.pedidoProveedor.aggregate({
        where: { estado: "Recibido" },
        _sum: { total: true }
      })
    ]);

    const allSalesSum = Number(allSalesSumRaw._sum.total || 0);
    const allAbonosSum = Number(allAbonosSumRaw._sum.monto || 0);
    const allPurchasesSum = Number(allPurchasesSumRaw._sum.total || 0);

    // Calcular total de créditos otorgados (ventas a crédito pendientes de cobrar)
    const creditSalesSumRaw = await prisma.venta.aggregate({
      where: {
        estado: "Completada",
        metodoPago: "Credito"
      },
      _sum: { total: true }
    });
    const totalCreditGranted = Number(creditSalesSumRaw._sum.total || 0);
    const totalPendingCobro = Math.max(0, totalCreditGranted - allAbonosSum);

    // Caja real en mano = Ventas Contado + Abonos Recibidos - Compras Pagadas
    const totalVentasContado = allSalesSum - totalCreditGranted;
    const cashInHand = Math.max(0, totalVentasContado + allAbonosSum - allPurchasesSum);

    res.json({
      flowHistory,
      summary: {
        totalInflows: totalVentasContado + allAbonosSum,
        totalOutflows: allPurchasesSum,
        cashInHand,
        totalPendingCobro,
        allSalesCount,
      }
    });
  } catch (e) {
    console.error("Error al calcular flujo de caja:", e);
    res.status(500).json({ error: "Error al calcular el flujo de caja." });
  }
});

// 2. Obtener historial detallado de abonos
rutaFinanzas.get("/abonos", async (req: Request, res: Response) => {
  try {
    const list = await prisma.abonoCredito.findMany({
      include: {
        venta: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const mapped = list.map((a) => ({
      id: a.id,
      ventaId: a.ventaId,
      monto: Number(a.monto),
      fecha: a.fecha.toISOString(),
      metodoPago: a.metodoPago,
      comprobante: a.comprobante ?? undefined,
      notas: a.notas ?? undefined,
      clienteId: a.venta.cliente ? String(a.venta.cliente.id) : undefined,
      clienteNombre: a.venta.cliente ? a.venta.cliente.nombre : "Cliente General",
    }));

    res.json(mapped);
  } catch (e) {
    console.error("Error al obtener lista de abonos:", e);
    res.status(500).json({ error: "Error al listar los abonos financieros." });
  }
});
