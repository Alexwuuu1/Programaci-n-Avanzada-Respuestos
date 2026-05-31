import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaDashboard = Router();

// Obtener métricas agregadas del sistema
rutaDashboard.get("/kpis", async (req: Request, res: Response) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Ingresos por ventas de hoy
    const salesList = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });
    const totalSalesToday = salesList.reduce((sum, v) => sum + Number(v.total), 0);
    const transactionsCount = salesList.length;

    // 2. Estado de Inventarios (Total piezas y conteo categorías)
    const products = await prisma.producto.findMany();
    const stockTotal = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockAlerts = products.filter((p) => p.stock <= 5).length;
    const categoriesCount = await prisma.categoria.count();

    // 3. Órdenes de fabricación activas en planta
    const activeProduction = await prisma.ordenProduccion.count({
      where: {
        estado: {
          in: ["Pendiente", "En Proceso"],
        },
      },
    });

    // 4. Actividad Reciente del Taller (Ventas + Producción combinadas)
    const [recentSales, recentProduction] = await Promise.all([
      prisma.venta.findMany({
        take: 3,
        orderBy: { fecha: "desc" },
        include: { cliente: true },
      }),
      prisma.ordenProduccion.findMany({
        take: 3,
        orderBy: { fechaInicio: "desc" },
        include: { producto: true },
      }),
    ]);

    const activityFeed = [
      ...recentSales.map((s) => ({
        id: `v-${s.id}`,
        time: s.fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: s.fecha,
        title: "Nueva Venta Registrada",
        desc: `Facturado a ${s.cliente?.nombre || "Cliente General"} (Bs. ${Number(s.total)})`,
        border: "border-primary",
      })),
      ...recentProduction.map((p) => ({
        id: `p-${p.id}`,
        time: p.fechaInicio.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: p.fechaInicio,
        title: `Orden de Producción #${p.id} (${p.estado})`,
        desc: `Lote de ${p.cantidad} pzas del repuesto "${p.producto.nombre}"`,
        border: p.estado === "En Proceso" ? "border-primary animate-pulse" : "border-border",
      })),
    ];

    const sortedActivity = activityFeed
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map(({ id, time, title, desc, border }) => ({ id, time, title, desc, border }));

    res.json({
      salesToday: totalSalesToday,
      transactionsCount,
      stockTotal,
      lowStockAlerts,
      activeProduction,
      categoriesCount,
      recentActivity: sortedActivity,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al calcular las métricas del dashboard." });
  }
});
