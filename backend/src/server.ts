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
import { rutaProveedores } from "./rutas/proveedores.js";
import { rutaCompras } from "./rutas/compras.js";
import { rutaAbonos } from "./rutas/abonos.js";
import { rutaFinanzas } from "./rutas/finanzas.js";
import { rutaTelegram } from "./rutas/telegram.js";


const app = express();
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`, Object.keys(req.body).length ? JSON.stringify(req.body) : "");
  next();
});

app.use("/api/autenticacion", rutaAutenticacion);
app.use("/api/usuarios", rutaUsuarios);
app.use("/api/empleados", rutaEmpleados);
app.use("/api/productos", rutaProductos);
app.use("/api/produccion", rutaProduccion);
app.use("/api/clientes", rutaClientes);
app.use("/api/ventas", rutaVentas);
app.use("/api/dashboard", rutaDashboard);
app.use("/api/inventario", rutaInventario);
app.use("/api/proveedores", rutaProveedores);
app.use("/api/compras", rutaCompras);
app.use("/api/abonos", rutaAbonos);
app.use("/api/finanzas", rutaFinanzas);
app.use("/api/telegram", rutaTelegram);


const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor API corriendo en http://localhost:${PUERTO}`);
});
