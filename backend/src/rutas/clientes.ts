import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaClientes = Router();

// 1. Listar clientes
rutaClientes.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.cliente.findMany({
      orderBy: { creadoEn: "desc" },
    });
    
    const mapped = list.map((c) => ({
      id: String(c.id),
      name: c.nombre,
      phone: c.telefono || "",
      address: c.direccion || "",
    }));
    
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: "Error al listar clientes." });
  }
});

// 2. Crear cliente
rutaClientes.post("/", async (req: Request, res: Response): Promise<void> => {
  const { name, phone, address } = req.body;

  if (!name) {
    res.status(400).json({ error: "El nombre del cliente es obligatorio." });
    return;
  }

  try {
    const created = await prisma.cliente.create({
      data: {
        nombre: name.trim(),
        telefono: phone ? phone.trim() : null,
        direccion: address ? address.trim() : null,
      },
    });

    res.status(201).json({
      id: String(created.id),
      name: created.nombre,
      phone: created.telefono || "",
      address: created.direccion || "",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar el cliente." });
  }
});
