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

    if (mapped.length > 0) {
      res.json(mapped);
      return;
    }

    const [ventas, compras, produccion] = await Promise.all([
      prisma.venta.findMany({
        where: { estado: { not: "Anulada" } },
        include: {
          detalles: { include: { producto: true } },
          usuario: { include: { empleado: true } },
        },
      }),
      prisma.pedidoProveedor.findMany({
        where: { estado: "Recibido" },
        include: {
          detalles: { include: { producto: true } },
          usuario: { include: { empleado: true } },
        },
      }),
      prisma.ordenProduccion.findMany({
        where: { estado: "Finalizado" },
        include: {
          producto: true,
          responsable: true,
        },
      }),
    ]);

    const fallback = [
      ...ventas.flatMap((v) =>
        v.detalles.map((d) => ({
          id: `venta-${v.id}-${d.id}`,
          productId: String(d.productoId),
          productName: d.producto.nombre,
          productOem: d.producto.oem,
          type: "Salida" as const,
          quantity: d.cantidad,
          date: v.fecha.toISOString(),
          reason: `Venta #${v.id}${v.nroFactura ? ` / Factura ${v.nroFactura}` : ""}`,
          responsibleName: v.usuario?.empleado?.nombre || v.usuario?.usuario || "Sistema",
        }))
      ),
      ...compras.flatMap((c) =>
        c.detalles.map((d) => ({
          id: `compra-${c.id}-${d.id}`,
          productId: String(d.productoId),
          productName: d.producto.nombre,
          productOem: d.producto.oem,
          type: "Entrada" as const,
          quantity: d.cantidad,
          date: (c.fechaRecepcion || c.fecha).toISOString(),
          reason: `Compra recibida #${c.id}${c.nroReferencia ? ` / Ref ${c.nroReferencia}` : ""}`,
          responsibleName: c.usuario?.empleado?.nombre || c.usuario?.usuario || "Sistema",
        }))
      ),
      ...produccion.map((o) => ({
        id: `produccion-${o.id}`,
        productId: String(o.productoId),
        productName: o.producto.nombre,
        productOem: o.producto.oem,
        type: "Entrada" as const,
        quantity: o.cantidadProducida || o.cantidad,
        date: (o.fechaFin || o.fechaInicio).toISOString(),
        reason: `Produccion finalizada #${o.id}`,
        responsibleName: o.responsable?.nombre || "Sistema",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(fallback);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener el historial de movimientos." });
  }
});

// Endpoint para consultas de stock del Agente Inteligente n8n
rutaInventario.get("/stock-query", async (req: Request, res: Response) => {
  try {
    const query = req.query.q ? String(req.query.q).trim() : "";

    const normalizeSearch = (value: string | null | undefined) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const stopWords = new Set([
      "busco",
      "buscar",
      "consulta",
      "consultar",
      "cotiza",
      "cotizar",
      "dame",
      "del",
      "el",
      "en",
      "hay",
      "la",
      "los",
      "me",
      "necesito",
      "para",
      "pieza",
      "precio",
      "que",
      "quiero",
      "repuesto",
      "stock",
      "tenes",
      "tienes",
      "una",
      "uno",
      "un",
      "valor",
      "vendes",
      "nos",
      "quedan",
      "queda",
      "disponibles",
      "disponible",
      "inventario",
      "sistema",
      "almacen",
      "ver",
      "mostrar",
      "lista",
      "listado",
      "catalogo",
      "productos",
      "producto",
      "tienen",
      "tiene",
      "como",
      "esta",
      "donde",
      "por",
      "favor",
      "si",
      "no",
    ]);

    const terms = normalizeSearch(query)
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 2 && !stopWords.has(term));

    const isAllQuery =
      terms.includes("__all__") ||
      terms.includes("__inventory_all__") ||
      terms.includes("inventario") ||
      terms.includes("catalogo") ||
      terms.includes("productos");

    if (
      !query ||
      terms.length === 0 ||
      terms.includes("__chat__") ||
      terms.includes("__help__") ||
      terms.includes("__dashboard__") ||
      terms.includes("__sales__") ||
      terms.includes("__finance__") ||
      terms.includes("__clients__") ||
      terms.includes("__purchases__") ||
      terms.includes("__production__") ||
      terms.includes("__employees__") ||
      terms.includes("__users__")
    ) {
      res.json({ repuestos: [], totalProductos: 0, totalUnidades: 0 });
      return;
    }

    const activeProducts = await prisma.producto.findMany({
      where: {
        estado: "Activo",
      },
      include: {
        categoria: true,
        proveedor: true,
      },
      take: 200,
    });

    const list = isAllQuery
      ? activeProducts
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 50)
      : terms.length
        ? activeProducts
          .map((p) => {
            const haystack = normalizeSearch([
              p.oem,
              p.nombre,
              p.marca,
              p.compatibilidad,
              p.categoria.nombre,
              p.proveedor?.nombre,
            ].join(" "));
            const score = terms.reduce((sum, term) => {
              const termSingular = (term.endsWith("s") && term.length > 3) ? term.slice(0, -1) : term;
              const hasMatch = haystack.includes(term) || haystack.includes(termSingular);
              return sum + (hasMatch ? 1 : 0);
            }, 0);
            return { product: p, score };
          })
          .filter(({ score }) => score >= Math.min(terms.length, 2))
          .sort((a, b) => b.score - a.score || b.product.stock - a.product.stock)
          .slice(0, 20)
          .map(({ product }) => product)
        : [];

    const mapped = list.map((p) => ({
      oem: p.oem,
      nombre: p.nombre,
      marca: p.marca || "Sin Marca",
      categoria: p.categoria.nombre,
      precio: Number(p.precio),
      precioCompra: p.precioCompra ? Number(p.precioCompra) : null,
      stock: p.stock,
      stockMinimo: p.stockMinimo,
      ubicacion: p.ubicacion || "Sin ubicación registrada",
      compatibilidad: p.compatibilidad,
      proveedor: p.proveedor?.nombre || "Sin proveedor",
      estadoStock: p.stock === 0 ? "Agotado" : p.stock <= p.stockMinimo ? "Crítico" : "Óptimo",
    }));

    res.json({
      repuestos: mapped,
      totalProductos: activeProducts.length,
      totalUnidades: activeProducts.reduce((sum, p) => sum + p.stock, 0),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al realizar la consulta de stock." });
  }
});
