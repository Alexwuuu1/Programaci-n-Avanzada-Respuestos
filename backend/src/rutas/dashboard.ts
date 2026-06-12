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

    // 1. Ingresos por ventas de hoy (Solo Completadas)
    const salesList = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: startOfToday,
          lte: endOfToday,
        },
        estado: "Completada",
      },
      include: {
        detalles: {
          include: { producto: true },
        },
      },
    });

    const totalSalesToday = salesList.reduce((sum: number, v) => sum + Number(v.total), 0);
    const transactionsCount = salesList.length;

    // Calcular ganancia neta de hoy (Ingresos - Costos de compra de repuestos vendidos)
    const totalProfitToday = salesList.reduce((sum: number, v) => {
      const cost = v.detalles.reduce(
        (cSum: number, d) => cSum + d.cantidad * Number(d.producto.precioCompra || 0),
        0
      );
      return sum + (Number(v.total) - cost);
    }, 0);

    // 2. Estado de Inventarios (Total piezas y alertas dinámicas)
    const products = await prisma.producto.findMany({
      include: { proveedor: true },
    });
    const stockTotal = products.reduce((sum: number, p) => sum + p.stock, 0);
    
    // Alerta dinámica basada en el stockMinimo individual de cada producto
    const lowStockProducts = products.filter((p) => p.stock <= p.stockMinimo);
    const lowStockAlerts = lowStockProducts.length;
    const categoriesCount = await prisma.categoria.count();

    // Agrupar reposiciones sugeridas por proveedor
    const groupedReplenishments: Record<
      string,
      {
        providerId: string | null;
        providerName: string;
        items: Array<{
          id: string;
          name: string;
          oem: string;
          stock: number;
          minStock: number;
          suggestedReplenish: number;
        }>;
      }
    > = {};

    lowStockProducts.forEach((p) => {
      const providerKey = p.proveedorId ? String(p.proveedorId) : "sin-proveedor";
      const providerName = p.proveedor ? p.proveedor.nombre : "Sin Proveedor Asignado";

      if (!groupedReplenishments[providerKey]) {
        groupedReplenishments[providerKey] = {
          providerId: p.proveedorId ? String(p.proveedorId) : null,
          providerName,
          items: [],
        };
      }

      groupedReplenishments[providerKey].items.push({
        id: String(p.id),
        name: p.nombre,
        oem: p.oem,
        stock: p.stock,
        minStock: p.stockMinimo,
        suggestedReplenish: Math.max(1, p.stockMinimo - p.stock),
      });
    });

    const replenishments = Object.values(groupedReplenishments);

    // Identificar repuestos con costo de compra sin configurar (precioCompra es nulo o 0)
    const productsNoCost = products
      .filter((p) => p.precioCompra === null || Number(p.precioCompra) === 0)
      .map((p) => ({
        id: String(p.id),
        name: p.nombre,
        oem: p.oem,
        price: Number(p.precio),
      }));

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
        title: s.estado === "Anulada" ? "Venta Anulada" : "Nueva Venta Registrada",
        desc: `Facturado a ${s.cliente?.nombre || "Cliente General"} (Bs. ${Number(s.total)})`,
        border: s.estado === "Anulada" ? "border-red-500" : "border-primary",
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

    // 5. Historial de los últimos 7 días (Gráfico Lineal)
    const last7Days: Array<{ label: string; ingresos: number; ganancias: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - i);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - i);
      dEnd.setHours(23, 59, 59, 999);

      const salesDay = await prisma.venta.findMany({
        where: {
          fecha: { gte: dStart, lte: dEnd },
          estado: "Completada",
        },
        include: {
          detalles: {
            include: { producto: true },
          },
        },
      });

      const ingresos = salesDay.reduce((sum: number, v) => sum + Number(v.total), 0);
      const ganancias = salesDay.reduce((sum: number, v) => {
        const cost = v.detalles.reduce(
          (cSum: number, d) => cSum + d.cantidad * Number(d.producto.precioCompra || 0),
          0
        );
        return sum + (Number(v.total) - cost);
      }, 0);

      const label = dStart.toLocaleDateString("es-BO", { weekday: "short", day: "numeric" });
      last7Days.push({ label, ingresos, ganancias });
    }

    // 6. Distribución de Métodos de Pago en los últimos 30 días (Gráfico de Barras)
    const paymentDistribution = { Efectivo: 0, Tarjeta: 0, QR: 0, Transferencia: 0, Credito: 0 } as Record<string, number>;
    const salesPayment = await prisma.venta.findMany({
      where: {
        estado: "Completada",
        fecha: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        },
      },
    });

    salesPayment.forEach((s) => {
      const key = s.metodoPago;
      if (paymentDistribution[key] !== undefined) {
        paymentDistribution[key] += Number(s.total);
      }
    });

    // 7. Repuestos más vendidos (Top 5)
    const topProductsRaw = await prisma.detalleVenta.groupBy({
      by: ['productoId'],
      _sum: {
        cantidad: true,
      },
      where: {
        venta: {
          estado: "Completada",
        },
      },
      orderBy: {
        _sum: {
          cantidad: "desc",
        },
      },
      take: 5,
    });

    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const prod = await prisma.producto.findUnique({
          where: { id: item.productoId },
          include: { categoria: true },
        });
        return {
          id: String(item.productoId),
          name: prod ? prod.nombre : "Desconocido",
          oem: prod ? prod.oem : "N/A",
          categoryName: prod ? prod.categoria.nombre : "Sin Categoría",
          quantitySold: item._sum.cantidad ?? 0,
          revenue: (item._sum.cantidad ?? 0) * Number(prod?.precio ?? 0),
        };
      })
    );

    res.json({
      salesToday: totalSalesToday,
      profitToday: totalProfitToday,
      transactionsCount,
      stockTotal,
      lowStockAlerts,
      activeProduction,
      categoriesCount,
      recentActivity: sortedActivity,
      last7Days,
      paymentDistribution,
      replenishments,
      productsNoCost,
      topProducts,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al calcular las métricas del dashboard." });
  }
});

