import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaEmpleados = Router();

// Listar empleados
rutaEmpleados.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.empleado.findMany({
      orderBy: { creadoEn: "desc" },
    });
    const mapped = list.map((e) => ({
      id: e.id,
      name: e.nombre,
      phone: e.telefono,
      position: e.cargo,
      status: e.estado as "Activo" | "Inactivo",
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: "Error al listar empleados." });
  }
});

// Crear nuevo empleado
rutaEmpleados.post("/", async (req: Request, res: Response): Promise<void> => {
  const { name, phone, position } = req.body;

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
      },
    });
    res.status(201).json({
      id: newEmp.id,
      name: newEmp.nombre,
      phone: newEmp.telefono,
      position: newEmp.cargo,
      status: newEmp.estado as "Activo" | "Inactivo",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar el empleado." });
  }
});
