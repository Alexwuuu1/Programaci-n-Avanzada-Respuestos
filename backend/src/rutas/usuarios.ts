import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaUsuarios = Router();

// Listar usuarios con sus roles y empleados asociados
rutaUsuarios.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.usuario.findMany({
      include: {
        rol: true,
        empleado: true,
      },
      orderBy: { creadoEn: "desc" },
    });
    const mapped = list.map((u) => ({
      id: u.id,
      username: u.usuario,
      role: u.rol.nombre as "Admin" | "Vendedor" | "Operario",
      employeeName: u.empleado?.nombre || "Sin Empleado Asociado",
      employeeId: u.empleadoId,
      email: u.email,
      status: u.estado,
      lastAccess: u.ultimoAcceso,
      createdAt: u.creadoEn,
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: "Error al listar usuarios." });
  }
});

// Crear nuevo usuario
rutaUsuarios.post("/", async (req: Request, res: Response): Promise<void> => {
  const { username, roleName, employeeId, email, password } = req.body;

  if (!username || !roleName) {
    res.status(400).json({ error: "Usuario y rol son obligatorios." });
    return;
  }

  try {
    // Buscar el rol
    const dbRole = await prisma.role.findFirst({
      where: { nombre: roleName },
    });

    if (!dbRole) {
      res.status(400).json({ error: "El rol especificado no existe." });
      return;
    }

    // Crear el usuario
    const finalPassword = password?.trim() || (username.toLowerCase().trim() + "123");

    const newUser = await prisma.usuario.create({
      data: {
        usuario: username.toLowerCase().trim(),
        contrasena: finalPassword,
        email: email?.trim() || null,
        estado: "Activo",
        rolId: dbRole.id,
        empleadoId: employeeId ? Number(employeeId) : null,
      },
      include: {
        rol: true,
        empleado: true,
      },
    });

    res.status(201).json({
      id: newUser.id,
      username: newUser.usuario,
      role: newUser.rol.nombre as "Admin" | "Vendedor" | "Operario",
      employeeName: newUser.empleado?.nombre || "Sin Empleado Asociado",
      employeeId: newUser.empleadoId,
      email: newUser.email,
      status: newUser.estado,
      lastAccess: newUser.ultimoAcceso,
      createdAt: newUser.creadoEn,
    });
  } catch (e: any) {
    console.error(e);
    if (e.code === "P2002") {
      res.status(409).json({ error: "El nombre de usuario ya existe." });
    } else {
      res.status(500).json({ error: "Error al crear el usuario." });
    }
  }
});

// Editar usuario
rutaUsuarios.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { roleName, employeeId, email, password } = req.body;

  try {
    const updateData: Record<string, unknown> = {};

    if (roleName) {
      const dbRole = await prisma.role.findFirst({
        where: { nombre: roleName },
      });
      if (!dbRole) {
        res.status(400).json({ error: "El rol especificado no existe." });
        return;
      }
      updateData.rolId = dbRole.id;
    }

    if (email !== undefined) updateData.email = email?.trim() || null;
    if (password?.trim()) updateData.contrasena = password.trim();
    if (employeeId !== undefined) updateData.empleadoId = employeeId ? Number(employeeId) : null;

    const updated = await prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        rol: true,
        empleado: true,
      },
    });

    res.json({
      id: updated.id,
      username: updated.usuario,
      role: updated.rol.nombre as "Admin" | "Vendedor" | "Operario",
      employeeName: updated.empleado?.nombre || "Sin Empleado Asociado",
      employeeId: updated.empleadoId,
      email: updated.email,
      status: updated.estado,
      lastAccess: updated.ultimoAcceso,
      createdAt: updated.creadoEn,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar el usuario." });
  }
});

// Activar / Desactivar usuario
rutaUsuarios.patch("/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    const newStatus = user.estado === "Activo" ? "Inactivo" : "Activo";
    const updated = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { estado: newStatus },
      include: { rol: true, empleado: true },
    });

    res.json({
      id: updated.id,
      username: updated.usuario,
      role: updated.rol.nombre as "Admin" | "Vendedor" | "Operario",
      employeeName: updated.empleado?.nombre || "Sin Empleado Asociado",
      employeeId: updated.empleadoId,
      email: updated.email,
      status: updated.estado,
      lastAccess: updated.ultimoAcceso,
      createdAt: updated.creadoEn,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al cambiar el estado del usuario." });
  }
});

// Eliminar usuario
rutaUsuarios.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Verificar si tiene registros asociados
    const user = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      include: {
        ventas: { take: 1 },
        pedidos: { take: 1 },
        movimientos: { take: 1 },
      },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    if (user.ventas.length > 0 || user.pedidos.length > 0 || user.movimientos.length > 0) {
      res.status(409).json({
        error: "No se puede eliminar: este usuario tiene ventas, pedidos o movimientos asociados. Desactívelo en su lugar.",
      });
      return;
    }

    await prisma.usuario.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al eliminar el usuario." });
  }
});

