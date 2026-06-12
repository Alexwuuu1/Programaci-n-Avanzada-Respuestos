import { Router, Request, Response } from "express";
import { prisma } from "../server.js";
import fs from "fs/promises";
import path from "path";

export const rutaTelegram = Router();

const SESSIONS_FILE = path.resolve(process.cwd(), "telegram-sessions.json");

interface TelegramSession {
  username: string;
  state?: string;
  editOem?: string;
  editField?: string;
  tempClientName?: string;
  tempClientNit?: string;
  tempClientTelf?: string;
}

// Helper to read sessions
async function readSessions(): Promise<Record<string, TelegramSession>> {
  try {
    const data = await fs.readFile(SESSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    // If file doesn't exist, return empty object
    return {};
  }
}

// Helper to write sessions
async function writeSessions(sessions: Record<string, TelegramSession>): Promise<void> {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

// 1. Vincular cuenta de Telegram
rutaTelegram.post("/vincular", async (req: Request, res: Response): Promise<void> => {
  const { username, password, telegramChatId } = req.body;

  if (!username || !password || !telegramChatId) {
    res.status(400).json({ error: "Usuario, contraseña y telegramChatId son requeridos." });
    return;
  }

  try {
    const dbUser = await prisma.usuario.findUnique({
      where: { usuario: username.toLowerCase().trim() },
      include: {
        rol: true,
        empleado: true,
      },
    });

    if (!dbUser || dbUser.contrasena !== password) {
      res.status(401).json({ error: "Credenciales incorrectas." });
      return;
    }

    if (dbUser.estado === "Inactivo") {
      res.status(403).json({ error: "Su cuenta está desactivada." });
      return;
    }

    // Guardar vinculación
    const sessions = await readSessions();
    
    // Remover vinculaciones previas del mismo chat o del mismo usuario si existen
    const chatIdStr = String(telegramChatId);
    const cleanedSessions: Record<string, TelegramSession> = {};
    for (const [cid, sess] of Object.entries(sessions)) {
      const uname = typeof sess === "string" ? sess : (sess as any).username;
      if (cid !== chatIdStr && uname !== dbUser.usuario) {
        cleanedSessions[cid] = typeof sess === "string" ? { username: sess } : sess;
      }
    }
    
    cleanedSessions[chatIdStr] = { username: dbUser.usuario };
    await writeSessions(cleanedSessions);

    res.json({
      success: true,
      username: dbUser.usuario,
      role: dbUser.rol.nombre,
      employeeName: dbUser.empleado?.nombre || "Sin Empleado Asociado",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// 2. Desvincular cuenta
rutaTelegram.post("/desvincular", async (req: Request, res: Response): Promise<void> => {
  const { telegramChatId } = req.body;

  if (!telegramChatId) {
    res.status(400).json({ error: "telegramChatId es requerido." });
    return;
  }

  try {
    const sessions = await readSessions();
    const chatIdStr = String(telegramChatId);

    if (sessions[chatIdStr]) {
      delete sessions[chatIdStr];
      await writeSessions(sessions);
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al desvincular." });
  }
});

// 3. Obtener usuario por Telegram Chat ID
rutaTelegram.get("/usuario/:chatId", async (req: Request, res: Response): Promise<void> => {
  const { chatId } = req.params;

  try {
    const sessions = await readSessions();
    const sessionData = sessions[String(chatId)];
    const username = typeof sessionData === "string" ? sessionData : sessionData?.username;

    if (!username) {
      res.json({ vinculado: false });
      return;
    }

    const dbUser = await prisma.usuario.findUnique({
      where: { usuario: username },
      include: {
        rol: true,
        empleado: true,
      },
    });

    if (!dbUser || dbUser.estado === "Inactivo") {
      // Si el usuario ya no existe o está inactivo, remover la sesión
      delete sessions[String(chatId)];
      await writeSessions(sessions);
      res.json({ vinculado: false });
      return;
    }

    res.json({
      vinculado: true,
      username: dbUser.usuario,
      role: dbUser.rol.nombre,
      employeeName: dbUser.empleado?.nombre || "Sin Empleado Asociado",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// 4. Registrar usuario nuevo y vincularlo
rutaTelegram.post("/registrar", async (req: Request, res: Response): Promise<void> => {
  const { username, password, email, roleName, telegramChatId } = req.body;

  if (!username || !password || !roleName || !telegramChatId) {
    res.status(400).json({ error: "Usuario, contraseña, rol y telegramChatId son requeridos." });
    return;
  }

  try {
    // Buscar rol
    const dbRole = await prisma.role.findFirst({
      where: { nombre: { equals: roleName, mode: "insensitive" } },
    });

    if (!dbRole) {
      res.status(400).json({ error: "El rol especificado no existe." });
      return;
    }

    // Crear el usuario
    const newUser = await prisma.usuario.create({
      data: {
        usuario: username.toLowerCase().trim(),
        contrasena: password.trim(),
        email: email?.trim() || null,
        estado: "Activo",
        rolId: dbRole.id,
      },
      include: {
        rol: true,
      },
    });

    // Guardar la vinculación
    const sessions = await readSessions();
    const chatIdStr = String(telegramChatId);
    
    // Limpiar sesiones previas del mismo usuario o chat
    const cleanedSessions: Record<string, TelegramSession> = {};
    for (const [cid, sess] of Object.entries(sessions)) {
      const uname = typeof sess === "string" ? sess : (sess as any).username;
      if (cid !== chatIdStr && uname !== newUser.usuario) {
        cleanedSessions[cid] = typeof sess === "string" ? { username: sess } : sess;
      }
    }
    
    cleanedSessions[chatIdStr] = { username: newUser.usuario };
    await writeSessions(cleanedSessions);

    res.status(201).json({
      success: true,
      username: newUser.usuario,
      role: newUser.rol.nombre,
      employeeName: "Sin Empleado Asociado",
    });
  } catch (e: any) {
    console.error(e);
    if (e.code === "P2002") {
      res.status(409).json({ error: "El nombre de usuario ya existe." });
    } else {
      res.status(500).json({ error: "Error al registrar el usuario." });
    }
  }
});

// 5. Listar pedidos pendientes de compra
rutaTelegram.get("/compras-pendientes", async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.pedidoProveedor.findMany({
      where: { estado: "Pendiente" },
      include: {
        proveedor: true,
        usuario: { include: { empleado: true } },
      },
      orderBy: { fecha: "desc" },
    });

    const mapped = list.map((c) => ({
      id: String(c.id),
      providerName: c.proveedor.nombre,
      date: c.fecha.toISOString(),
      total: Number(c.total),
      buyerName: c.usuario.empleado?.nombre || c.usuario.usuario,
      nroReferencia: c.nroReferencia || "Sin Ref",
    }));

    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar compras pendientes." });
  }
});

// 6. Listar alertas de stock crítico
rutaTelegram.get("/alertas-stock", async (req: Request, res: Response): Promise<void> => {
  try {
    const activeProducts = await prisma.producto.findMany({
      where: { estado: "Activo" },
      include: { categoria: true },
    });

    // Filtrar los que están por debajo del stock mínimo
    const critical = activeProducts.filter((p) => p.stock <= p.stockMinimo);

    const mapped = critical.map((p) => ({
      oem: p.oem,
      name: p.nombre,
      brand: p.marca || "Sin Marca",
      category: p.categoria.nombre,
      stock: p.stock,
      minStock: p.stockMinimo,
      location: p.ubicacion || "Sin ubicación registrada",
      price: Number(p.precio),
    }));

    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener las alertas de stock." });
  }
});

// 7. Webhook unificado del Bot de Telegram (procesa comandos de forma nativa)
rutaTelegram.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  const { text, chatId, callbackQueryData, callbackQueryId } = req.body;

  if (!chatId) {
    res.status(400).json({ error: "chatId es requerido." });
    return;
  }

  let textStr = (text || "").trim();
  const textLower = textStr.toLowerCase();

  // Mapear los botones del Reply Keyboard a sus comandos
  if (textLower === "🔎 buscar stock") textStr = "/stock";
  else if (textLower === "⚠️ alertas stock" || textLower === "⚠️ alertas") textStr = "/alertas";
  else if (textLower === "📦 pedidos de compra" || textLower === "📦 compras") textStr = "/compras";
  else if (textLower === "👥 ver clientes" || textLower === "👥 clientes") textStr = "/cliente";
  else if (textLower === "👤 mi perfil" || textLower === "👤 perfil") textStr = "/perfil";
  else if (textLower === "ℹ️ ayuda" || textLower === "menu" || textLower === "menú") textStr = "/start";

  const chatIdStr = String(chatId);

  try {
    // 1. Verificar sesión
    const sessions = await readSessions();
    const sessionData = sessions[chatIdStr];
    const username = typeof sessionData === "string" ? sessionData : sessionData?.username;
    
    let session = {
      vinculado: false,
      username: "",
      role: "",
      employeeName: "",
      state: "",
      editOem: "",
      editField: ""
    };

    if (username) {
      const dbUser = await prisma.usuario.findUnique({
        where: { usuario: username },
        include: { rol: true, empleado: true },
      });

      if (dbUser && dbUser.estado === "Activo") {
        const sessObj = typeof sessionData === "string" ? { username: sessionData } : sessionData;
        session = {
          vinculado: true,
          username: dbUser.usuario,
          role: dbUser.rol.nombre,
          employeeName: dbUser.empleado?.nombre || "Sin Empleado Asociado",
          state: sessObj.state || "",
          editOem: sessObj.editOem || "",
          editField: sessObj.editField || "",
        };
      } else {
        delete sessions[chatIdStr];
        await writeSessions(sessions);
      }
    }

    let keyboardType = "reply";
    let inlineKeyboard: any = null;

    // ==========================================
    // PROCESAMIENTO DE CALLBACK QUERIES (BOTONES INLINE)
    // ==========================================
    if (callbackQueryData) {
      const dataStr = callbackQueryData.trim();
      const parts = dataStr.split(":");
      const action = parts[0];

      const adminActions = ["edit_prod", "edit_field", "deact_prod", "confirm_deact", "confirm_save"];
      if (adminActions.includes(action)) {
        if (!session.vinculado || session.role.toLowerCase() !== "admin") {
          res.json({
            output: "❌ Acceso denegado. Solo los administradores pueden gestionar productos.",
            chatId: chatIdStr,
            keyboard_type: "none"
          });
          return;
        }
      } else {
        if (!session.vinculado) {
          res.json({
            output: "❌ Acceso denegado. Por favor, inicia sesión con /login primero.",
            chatId: chatIdStr,
            keyboard_type: "none"
          });
          return;
        }
      }

      let replyText = "";
      let keyboardType = "none";
      let inlineKeyboard: any = null;

      if (action === "cat_prod") {
        const catId = parseInt(parts[1], 10);
        const products = await prisma.producto.findMany({
          where: { categoriaId: catId, estado: "Activo" },
          orderBy: { nombre: "asc" }
        });
        const cat = await prisma.categoria.findUnique({ where: { id: catId } });
        const catName = cat ? cat.nombre : "Categoría";

        if (products.length === 0) {
          replyText = `📁 **Productos en ${catName}**\n\nNo hay productos activos en esta categoría.`;
          keyboardType = "inline";
          inlineKeyboard = [
            [{ text: "🔙 Volver a Categorías", callback_data: "back_categories" }]
          ];
        } else {
          replyText = `📁 **Productos en ${catName} (${products.length}):**\n\nSelecciona un producto para ver detalles:`;
          keyboardType = "inline";
          inlineKeyboard = [];
          
          for (let i = 0; i < products.length; i += 2) {
            const row = [];
            const p1 = products[i];
            const name1 = p1.nombre.length > 25 ? p1.nombre.slice(0, 22) + "..." : p1.nombre;
            row.push({ text: `▫️ ${name1}`, callback_data: `select_prod:${p1.oem}` });
            
            if (i + 1 < products.length) {
              const p2 = products[i + 1];
              const name2 = p2.nombre.length > 25 ? p2.nombre.slice(0, 22) + "..." : p2.nombre;
              row.push({ text: `▫️ ${name2}`, callback_data: `select_prod:${p2.oem}` });
            }
            inlineKeyboard.push(row);
          }
          inlineKeyboard.push([{ text: "🔙 Volver a Categorías", callback_data: "back_categories" }]);
        }
      } else if (action === "select_prod") {
        const oem = parts[1];
        const prod = await prisma.producto.findUnique({
          where: { oem },
          include: { categoria: true }
        });

        if (!prod) {
          replyText = `❌ No existe el producto con OEM: ${oem}`;
        } else {
          const stockMin = prod.stockMinimo;
          const estadoStock = prod.stock <= 0 ? "Agotado" : prod.stock <= stockMin ? "Stock Crítico" : "Disponible";
          
          replyText = `▫️ **[${prod.oem}] ${prod.nombre}**\n` +
            `   └ Marca: *${prod.marca || "Sin Marca"}* | Cat: *${prod.categoria.nombre}*\n` +
            `   └ Stock: **${prod.stock}** (mín: ${stockMin}) - **${estadoStock}**\n` +
            `   └ Ubic: *${prod.ubicacion || "Sin ubicación"}*\n` +
            `   └ Precio: **${Number(prod.precio)} Bs.**`;

          keyboardType = "inline";
          const row1 = [];
          if (session.role.toLowerCase() === "admin") {
            row1.push({ text: "📝 Editar", callback_data: `edit_prod:${prod.oem}` });
            row1.push({ text: "🗑️ Desactivar", callback_data: `deact_prod:${prod.oem}` });
          }
          
          inlineKeyboard = [];
          if (row1.length > 0) {
            inlineKeyboard.push(row1);
          }
          inlineKeyboard.push([{ text: "🔙 Volver a Lista", callback_data: `cat_prod:${prod.categoriaId}` }]);
        }
      } else if (action === "back_categories") {
        const categorias = await prisma.categoria.findMany({ orderBy: { orden: "asc" } });
        replyText = `📁 **Categorías de Repuestos**\n\nSelecciona una categoría para explorar los productos disponibles:`;
        keyboardType = "inline";
        inlineKeyboard = [];
        for (let i = 0; i < categorias.length; i += 2) {
          const row = [];
          row.push({ text: `⚙️ ${categorias[i].nombre}`, callback_data: `cat_prod:${categorias[i].id}` });
          if (i + 1 < categorias.length) {
            row.push({ text: `⚙️ ${categorias[i+1].nombre}`, callback_data: `cat_prod:${categorias[i+1].id}` });
          }
          inlineKeyboard.push(row);
        }
      } else if (action === "recv_order") {
        const purchaseId = parseInt(parts[1], 10);
        const pedido = await prisma.pedidoProveedor.findUnique({
          where: { id: purchaseId },
          include: { detalles: true }
        });

        if (!pedido) {
          replyText = `❌ No existe el pedido #${purchaseId}.`;
        } else if (pedido.estado === "Recibido") {
          replyText = `❌ El pedido #${purchaseId} ya fue recibido anteriormente.`;
        } else {
          await prisma.$transaction(async (tx) => {
            await tx.pedidoProveedor.update({
              where: { id: purchaseId },
              data: {
                estado: "Recibido",
                fechaRecepcion: new Date()
              }
            });

            for (const d of pedido.detalles) {
              await tx.producto.update({
                where: { id: d.productoId },
                data: { stock: { increment: d.cantidad } }
              });

              const dbUser = await tx.usuario.findUnique({
                where: { usuario: session.username }
              });

              await tx.movimientoInventario.create({
                data: {
                  productoId: d.productoId,
                  cantidad: d.cantidad,
                  tipoMovimiento: "Entrada",
                  motivo: `Compra Recibida - Pedido #${purchaseId} (Telegram)`,
                  usuarioId: dbUser?.id || pedido.usuarioId
                }
              });
            }
          });

          replyText = `✅ **¡Pedido #${purchaseId} Recibido con éxito!**\n\nSe actualizó el stock y se registró en el Kardex.`;
        }
      } else if (action === "prompt_search_client") {
        replyText = `🔎 **Buscar Cliente**\n\nPor favor, escribe \`/cliente <nombre_o_nit>\` para buscar un cliente en el sistema.`;
      } else if (action === "start_create_client") {
        sessions[chatIdStr] = {
          username: session.username,
          state: "wait_client_name"
        };
        await writeSessions(sessions);
        replyText = `📛 **Registrar Nuevo Cliente**\n\nPor favor, escribe el **Nombre completo** del cliente:`;
        keyboardType = "inline";
        inlineKeyboard = [[{ text: "❌ Cancelar", callback_data: "cancel_action" }]];
      } else if (action === "client_type") {
        const type = parts[1];
        const sessObj = sessions[chatIdStr];
        if (sessObj) {
          sessObj.state = "wait_client_confirm";
          sessObj.editField = type;
          await writeSessions(sessions);

          replyText = `❓ **¿Confirmas registrar este cliente?**\n\n` +
            `📛 **Nombre:** ${sessObj.tempClientName}\n` +
            `🆔 **NIT/CI:** ${sessObj.tempClientNit}\n` +
            `📞 **Teléfono:** ${sessObj.tempClientTelf}\n` +
            `💼 **Tipo:** ${type}`;
          
          keyboardType = "inline";
          inlineKeyboard = [
            [
              { text: "✅ Sí, Registrar", callback_data: "confirm_create_client" },
              { text: "❌ Cancelar", callback_data: "cancel_action" }
            ]
          ];
        } else {
          replyText = `❌ Error de sesión al registrar cliente.`;
        }
      } else if (action === "confirm_create_client") {
        const sessObj = sessions[chatIdStr];
        if (sessObj && sessObj.tempClientName) {
          const cliNombre = sessObj.tempClientName.trim();
          const cliNit = sessObj.tempClientNit === "-" ? null : sessObj.tempClientNit;
          const cliTelf = sessObj.tempClientTelf === "-" ? null : sessObj.tempClientTelf;
          const cliTipo = sessObj.editField || "Particular";

          try {
            const desc = cliTipo.toLowerCase() === "taller" ? 10 : cliTipo.toLowerCase() === "empresa" ? 12 : 0;
            const newCliente = await prisma.cliente.create({
              data: {
                nombre: cliNombre,
                nit: cliNit,
                telefono: cliTelf,
                tipo: cliTipo,
                nivelFidelidad: "Nuevo",
                descuentoPorcentaje: desc,
                estado: "Activo"
              }
            });

            replyText = `✅ **¡Cliente Creado con Éxito!**\n\n` +
              `👤 **ID:** #${newCliente.id}\n` +
              `📛 **Nombre:** ${newCliente.nombre}\n` +
              `🆔 **NIT/CI:** ${newCliente.nit || "Sin NIT"}\n` +
              `📞 **Teléfono:** ${newCliente.telefono || "Sin Teléfono"}\n` +
              `💼 **Tipo:** ${newCliente.tipo}\n` +
              `📉 **Descuento:** ${newCliente.descuentoPorcentaje}%`;
          } catch (err: any) {
            console.error("ERROR CREAR CLIENTE GUIADO:", err);
            replyText = `❌ **Error al guardar el cliente**: ${err.message || err}`;
          }
        } else {
          replyText = `❌ Error de sesión al confirmar cliente.`;
        }
        sessions[chatIdStr] = { username: session.username };
        await writeSessions(sessions);
      } else if (action === "edit_prod") {
        const oem = parts[1];
        replyText = `📝 **Gestión de Producto [OEM: ${oem}]**\n\nSelecciona el campo que deseas editar para este producto:`;
        keyboardType = "inline";
        inlineKeyboard = [
          [
            { text: "✏️ Nombre", callback_data: `edit_field:${oem}:nombre` },
            { text: "✏️ Precio", callback_data: `edit_field:${oem}:precio` }
          ],
          [
            { text: "✏️ Stock", callback_data: `edit_field:${oem}:stock` },
            { text: "✏️ Ubicación", callback_data: `edit_field:${oem}:ubicacion` }
          ],
          [
            { text: "❌ Cancelar", callback_data: "cancel_action" }
          ]
        ];
      } else if (action === "edit_field") {
        const oem = parts[1];
        const field = parts[2];
        
        sessions[chatIdStr] = {
          username: session.username,
          state: "wait_val",
          editOem: oem,
          editField: field
        };
        await writeSessions(sessions);

        replyText = `✏️ **Editar ${field.toUpperCase()} para [OEM: ${oem}]**\n\nPor favor, escribe el nuevo valor para este campo:`;
        keyboardType = "inline";
        inlineKeyboard = [
          [
            { text: "❌ Cancelar", callback_data: "cancel_action" }
          ]
        ];
      } else if (action === "deact_prod") {
        const oem = parts[1];
        replyText = `⚠️ **¿Desactivar Producto [OEM: ${oem}]?**\n\nEsta acción cambiará el estado del producto a **Inactivo** y no aparecerá en búsquedas.\n\n¿Confirmas esta acción?`;
        keyboardType = "inline";
        inlineKeyboard = [
          [
            { text: "🗑️ Sí, desactivar", callback_data: `confirm_deact:${oem}` },
            { text: "❌ Cancelar", callback_data: "cancel_action" }
          ]
        ];
      } else if (action === "confirm_deact") {
        const oem = parts[1];
        try {
          await prisma.producto.update({
            where: { oem },
            data: { estado: "Inactivo" }
          });
          replyText = `✅ **Producto [OEM: ${oem}] desactivado con éxito.**`;
        } catch (err: any) {
          replyText = `❌ **Error al desactivar producto**: ${err.message || err}`;
        }
        sessions[chatIdStr] = { username: session.username };
        await writeSessions(sessions);
      } else if (action === "confirm_save") {
        const oem = parts[1];
        const field = parts[2];
        const val = parts.slice(3).join(":");

        try {
          const updateData: any = {};
          if (field === "precio") {
            updateData.precio = parseFloat(val);
          } else if (field === "stock") {
            updateData.stock = parseInt(val, 10);
          } else {
            updateData[field] = val;
          }

          await prisma.producto.update({
            where: { oem },
            data: updateData
          });

          if (field === "stock") {
            const dbUser = await prisma.usuario.findFirst({ where: { usuario: session.username } });
            const dbProd = await prisma.producto.findUnique({ where: { oem } });
            if (dbProd && dbUser) {
              await prisma.movimientoInventario.create({
                data: {
                  productoId: dbProd.id,
                  cantidad: parseInt(val, 10) - dbProd.stock,
                  tipoMovimiento: "Ajuste",
                  motivo: `Ajuste manual de stock vía Telegram`,
                  usuarioId: dbUser.id
                }
              });
            }
          }

          replyText = `✅ **¡Producto [OEM: ${oem}] actualizado con éxito!**\n\nCampo **${field}** cambiado a: \`${val}\``;
        } catch (err: any) {
          replyText = `❌ **Error al actualizar el producto**: ${err.message || err}`;
        }

        sessions[chatIdStr] = { username: session.username };
        await writeSessions(sessions);
      } else if (action === "cancel_action") {
        replyText = `❌ **Acción cancelada.**`;
        sessions[chatIdStr] = { username: session.username };
        await writeSessions(sessions);
      }

      res.json({
        output: replyText,
        chatId: chatIdStr,
        keyboard_type: keyboardType,
        inline_keyboard: inlineKeyboard
      });
      return;
    }

    // ==========================================
    // INTERCEPTAR ENTRADA DE TEXTO EN ESPERA DE VALOR
    // ==========================================
    if (session.vinculado && session.state === "wait_val" && session.editOem && session.editField) {
      const oem = session.editOem;
      const field = session.editField;
      const inputVal = textStr;

      let isValid = true;
      let errorMsg = "";

      if (field === "precio") {
        const num = parseFloat(inputVal);
        if (isNaN(num) || num < 0) {
          isValid = false;
          errorMsg = "⚠️ El precio debe ser un número positivo (ej: 120.50).";
        }
      } else if (field === "stock") {
        const num = parseInt(inputVal, 10);
        if (isNaN(num) || num < 0) {
          isValid = false;
          errorMsg = "⚠️ El stock debe ser un número entero positivo (ej: 10).";
        }
      } else if (inputVal.length === 0) {
        isValid = false;
        errorMsg = "⚠️ El valor no puede estar vacío.";
      }

      if (!isValid) {
        res.json({
          output: `${errorMsg}\n\nPor favor, escribe el nuevo valor para **${field}** o pulsa Cancelar:`,
          chatId: chatIdStr,
          keyboard_type: "inline",
          inline_keyboard: [
            [{ text: "❌ Cancelar", callback_data: "cancel_action" }]
          ]
        });
        return;
      }

      res.json({
        output: `❓ **¿Confirmas guardar el cambio?**\n\nProducto: **[OEM: ${oem}]**\nCampo: **${field}**\nNuevo Valor: \`${inputVal}\``,
        chatId: chatIdStr,
        keyboard_type: "inline",
        inline_keyboard: [
          [
            { text: "✅ Sí, Guardar", callback_data: `confirm_save:${oem}:${field}:${inputVal}` },
            { text: "❌ Cancelar", callback_data: "cancel_action" }
          ]
        ]
      });
      return;
    }

    if (session.vinculado && session.state && session.state.startsWith("wait_client_")) {
      const sessObj = sessions[chatIdStr];
      if (!sessObj) {
        res.json({ output: "❌ Error de sesión. Por favor, reintenta.", chatId: chatIdStr, keyboard_type: "reply" });
        return;
      }

      if (session.state === "wait_client_name") {
        sessObj.tempClientName = textStr;
        sessObj.state = "wait_client_nit";
        await writeSessions(sessions);

        res.json({
          output: `🆔 **NIT / CI del Cliente**\n\nEscribe el **NIT o CI** del cliente (o escribe \`-\` si no tiene):`,
          chatId: chatIdStr,
          keyboard_type: "inline",
          inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel_action" }]]
        });
        return;
      }

      if (session.state === "wait_client_nit") {
        sessObj.tempClientNit = textStr;
        sessObj.state = "wait_client_telf";
        await writeSessions(sessions);

        res.json({
          output: `📞 **Teléfono de Contacto**\n\nEscribe el **Número de teléfono** del cliente (o escribe \`-\` si no tiene):`,
          chatId: chatIdStr,
          keyboard_type: "inline",
          inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel_action" }]]
        });
        return;
      }

      if (session.state === "wait_client_telf") {
        sessObj.tempClientTelf = textStr;
        sessObj.state = "wait_client_type";
        await writeSessions(sessions);

        res.json({
          output: `💼 **Tipo de Cliente**\n\nSelecciona el tipo de cliente con los botones inline:`,
          chatId: chatIdStr,
          keyboard_type: "inline",
          inline_keyboard: [
            [
              { text: "Particular", callback_data: "client_type:Particular" },
              { text: "Taller", callback_data: "client_type:Taller" },
              { text: "Empresa", callback_data: "client_type:Empresa" }
            ],
            [{ text: "❌ Cancelar", callback_data: "cancel_action" }]
          ]
        });
        return;
      }
    }

    let replyText = "";
    const words = textStr.split(/\s+/);
    const command = words[0].toLowerCase();
    const args = words.slice(1);

    if (command === "/start") {
      const estadoSesion = session.vinculado
        ? `🟢 **Sesión Activa:**\n👤 **Usuario:** ${session.username}\n💼 **Rol:** ${session.role}\n\n`
        : `🔴 **Sesión no vinculada.** Para comenzar, inicia sesión con \`/login\` o regístrate con \`/register\`.\n\n`;

      replyText = `👋 ¡Bienvenido al Asistente Inteligente de Repuestos de **Repuestos La Paz**! 🚀\n\n` +
        `Este bot interactúa en tiempo real con el ERP y la base de datos PostgreSQL de la empresa.\n\n` +
        estadoSesion +
        `📋 **Guía de Uso Rápido:**\n\n` +
        `1️⃣ **VINCULACIÓN DE CUENTA (Seguridad)**\n` +
        `• Iniciar Sesión: \`/login <usuario> <contraseña>\`\n` +
        `  *(Ej: \`/login carlos carlos123\`)*\n` +
        `• Registrarse: \`/register <usuario> <contraseña> <email> <rol>\`\n` +
        `  *(Ej: \`/register pepe pepe123 pepe@mail.com Operario\`)*\n\n` +
        `2️⃣ **INSERCIÓN DE DATOS (Módulo de Clientes)**\n` +
        `• Crear Cliente: \`/crear_cliente <nombre_con_guiones> <nit> <telefono> <tipo>\`\n` +
        `  *(Ej: \`/crear_cliente Taller_Bolivia 998877 71234567 Taller\`)*\n` +
        `• Buscar Clientes: \`/cliente <nombre_o_nit>\`\n` +
        `  *(Ej: \`/cliente Bolivia\`)*\n\n` +
        `3️⃣ **LOGÍSTICA Y CONTROL (Módulo de Compras)**\n` +
        `• Pedidos Pendientes: \`/compras\`\n` +
        `• Consultar Stock: \`/stock <búsqueda>\` *(Ej: \`/stock pistón\`)*\n` +
        `• Recibir Pedido: \`/recibir <id_pedido>\` *(Ej: \`/recibir 12\`)*\n` +
        `  *(Esto incrementa el stock e inserta una auditoría en la tabla de Kardex)*\n\n` +
        `4️⃣ **CONSULTAS INTELIGENTES (Lenguaje Natural)**\n` +
        `Una vez iniciada la sesión, habla libremente con el orquestador IA (Ollama):\n` +
        `• *"¿Tienes bujías Bosch disponibles?"*\n` +
        `• *"¿Dónde está guardado el filtro de aceite Hilux?"*\n` +
        `• *"¿Qué productos están en stock crítico hoy?"*\n\n` +
        `💡 Escribe \`/perfil\` para ver tus datos actuales o \`/logout\` para desvincularte.`;
    } else if (!session.vinculado) {
      // ==========================================
      // CASO: USUARIO NO AUTENTICADO
      // ==========================================
      if (command === "/login") {
        const loginUser = args[0];
        const loginPass = args[1];
        if (!loginUser || !loginPass) {
          replyText = "⚠️ Uso: `/login <usuario> <contraseña>`\n*(Ejemplo: `/login carlos carlos123`)*";
        } else {
          const dbUser = await prisma.usuario.findUnique({
            where: { usuario: loginUser.toLowerCase().trim() },
            include: { rol: true, empleado: true },
          });

          if (!dbUser || dbUser.contrasena !== loginPass) {
            replyText = "❌ Credenciales incorrectas.";
          } else if (dbUser.estado === "Inactivo") {
            replyText = "❌ Su cuenta está desactivada.";
          } else {
            const cleanedSessions: Record<string, TelegramSession> = {};
            for (const [cid, sess] of Object.entries(sessions)) {
              const uname = typeof sess === "string" ? sess : (sess as any).username;
              if (cid !== chatIdStr && uname !== dbUser.usuario) {
                cleanedSessions[cid] = typeof sess === "string" ? { username: sess } : sess;
              }
            }
            cleanedSessions[chatIdStr] = { username: dbUser.usuario };
            await writeSessions(cleanedSessions);

            replyText = `🔑 ¡Sesión iniciada con éxito!\n\n👤 **Usuario:** ${dbUser.usuario}\n💼 **Rol:** ${dbUser.rol.nombre}\n👷 **Nombre:** ${dbUser.empleado?.nombre || "Sin Empleado Asociado"}`;
          }
        }
      } else if (command === "/register") {
        const regUser = args[0];
        const regPass = args[1];
        const regEmail = args[2];
        const regRole = args[3];

        if (!regUser || !regPass || !regRole) {
          replyText = "📝 Uso: `/register <usuario> <contraseña> <email_o_guion> <rol>`\n*(Ejemplo: `/register pepe pepe123 pepe@mail.com Operario`)*\n\nRoles válidos: `Admin`, `Vendedor`, `Operario`.";
        } else {
          const dbRole = await prisma.role.findFirst({
            where: { nombre: { equals: regRole, mode: "insensitive" } },
          });

          if (!dbRole) {
            replyText = "❌ El rol especificado no existe. Roles válidos: Admin, Vendedor, Operario.";
          } else {
            try {
              const newUser = await prisma.usuario.create({
                data: {
                  usuario: regUser.toLowerCase().trim(),
                  contrasena: regPass.trim(),
                  email: regEmail === "-" ? null : (regEmail?.trim() || null),
                  estado: "Activo",
                  rolId: dbRole.id,
                },
                include: { rol: true },
              });

              const cleanedSessions: Record<string, TelegramSession> = {};
              for (const [cid, sess] of Object.entries(sessions)) {
                const uname = typeof sess === "string" ? sess : (sess as any).username;
                if (cid !== chatIdStr && uname !== newUser.usuario) {
                  cleanedSessions[cid] = typeof sess === "string" ? { username: sess } : sess;
                }
              }
              cleanedSessions[chatIdStr] = { username: newUser.usuario };
              await writeSessions(cleanedSessions);

              replyText = `📝 ¡Usuario registrado y vinculado con éxito!\n\n👤 **Usuario:** ${newUser.usuario}\n💼 **Rol:** ${newUser.rol.nombre}\n¡Bienvenido al sistema!`;
            } catch (e: any) {
              if (e.code === "P2002") {
                replyText = "❌ El nombre de usuario ya existe.";
              } else {
                replyText = "❌ Error al crear la cuenta en la base de datos.";
              }
            }
          }
        }
      } else {
        replyText = "👋 ¡Hola! Aún no has vinculado tu cuenta de Telegram al sistema de repuestos Repuestos La Paz.\n\nPor favor, usa uno de los siguientes comandos para iniciar sesión o registrarte:\n\n🔑 `/login <usuario> <contraseña>`\n📝 `/register <usuario> <contraseña> <email> <rol>`\n\n*(Ejemplo: `/login carlos carlos123`)*\n*(Roles válidos: Admin, Vendedor, Operario)*";
      }
    } else {
      // ==========================================
      // CASO: USUARIO AUTENTICADO
      // ==========================================
      if (command.startsWith("/")) {
        if (command === "/logout") {
          delete sessions[chatIdStr];
          await writeSessions(sessions);
          replyText = "🔓 Sesión desvinculada de Telegram con éxito. Si deseas volver a operar, usa /login.";
        } else if (command === "/perfil") {
          replyText = `👤 **Perfil Vinculado:**\n\n👤 **Usuario:** ${session.username}\n💼 **Rol:** ${session.role}\n👷 **Asociado:** ${session.employeeName}`;
        } else if (command === "/stock") {
          const query = args.join(" ");
          if (!query) {
            const categorias = await prisma.categoria.findMany({ orderBy: { orden: "asc" } });
            replyText = `📁 **Categorías de Repuestos**\n\nSelecciona una categoría para explorar los productos disponibles:`;
            keyboardType = "inline";
            inlineKeyboard = [];
            for (let i = 0; i < categorias.length; i += 2) {
              const row = [];
              row.push({ text: `⚙️ ${categorias[i].nombre}`, callback_data: `cat_prod:${categorias[i].id}` });
              if (i + 1 < categorias.length) {
                row.push({ text: `⚙️ ${categorias[i+1].nombre}`, callback_data: `cat_prod:${categorias[i+1].id}` });
              }
              inlineKeyboard.push(row);
            }
          } else {
            const activeProducts = await prisma.producto.findMany({
              where: {
                estado: "Activo",
                OR: [
                  { nombre: { contains: query, mode: "insensitive" } },
                  { oem: { contains: query, mode: "insensitive" } },
                  { marca: { contains: query, mode: "insensitive" } },
                  { compatibilidad: { contains: query, mode: "insensitive" } },
                  { categoria: { nombre: { contains: query, mode: "insensitive" } } },
                ],
              },
              include: { categoria: true },
            });

            if (activeProducts.length > 0) {
              const list = activeProducts.map((r) => {
                const stockMin = r.stockMinimo;
                const estadoStock = r.stock <= 0 ? "Agotado" : r.stock <= stockMin ? "Stock Crítico" : "Disponible";
                return `▫️ **[${r.oem}] ${r.nombre}**\n   └ Marca: *${r.marca || "Sin Marca"}* | Cat: *${r.categoria.nombre}*\n   └ Stock: **${r.stock}** (mín: ${stockMin}) - **${estadoStock}**\n   └ Ubic: *${r.ubicacion || "Sin ubicación"}*\n   └ Precio: **${Number(r.precio)} Bs.**`;
              }).join("\n\n");
              replyText = `🔎 **Repuestos encontrados (${activeProducts.length}):**\n\n${list}`;

              // Si es un único producto y el usuario es Admin, agregar opciones inline
              if (activeProducts.length === 1 && session.role.toLowerCase() === "admin") {
                keyboardType = "inline";
                inlineKeyboard = [
                  [
                    { text: "📝 Editar", callback_data: `edit_prod:${activeProducts[0].oem}` },
                    { text: "🗑️ Desactivar", callback_data: `deact_prod:${activeProducts[0].oem}` }
                  ]
                ];
              }
            } else {
              replyText = `❌ No se encontraron repuestos para la búsqueda: "${query}"`;
            }
          }
        } else if (command === "/alertas") {
          const activeProducts = await prisma.producto.findMany({
            where: { estado: "Activo" },
            include: { categoria: true },
          });
          const critical = activeProducts.filter((p) => p.stock <= p.stockMinimo);

          if (critical.length > 0) {
            const list = critical.map((r) => 
              `⚠️ **[${r.oem}] ${r.nombre}**\n   └ Stock: **${r.stock}** (mínimo: ${r.stockMinimo})\n   └ Ubicación: *${r.ubicacion || "Sin ubicación"}*`
            ).join("\n\n");
            replyText = `⚠️ **Alertas de Stock Crítico (${critical.length}):**\n\n${list}`;
          } else {
            replyText = "✅ ¡Todo en orden! No hay repuestos por debajo del stock mínimo.";
          }
        } else if (command === "/compras") {
          const list = await prisma.pedidoProveedor.findMany({
            where: { estado: "Pendiente" },
            include: { proveedor: true },
            orderBy: { fecha: "desc" },
          });

          if (list.length > 0) {
            const mapped = list.map((c) => 
              `📦 **Pedido #${c.id}**\n   └ Proveedor: *${c.proveedor.nombre}*\n   └ Total: **${Number(c.total)} Bs.** | Ref: *${c.nroReferencia || "Sin Ref"}*\n   └ Acciones: Haz clic en el botón inferior para recibir.`
            ).join("\n\n");
            replyText = `📦 **Pedidos de Compra Pendientes (${list.length}):**\n\n${mapped}`;
            keyboardType = "inline";
            inlineKeyboard = list.map((c) => [
              { text: `📦 Recibir Pedido #${c.id}`, callback_data: `recv_order:${c.id}` }
            ]);
          } else {
            replyText = "✅ No hay pedidos de compras pendientes en este momento.";
          }
        } else if (command === "/recibir") {
          const purchaseId = parseInt(args[0], 10);
          if (isNaN(purchaseId)) {
            replyText = "📦 Uso: `/recibir <id_pedido>`\n*(Ejemplo: `/recibir 3`)*";
          } else {
            const pedido = await prisma.pedidoProveedor.findUnique({
              where: { id: purchaseId },
              include: { detalles: true }
            });

            if (!pedido) {
              replyText = `❌ No existe el pedido #${purchaseId}.`;
            } else if (pedido.estado === "Recibido") {
              replyText = `❌ El pedido #${purchaseId} ya fue recibido anteriormente.`;
            } else {
              await prisma.$transaction(async (tx) => {
                await tx.pedidoProveedor.update({
                  where: { id: purchaseId },
                  data: {
                    estado: "Recibido",
                    fechaRecepcion: new Date()
                  }
                });

                for (const d of pedido.detalles) {
                  await tx.producto.update({
                    where: { id: d.productoId },
                    data: { stock: { increment: d.cantidad } }
                  });

                  const dbUser = await tx.usuario.findUnique({
                    where: { usuario: session.username }
                  });

                  await tx.movimientoInventario.create({
                    data: {
                      productoId: d.productoId,
                      cantidad: d.cantidad,
                      tipoMovimiento: "Entrada",
                      motivo: `Compra Recibida - Pedido #${purchaseId}`,
                      usuarioId: dbUser?.id || pedido.usuarioId
                    }
                  });
                }
              });

              replyText = `✅ **¡Pedido #${purchaseId} Recibido!**\n\nLa mercadería física ha sido registrada en el Kardex e ingresada al stock de inventario correctamente.`;
            }
          }
        } else if (command === "/crear_cliente") {
          const cliNombreRaw = args[0];
          const cliNit = args[1];
          const cliTelf = args[2];
          const cliTipo = args[3] || "Particular";

          if (!cliNombreRaw) {
            replyText = "👥 Uso: `/crear_cliente <nombre_con_guiones_bajos> <nit> <telefono> <tipo>`\n*(Ejemplo: `/crear_cliente Taller_Perez 1234567 78912345 Taller`)*\n\nTipos válidos: `Particular`, `Taller`, `Empresa`";
          } else {
            try {
              const cliNombre = cliNombreRaw.replace(/_/g, " ").trim();
              const newCliente = await prisma.cliente.create({
                data: {
                  nombre: cliNombre,
                  nit: cliNit === "-" ? null : cliNit,
                  telefono: cliTelf === "-" ? null : cliTelf,
                  tipo: cliTipo,
                  nivelFidelidad: "Nuevo",
                  descuentoPorcentaje: cliTipo.toLowerCase() === "taller" ? 10 : cliTipo.toLowerCase() === "empresa" ? 12 : 0,
                  estado: "Activo"
                }
              });

              replyText = `✅ **¡Cliente Creado con Éxito!**\n\n👤 **ID:** #${newCliente.id}\n📛 **Nombre:** ${newCliente.nombre}\n🆔 **NIT:** ${newCliente.nit || "Sin NIT"}\n📞 **Teléfono:** ${newCliente.telefono || "Sin Teléfono"}\n💼 **Tipo:** ${newCliente.tipo}\n📉 **Descuento:** ${newCliente.descuentoPorcentaje}%`;
            } catch (err: any) {
              console.error("ERROR CREAR CLIENTE TELEGRAM:", err);
              replyText = `❌ Error al guardar el cliente: ${err.message || err}`;
            }
          }
        } else if (command === "/cliente") {
          const query = args.join(" ");
          if (!query) {
            replyText = `👥 **Módulo de Clientes**\n\nSelecciona una opción para continuar:`;
            keyboardType = "inline";
            inlineKeyboard = [
              [
                { text: "🔎 Buscar Cliente", callback_data: "prompt_search_client" },
                { text: "➕ Registrar Nuevo Cliente", callback_data: "start_create_client" }
              ]
            ];
          } else {
            const clientes = await prisma.cliente.findMany({
              where: {
                OR: [
                  { nombre: { contains: query, mode: "insensitive" } },
                  { nit: { contains: query, mode: "insensitive" } }
                ]
              }
            });

            if (clientes.length > 0) {
              const list = clientes.map((c) => 
                `👤 **[#${c.id}] ${c.nombre}**\n   └ Tipo: *${c.tipo}* | Fidelidad: *${c.nivelFidelidad}*\n   └ NIT: **${c.nit || "Sin NIT"}** | Teléfono: **${c.telefono || "Sin Teléfono"}**\n   └ Descuento: **${c.descuentoPorcentaje}%**\n   └ Estado: **${c.estado}**`
              ).join("\n\n");
              replyText = `👥 **Clientes encontrados (${clientes.length}):**\n\n${list}`;
            } else {
              replyText = `❌ No se encontraron clientes para la búsqueda: "${query}"`;
            }
          }
        } else {
          replyText = "ℹ️ **Comandos disponibles:**\n\n🔎 `/stock <búsqueda>` - Buscar repuestos\n⚠️ `/alertas` - Stock por debajo del mínimo\n📦 `/compras` - Pedidos pendientes de recibir\n✅ `/recibir <id>` - Recibir pedido físico\n👥 `/crear_cliente <nombre_bajo> <nit> <telf> <tipo>` - Insertar nuevo cliente\n👥 `/cliente <búsqueda>` - Buscar cliente en la base de datos\n👤 `/perfil` - Datos de tu cuenta\n🔓 `/logout` - Cerrar sesión";
        }
      } else {
        try {
          const response = await fetch("http://host.docker.internal:5678/webhook/repuestos-router", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatInput: textStr,
              sessionId: "telegram-" + chatIdStr,
            }),
          });
          const routerData: any = await response.json();
          replyText = routerData.output || routerData.response || "No pude obtener respuesta del orquestador inteligente.";
        } catch (e: any) {
          console.error("ERROR LLAMADA OLLAMA ROUTER:", e);
          replyText = "⚙️ (Ollama está procesando tu mensaje libre) ...\n\nNo se pudo conectar al orquestador inteligente, pero puedes operar usando los comandos estructurados.";
        }
      }
    }

    const responseData: any = {
      output: replyText,
      chatId: chatIdStr,
      keyboard_type: keyboardType
    };

    if (keyboardType === "inline" && inlineKeyboard) {
      responseData.inline_keyboard = inlineKeyboard;
    }

    res.json(responseData);
  } catch (e) {
    console.error("ERROR WEBHOOK TELEGRAM DETALLADO:", e);
    res.status(500).json({ error: "Error interno al procesar el mensaje." });
  }
});
