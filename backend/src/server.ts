import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { rutaAutenticacion } from "./rutas/autenticacion.js";
import { rutaUsuarios } from "./rutas/usuarios.js";
import { rutaEmpleados } from "./rutas/empleados.js";
import { rutaProductos } from "./rutas/productos.js";
import { rutaProduccion } from "./rutas/produccion.js";
import { rutaClientes } from "./rutas/clientes.js";
import { rutaVentas } from "./rutas/ventas.js";
import { rutaDashboard } from "./rutas/dashboard.js";
import { rutaInventario } from "./rutas/inventario.js";

const app = express();
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use("/api/autenticacion", rutaAutenticacion);
app.use("/api/usuarios", rutaUsuarios);
app.use("/api/empleados", rutaEmpleados);
app.use("/api/productos", rutaProductos);
app.use("/api/produccion", rutaProduccion);
app.use("/api/clientes", rutaClientes);
app.use("/api/ventas", rutaVentas);
app.use("/api/dashboard", rutaDashboard);
app.use("/api/inventario", rutaInventario);

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor API corriendo en http://localhost:${PUERTO}`);
});
