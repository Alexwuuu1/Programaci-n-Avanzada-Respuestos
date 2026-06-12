import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaEmpleados = Router();

/** Helper: map a Prisma Empleado record to the API response shape */
function mapEmpleado(e: {
  id: number;
  nombre: string;
  telefono: string | null;
  cargo: string;
  estado: string;
  ci: string | null;
  email: string | null;
  direccion: string | null;
  turno: string | null;
  salario: unknown;
  fechaNacimiento: Date | null;
  fechaContratacion: Date | null;
  contactoEmergencia: string | null;
  notas: string | null;
  creadoEn: Date;
}) {
  return {
    id: e.id,
    name: e.nombre,
    phone: e.telefono,
    position: e.cargo,
    status: e.estado as "Activo" | "Inactivo",
    ci: e.ci,
    email: e.email,
    direccion: e.direccion,
    turno: e.turno,
    salario: e.salario != null ? Number(e.salario) : null,
    fechaNacimiento: e.fechaNacimiento,
    fechaContratacion: e.fechaContratacion,
    contactoEmergencia: e.contactoEmergencia,
    notas: e.notas,
    creadoEn: e.creadoEn,
  };
}

// Listar empleados
rutaEmpleados.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.empleado.findMany({
      orderBy: { creadoEn: "desc" },
    });
    const mapped = list.map(mapEmpleado);
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: "Error al listar empleados." });
  }
});

// Crear nuevo empleado
rutaEmpleados.post("/", async (req: Request, res: Response): Promise<void> => {
  const {
    name, phone, position,
    ci, email, direccion, turno, salario,
    fechaNacimiento, fechaContratacion, contactoEmergencia, notas,
  } = req.body;

  if (!name || !phone || !position) {
    res.status(400).json({ error: "Datos incompletos." });
    return;
  }

  try {
    const newEmp = await prisma.empleado.create({
      data: {
        nombre: name.trim(),
        telefono: phone.trim(),
        cargo: position.trim(),
        estado: "Activo",
        ...(ci != null && { ci: ci.trim() }),
        ...(email != null && { email: email.trim() }),
        ...(direccion != null && { direccion: direccion.trim() }),
        ...(turno != null && { turno: turno.trim() }),
        ...(salario != null && { salario }),
        ...(fechaNacimiento != null && { fechaNacimiento: new Date(fechaNacimiento) }),
        ...(fechaContratacion != null && { fechaContratacion: new Date(fechaContratacion) }),
        ...(contactoEmergencia != null && { contactoEmergencia: contactoEmergencia.trim() }),
        ...(notas != null && { notas: notas.trim() }),
      },
    });
    res.status(201).json(mapEmpleado(newEmp));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar el empleado." });
  }
});

// Editar empleado
rutaEmpleados.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID de empleado inválido." });
    return;
  }

  const {
    name, phone, position,
    ci, email, direccion, turno, salario,
    fechaNacimiento, fechaContratacion, contactoEmergencia, notas,
  } = req.body;

  if (!name || !phone || !position) {
    res.status(400).json({ error: "Datos incompletos." });
    return;
  }

  try {
    const updated = await prisma.empleado.update({
      where: { id },
      data: {
        nombre: name.trim(),
        telefono: phone.trim(),
        cargo: position.trim(),
        ci: ci != null ? ci.trim() : null,
        email: email != null ? email.trim() : null,
        direccion: direccion != null ? direccion.trim() : null,
        turno: turno != null ? turno.trim() : null,
        salario: salario != null ? salario : null,
        fechaNacimiento: fechaNacimiento != null ? new Date(fechaNacimiento) : null,
        fechaContratacion: fechaContratacion != null ? new Date(fechaContratacion) : null,
        contactoEmergencia: contactoEmergencia != null ? contactoEmergencia.trim() : null,
        notas: notas != null ? notas.trim() : null,
      },
    });
    res.json(mapEmpleado(updated));
  } catch (e) {
    console.error("Error al actualizar empleado:", e);
    res.status(500).json({ error: "Error al actualizar el empleado." });
  }
});

// Activar / Desactivar empleado
rutaEmpleados.patch("/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID de empleado inválido." });
    return;
  }

  try {
    const current = await prisma.empleado.findUnique({ where: { id } });

    if (!current) {
      res.status(404).json({ error: "Empleado no encontrado." });
      return;
    }

    const newStatus = current.estado === "Activo" ? "Inactivo" : "Activo";

    const updated = await prisma.empleado.update({
      where: { id },
      data: { estado: newStatus },
    });

    res.json(mapEmpleado(updated));
  } catch (e) {
    console.error("Error al cambiar estado del empleado:", e);
    res.status(500).json({ error: "Error al cambiar el estado del empleado." });
  }
});
