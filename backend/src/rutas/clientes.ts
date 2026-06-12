import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaClientes = Router();

/** Helper: map a Prisma Cliente + ventas to the API response shape */
function mapCliente(
  c: {
    id: number;
    nombre: string;
    telefono: string | null;
    direccion: string | null;
    nit: string | null;
    email: string | null;
    tipo: string;
    vehiculos: string | null;
    nivelFidelidad: string;
    descuentoPorcentaje: unknown;
    limiteCredito: unknown;
    notas: string | null;
    estado: string;
    creadoEn: Date;
    ventas?: { id: number; fecha: Date; total: unknown; metodoPago: string; abonos?: { monto: unknown }[] }[];
  },
) {
  const ventas = c.ventas ?? [];
  const totalSpent = ventas.reduce((acc, v) => acc + Number(v.total), 0);
  const purchaseHistory = ventas.map((v) => ({
    id: String(v.id),
    date: v.fecha.toISOString(),
    total: Number(v.total),
  }));

  const saldoDeudor = ventas.reduce((acc: number, v) => {
    if (v.metodoPago !== "Credito") return acc;
    const totalAbonado = (v.abonos ?? []).reduce((aSum: number, ab) => aSum + Number(ab.monto), 0);
    const pendiente = Number(v.total) - totalAbonado;
    return acc + Math.max(0, pendiente);
  }, 0);

  return {
    id: String(c.id),
    name: c.nombre,
    phone: c.telefono || "",
    address: c.direccion || "",
    nit: c.nit,
    email: c.email,
    tipo: c.tipo,
    vehiculos: c.vehiculos,
    nivelFidelidad: c.nivelFidelidad,
    descuentoPorcentaje: c.descuentoPorcentaje != null ? Number(c.descuentoPorcentaje) : null,
    limiteCredito: c.limiteCredito != null ? Number(c.limiteCredito) : null,
    notas: c.notas,
    estado: c.estado,
    creadoEn: c.creadoEn,
    salesCount: ventas.length,
    totalSpent,
    purchaseHistory,
    saldoDeudor,
  };
}

// 1. Listar clientes con datos CRM (compras, total gastado e historial)
rutaClientes.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.cliente.findMany({
      include: {
        ventas: {
          include: {
            abonos: true,
            detalles: {
              include: { producto: true },
            },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    const mapped = list.map((c) => mapCliente(c));

    res.json(mapped);
  } catch (e) {
    console.error("Error al listar clientes CRM:", e);
    res.status(500).json({ error: "Error al listar los clientes." });
  }
});

// 2. Crear cliente
rutaClientes.post("/", async (req: Request, res: Response): Promise<void> => {
  const {
    name, phone, address,
    nit, email, tipo, vehiculos,
    nivelFidelidad, descuentoPorcentaje, limiteCredito, notas, estado,
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "El nombre del cliente es obligatorio." });
    return;
  }

  try {
    const created = await prisma.cliente.create({
      data: {
        nombre: name.trim(),
        telefono: phone ? phone.trim() : null,
        direccion: address ? address.trim() : null,
        ...(nit != null && { nit: nit.trim() }),
        ...(email != null && { email: email.trim() }),
        ...(tipo != null && { tipo: tipo.trim() }),
        ...(vehiculos != null && { vehiculos: vehiculos.trim() }),
        ...(nivelFidelidad != null && { nivelFidelidad: nivelFidelidad.trim() }),
        ...(descuentoPorcentaje != null && { descuentoPorcentaje }),
        ...(limiteCredito != null && { limiteCredito }),
        ...(notas != null && { notas: notas.trim() }),
        ...(estado != null && { estado: estado.trim() }),
      },
    });

    res.status(201).json(mapCliente({ ...created, ventas: [] }));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar el cliente." });
  }
});

// 3. Editar cliente
rutaClientes.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const {
    name, phone, address,
    nit, email, tipo, vehiculos,
    nivelFidelidad, descuentoPorcentaje, limiteCredito, notas, estado,
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "El nombre del cliente es obligatorio." });
    return;
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID de cliente inválido." });
    return;
  }

  try {
    const updated = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: name.trim(),
        telefono: phone ? phone.trim() : null,
        direccion: address ? address.trim() : null,
        nit: nit != null ? nit.trim() : null,
        email: email != null ? email.trim() : null,
        ...(tipo != null && { tipo: tipo.trim() }),
        vehiculos: vehiculos != null ? vehiculos.trim() : null,
        ...(nivelFidelidad != null && { nivelFidelidad: nivelFidelidad.trim() }),
        descuentoPorcentaje: descuentoPorcentaje != null ? descuentoPorcentaje : null,
        limiteCredito: limiteCredito != null ? limiteCredito : null,
        notas: notas != null ? notas.trim() : null,
        ...(estado != null && { estado: estado.trim() }),
      },
    });

    // Traer la información con ventas para mantener la estructura CRM del frontend
    const fullClient = await prisma.cliente.findUnique({
      where: { id: updated.id },
      include: {
        ventas: true,
      },
    });

    if (!fullClient) {
      res.status(404).json({ error: "Cliente no encontrado." });
      return;
    }

    res.json(mapCliente(fullClient));
  } catch (e) {
    console.error("Error al actualizar cliente:", e);
    res.status(500).json({ error: "Error al actualizar el cliente." });
  }
});

// 4. Eliminar cliente (Protegido por integridad referencial)
rutaClientes.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID de cliente inválido." });
    return;
  }

  try {
    // Validar si tiene ventas
    const salesCount = await prisma.venta.count({
      where: { clienteId: id },
    });

    if (salesCount > 0) {
      res.status(400).json({
        error: "No se puede eliminar el cliente porque tiene historial de ventas asociado.",
      });
      return;
    }

    await prisma.cliente.delete({
      where: { id },
    });

    res.json({ success: true, message: "Cliente eliminado exitosamente." });
  } catch (e) {
    console.error("Error al eliminar cliente:", e);
    res.status(500).json({ error: "Error al eliminar el cliente." });
  }
});
