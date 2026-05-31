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
    });
    const mapped = list.map((u) => ({
      id: u.id,
      username: u.usuario,
      role: u.rol.nombre as "Admin" | "Vendedor" | "Operario",
      employeeName: u.empleado?.nombre || "Sin Empleado Asociado",
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: "Error al listar usuarios." });
  }
});

// Crear nuevo usuario
rutaUsuarios.post("/", async (req: Request, res: Response): Promise<void> => {
  const { username, roleName, employeeName } = req.body;

  if (!username || !roleName || !employeeName) {
    res.status(400).json({ error: "Datos incompletos." });
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

    // Buscar o crear empleado
    let dbEmployee = await prisma.empleado.findFirst({
      where: { nombre: employeeName },
    });

    if (!dbEmployee) {
      dbEmployee = await prisma.empleado.create({
        data: {
          nombre: employeeName,
          telefono: "70000000",
          cargo: roleName === "Admin" ? "Administrador" : roleName === "Vendedor" ? "Ventas" : "Operador",
        },
      });
    }

    // Crear el usuario
    const newUser = await prisma.usuario.create({
      data: {
        usuario: username.toLowerCase().trim(),
        contrasena: username.toLowerCase() + "123", // Contraseña por defecto
        rolId: dbRole.id,
        empleadoId: dbEmployee.id,
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
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "El nombre de usuario ya existe o hubo un error." });
  }
});

// Eliminar usuario
rutaUsuarios.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.usuario.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error al eliminar el usuario." });
  }
});
