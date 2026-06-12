import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaProveedores = Router();

// Helper: map Proveedor entity to API response shape
function mapProveedor(p: {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  nit: string | null;
  email: string | null;
  telefonoSecundario: string | null;
  contactoPrincipal: string | null;
  condicionesPago: string | null;
  calificacion: number | null;
  notas: string | null;
  estado: string;
  creadoEn: Date;
}) {
  return {
    id: String(p.id),
    name: p.nombre,
    phone: p.telefono || "",
    address: p.direccion || "",
    nit: p.nit || "",
    email: p.email || "",
    secondaryPhone: p.telefonoSecundario || "",
    mainContact: p.contactoPrincipal || "",
    paymentTerms: p.condicionesPago || "",
    rating: p.calificacion,
    notes: p.notas || "",
    status: p.estado,
    createdAt: p.creadoEn,
  };
}

// 1. Listar proveedores
rutaProveedores.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.proveedor.findMany({
      orderBy: { nombre: "asc" },
    });

    const mapped = list.map(mapProveedor);

    res.json(mapped);
  } catch (e) {
    console.error("Error al listar proveedores:", e);
    res.status(500).json({ error: "Error al listar proveedores." });
  }
});

// 2. Crear proveedor
rutaProveedores.post("/", async (req: Request, res: Response): Promise<void> => {
  const {
    name, phone, address,
    nit, email, secondaryPhone, mainContact, paymentTerms, rating, notes, status,
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "El nombre del proveedor es obligatorio." });
    return;
  }

  if (!phone || !phone.trim()) {
    res.status(400).json({ error: "El teléfono del proveedor es obligatorio." });
    return;
  }

  try {
    // Validar nombre único
    const exist = await prisma.proveedor.findUnique({
      where: { nombre: name.trim() },
    });

    if (exist) {
      res.status(400).json({ error: "Ya existe un proveedor con ese nombre." });
      return;
    }

    const created = await prisma.proveedor.create({
      data: {
        nombre: name.trim(),
        telefono: phone.trim(),
        direccion: address ? address.trim() : null,
        nit: nit ? nit.trim() : null,
        email: email ? email.trim() : null,
        telefonoSecundario: secondaryPhone ? secondaryPhone.trim() : null,
        contactoPrincipal: mainContact ? mainContact.trim() : null,
        condicionesPago: paymentTerms ? paymentTerms.trim() : null,
        calificacion: rating !== undefined && rating !== null ? Number(rating) : null,
        notas: notes ? notes.trim() : null,
        estado: status ? status.trim() : "Activo",
      },
    });

    res.status(201).json(mapProveedor(created));
  } catch (e) {
    console.error("Error al registrar proveedor:", e);
    res.status(500).json({ error: "Error al registrar el proveedor." });
  }
});

// 3. Editar proveedor
rutaProveedores.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const {
    name, phone, address,
    nit, email, secondaryPhone, mainContact, paymentTerms, rating, notes, status,
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "El nombre del proveedor es obligatorio." });
    return;
  }

  if (!phone || !phone.trim()) {
    res.status(400).json({ error: "El teléfono del proveedor es obligatorio." });
    return;
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID de proveedor inválido." });
    return;
  }

  try {
    // Validar nombre único excluyendo el actual
    const exist = await prisma.proveedor.findFirst({
      where: {
        nombre: name.trim(),
        id: { not: id },
      },
    });

    if (exist) {
      res.status(400).json({ error: "Ya existe otro proveedor con ese nombre." });
      return;
    }

    const updated = await prisma.proveedor.update({
      where: { id },
      data: {
        nombre: name.trim(),
        telefono: phone.trim(),
        direccion: address ? address.trim() : null,
        nit: nit ? nit.trim() : null,
        email: email ? email.trim() : null,
        telefonoSecundario: secondaryPhone ? secondaryPhone.trim() : null,
        contactoPrincipal: mainContact ? mainContact.trim() : null,
        condicionesPago: paymentTerms ? paymentTerms.trim() : null,
        calificacion: rating !== undefined && rating !== null ? Number(rating) : null,
        notas: notes ? notes.trim() : null,
        ...(status !== undefined && { estado: status.trim() }),
      },
    });

    res.json(mapProveedor(updated));
  } catch (e) {
    console.error("Error al editar proveedor:", e);
    res.status(500).json({ error: "Error al editar el proveedor." });
  }
});

// 4. Toggle estado (activar / desactivar)
rutaProveedores.patch("/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID de proveedor inválido." });
    return;
  }

  try {
    const current = await prisma.proveedor.findUnique({ where: { id } });

    if (!current) {
      res.status(404).json({ error: "Proveedor no encontrado." });
      return;
    }

    const newStatus = current.estado === "Activo" ? "Inactivo" : "Activo";

    const updated = await prisma.proveedor.update({
      where: { id },
      data: { estado: newStatus },
    });

    res.json(mapProveedor(updated));
  } catch (e) {
    console.error("Error al cambiar estado del proveedor:", e);
    res.status(500).json({ error: "Error al cambiar el estado del proveedor." });
  }
});

// 5. Eliminar proveedor
rutaProveedores.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID de proveedor inválido." });
    return;
  }

  try {
    // Verificar si tiene compras asociadas
    const comprasCount = await prisma.pedidoProveedor.count({
      where: { proveedorId: id },
    });

    if (comprasCount > 0) {
      res.status(400).json({
        error: "No se puede eliminar el proveedor porque tiene pedidos de compra asociados.",
      });
      return;
    }

    await prisma.proveedor.delete({
      where: { id },
    });

    res.json({ success: true, message: "Proveedor eliminado exitosamente." });
  } catch (e) {
    console.error("Error al eliminar proveedor:", e);
    res.status(500).json({ error: "Error al eliminar el proveedor." });
  }
});
