import { Router, Request, Response } from "express";
import { prisma } from "../server.js";

export const rutaProductos = Router();

// ==========================================
// -- PRODUCTOS
// ==========================================

// Listar productos
rutaProductos.get("/", async (req: Request, res: Response) => {
  try {
    const list = await prisma.producto.findMany({
      include: { categoria: true, proveedor: true },
      orderBy: { creadoEn: "desc" },
    });
    const mapped = list.map((p) => ({
      id: String(p.id),
      oem: p.oem,
      name: p.nombre,
      categoryId: String(p.categoriaId),
      price: Number(p.precio),
      stock: p.stock,
      compatibility: p.compatibilidad,
      providerName: p.proveedor?.nombre || "Sin Proveedor",
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: "Error al listar productos." });
  }
});

// Guardar (Crear o Editar) producto
rutaProductos.post("/", async (req: Request, res: Response): Promise<void> => {
  const { id, oem, name, categoryId, price, stock, compatibility, providerName } = req.body;

  if (!oem || !name || !categoryId || price === undefined || stock === undefined || !compatibility || !providerName) {
    res.status(400).json({ error: "Datos de producto incompletos." });
    return;
  }

  try {
    // Buscar o crear proveedor
    let dbProvider = await prisma.proveedor.findFirst({
      where: { nombre: providerName },
    });

    if (!dbProvider) {
      dbProvider = await prisma.proveedor.create({
        data: { nombre: providerName, telefono: "70000000" },
      });
    }

    if (id) {
      // Editar
      const updated = await prisma.producto.update({
        where: { id: Number(id) },
        data: {
          oem,
          nombre: name,
          categoriaId: Number(categoryId),
          precio: Number(price),
          stock: Number(stock),
          compatibilidad: compatibility,
          proveedorId: dbProvider.id,
        },
      });
      res.json({
        id: String(updated.id),
        oem: updated.oem,
        name: updated.nombre,
        categoryId: String(updated.categoriaId),
        price: Number(updated.precio),
        stock: updated.stock,
        compatibility: updated.compatibilidad,
        providerName: providerName,
      });
    } else {
      // Crear
      const created = await prisma.producto.create({
        data: {
          oem,
          nombre: name,
          categoriaId: Number(categoryId),
          precio: Number(price),
          stock: Number(stock),
          compatibilidad: compatibility,
          proveedorId: dbProvider.id,
        },
      });
      res.status(201).json({
        id: String(created.id),
        oem: created.oem,
        name: created.nombre,
        categoryId: String(created.categoriaId),
        price: Number(created.precio),
        stock: created.stock,
        compatibility: created.compatibilidad,
        providerName: providerName,
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Código OEM ya registrado u otro error." });
  }
});

// Eliminar producto
rutaProductos.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.producto.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error al eliminar producto." });
  }
});

// ==========================================
// -- CATEGORÍAS
// ==========================================

// Listar categorías
rutaProductos.get("/categorias", async (req: Request, res: Response) => {
  try {
    const list = await prisma.categoria.findMany({
      orderBy: { id: "asc" },
    });
    const mapped = list.map((c) => ({
      id: String(c.id),
      name: c.nombre,
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: "Error al listar categorías." });
  }
});

// Crear categoría
rutaProductos.post("/categorias", async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: "El nombre es requerido." });
    return;
  }

  try {
    const created = await prisma.categoria.create({
      data: { nombre: name },
    });
    res.status(201).json({
      id: String(created.id),
      name: created.nombre,
    });
  } catch (e) {
    res.status(500).json({ error: "La categoría ya existe o hubo un error." });
  }
});

// Eliminar categoría
rutaProductos.delete("/categorias/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Comprobar si hay productos asociados
    const count = await prisma.producto.count({
      where: { categoriaId: Number(id) },
    });

    if (count > 0) {
      res.status(400).json({ error: "No se puede eliminar una categoría con productos asociados." });
      return;
    }

    await prisma.categoria.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error al eliminar la categoría." });
  }
});
