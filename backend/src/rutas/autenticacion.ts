import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaAutenticacion = Router();

rutaAutenticacion.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña son requeridos." });
    return;
  }

  try {
    const dbUser = await prisma.usuario.findUnique({
      where: { usuario: username.toLowerCase() },
      include: {
        rol: true,
        empleado: true,
      },
    });

    if (!dbUser || dbUser.contrasena !== password) {
      res.status(401).json({ error: "Credenciales incorrectas." });
      return;
    }

    // Bloquear usuarios inactivos
    if (dbUser.estado === "Inactivo") {
      res.status(403).json({ error: "Su cuenta ha sido desactivada. Contacte al administrador." });
      return;
    }

    // Registrar último acceso
    await prisma.usuario.update({
      where: { id: dbUser.id },
      data: { ultimoAcceso: new Date() },
    });

    res.json({
      username: dbUser.usuario,
      role: dbUser.rol.nombre,
      employeeName: dbUser.empleado?.nombre || "Sin Empleado Asociado",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error en el servidor de base de datos." });
  }
});

