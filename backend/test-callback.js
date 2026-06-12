import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook';
const CHAT_ID = '7051497734';
const OEM = '234-4209'; // Sensor de Oxígeno Denso (debería ser de la categoría Eléctrico)

async function sendWebhook(payload) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function runTests() {
  console.log('=== INICIANDO PRUEBAS COMPLETAS DE BOTONES INTERACTIVOS ===\n');

  // Asegurar sesión activa
  // (La sesión se configura externamente o por el test runner)

  // ==========================================
  // FLUJO 1: NAVEGACIÓN DE STOCK POR CATEGORÍAS
  // ==========================================
  console.log('--- TEST 1: Navegación de Stock por Categorías ---');
  
  // 1.1 Ejecutar /stock vacío
  console.log('1.1 Solicitando /stock vacío...');
  let response = await sendWebhook({ chatId: CHAT_ID, text: '/stock' });
  console.log('Respuesta:', response.output);
  console.log('Botones de Categorías:', response.inline_keyboard ? response.inline_keyboard.map(r => r.map(b => b.text)) : 'No Keyboard');
  
  if (response.keyboard_type !== 'inline' || !response.inline_keyboard) {
    throw new Error('Se esperaba una botonera inline con las categorías de repuestos');
  }

  // Encontrar el botón de la categoría "Eléctrico"
  let electricBtn = null;
  for (const row of response.inline_keyboard) {
    for (const btn of row) {
      if (btn.text.includes('Eléctrico')) {
        electricBtn = btn;
      }
    }
  }

  if (!electricBtn) {
    throw new Error('No se encontró el botón de la categoría Eléctrico');
  }
  console.log(`Botón encontrado: "${electricBtn.text}" -> callback: ${electricBtn.callback_data}`);

  // 1.2 Click en categoría "Eléctrico"
  console.log('\n1.2 Seleccionando categoría Eléctrico...');
  response = await sendWebhook({ chatId: CHAT_ID, callbackQueryData: electricBtn.callback_data });
  console.log('Respuesta:', response.output);
  console.log('Productos Encontrados:', response.inline_keyboard ? response.inline_keyboard.map(r => r.map(b => b.text)) : 'No Keyboard');

  // Encontrar el botón de nuestro Sensor de Oxígeno
  let prodBtn = null;
  for (const row of response.inline_keyboard) {
    for (const btn of row) {
      if (btn.callback_data === `select_prod:${OEM}`) {
        prodBtn = btn;
      }
    }
  }

  if (!prodBtn) {
    throw new Error(`No se encontró el botón del producto con OEM: ${OEM}`);
  }
  console.log(`Botón del producto: "${prodBtn.text}" -> callback: ${prodBtn.callback_data}`);

  // 1.3 Click en el producto para ver detalles
  console.log(`\n1.3 Cargando detalles del producto ${OEM}...`);
  response = await sendWebhook({ chatId: CHAT_ID, callbackQueryData: prodBtn.callback_data });
  console.log('Respuesta:', response.output);
  console.log('Opciones de Administración:', response.inline_keyboard ? response.inline_keyboard.map(r => r.map(b => b.text)) : 'No Keyboard');

  if (!response.output.includes(OEM) || !response.output.includes('Bs.')) {
    throw new Error('El detalle del producto no contiene los campos esperados');
  }
  console.log('✅ Flujo de navegación de stock completado.');

  // ==========================================
  // FLUJO 2: CREACIÓN GUIADA DE CLIENTES
  // ==========================================
  console.log('\n--- TEST 2: Creación Guiada de Clientes ---');
  
  // 2.1 Abrir módulo de clientes vacío
  console.log('2.1 Ejecutando /cliente vacío...');
  response = await sendWebhook({ chatId: CHAT_ID, text: '/cliente' });
  console.log('Respuesta:', response.output);
  console.log('Teclado:', response.keyboard_type);
  console.log('Botones:', response.inline_keyboard ? response.inline_keyboard.map(r => r.map(b => b.text)) : 'No Keyboard');

  let createClientBtn = null;
  for (const row of response.inline_keyboard) {
    for (const btn of row) {
      if (btn.callback_data === 'start_create_client') {
        createClientBtn = btn;
      }
    }
  }

  if (!createClientBtn) {
    throw new Error('No se encontró el botón [➕ Registrar Nuevo Cliente]');
  }

  // 2.2 Click en Registrar Nuevo Cliente
  console.log('\n2.2 Iniciando registro de cliente...');
  response = await sendWebhook({ chatId: CHAT_ID, callbackQueryData: createClientBtn.callback_data });
  console.log('Respuesta:', response.output);

  if (!response.output.includes('Nombre completo')) {
    throw new Error('Se esperaba la solicitud de nombre del cliente');
  }

  // 2.3 Enviar Nombre
  console.log('\n2.3 Enviando nombre: "Cliente Test Botones"...');
  response = await sendWebhook({ chatId: CHAT_ID, text: 'Cliente Test Botones' });
  console.log('Respuesta:', response.output);

  if (!response.output.includes('NIT o CI')) {
    throw new Error('Se esperaba la solicitud del NIT del cliente');
  }

  // 2.4 Enviar NIT
  console.log('\n2.4 Enviando NIT: "9988776655"...');
  response = await sendWebhook({ chatId: CHAT_ID, text: '9988776655' });
  console.log('Respuesta:', response.output);

  if (!response.output.includes('Número de teléfono')) {
    throw new Error('Se esperaba la solicitud del número de teléfono');
  }

  // 2.5 Enviar Teléfono
  console.log('\n2.5 Enviando teléfono: "76543210"...');
  response = await sendWebhook({ chatId: CHAT_ID, text: '76543210' });
  console.log('Respuesta:', response.output);
  console.log('Botones de Tipo:', response.inline_keyboard ? response.inline_keyboard.map(r => r.map(b => b.text)) : 'No Keyboard');

  // Encontrar botón de tipo Taller
  let typeBtn = null;
  for (const row of response.inline_keyboard) {
    for (const btn of row) {
      if (btn.callback_data === 'client_type:Taller') {
        typeBtn = btn;
      }
    }
  }

  if (!typeBtn) {
    throw new Error('No se encontró el botón de tipo Taller');
  }

  // 2.6 Seleccionar tipo Taller
  console.log('\n2.6 Seleccionando tipo "Taller"...');
  response = await sendWebhook({ chatId: CHAT_ID, callbackQueryData: typeBtn.callback_data });
  console.log('Respuesta:', response.output);
  console.log('Botones de Confirmación:', response.inline_keyboard ? response.inline_keyboard.map(r => r.map(b => b.text)) : 'No Keyboard');

  if (!response.output.includes('¿Confirmas registrar este cliente?')) {
    throw new Error('Se esperaba el mensaje de confirmación de registro');
  }

  // Encontrar botón de confirmar
  let confirmBtn = null;
  for (const row of response.inline_keyboard) {
    for (const btn of row) {
      if (btn.callback_data === 'confirm_create_client') {
        confirmBtn = btn;
      }
    }
  }

  if (!confirmBtn) {
    throw new Error('No se encontró el botón de confirmar registro');
  }

  // 2.7 Confirmar registro
  console.log('\n2.7 Confirmando registro...');
  response = await sendWebhook({ chatId: CHAT_ID, callbackQueryData: confirmBtn.callback_data });
  console.log('Respuesta:', response.output);

  if (!response.output.includes('¡Cliente Creado con Éxito!')) {
    throw new Error('No se recibió la confirmación de creación del cliente');
  }

  // Verificar en la DB
  const createdClient = await prisma.cliente.findFirst({
    where: { nombre: 'Cliente Test Botones' }
  });

  if (!createdClient) {
    throw new Error('El cliente no se guardó en la base de datos PostgreSQL');
  }
  console.log(`Cliente encontrado en PostgreSQL: ID #${createdClient.id}, Tipo: ${createdClient.tipo}, Descuento: ${createdClient.descuentoPorcentaje}%`);
  
  // Eliminar cliente de prueba de la DB
  await prisma.cliente.delete({ where: { id: createdClient.id } });
  console.log('Cliente de prueba eliminado de la base de datos para limpieza.');
  console.log('✅ Flujo de registro guiado de cliente completado.');

  // ==========================================
  // FLUJO 3: RECEPCIÓN DE PEDIDOS DESDE /COMPRAS
  // ==========================================
  console.log('\n--- TEST 3: Recepción de Pedidos Interactiva ---');

  // Asegurar que hay al menos un proveedor
  const prov = await prisma.proveedor.findFirst();
  const user = await prisma.usuario.findFirst({ where: { usuario: 'admin' } });
  const prod = await prisma.producto.findFirst();

  if (!prov || !user || !prod) {
    throw new Error('Datos incompletos para crear un pedido de prueba (se requiere proveedor, usuario y producto)');
  }

  // Crear un pedido pendiente de prueba
  console.log('Creando pedido de compra pendiente de prueba en la DB...');
  const testOrder = await prisma.pedidoProveedor.create({
    data: {
      proveedorId: prov.id,
      usuarioId: user.id,
      estado: 'Pendiente',
      total: 150.00,
      nroReferencia: 'REF-TEST-BOTON',
      detalles: {
        create: [
          {
            productoId: prod.id,
            cantidad: 5,
            precioCompra: 20.00
          }
        ]
      }
    }
  });
  console.log(`Pedido de prueba #${testOrder.id} creado.`);

  const stockBefore = prod.stock;

  // 3.1 Consultar /compras
  console.log('\n3.1 Solicitando /compras...');
  response = await sendWebhook({ chatId: CHAT_ID, text: '/compras' });
  console.log('Respuesta:', response.output);
  console.log('Botones de Recepción:', response.inline_keyboard ? response.inline_keyboard.map(r => r.map(b => b.text)) : 'No Keyboard');

  // Encontrar el botón de recepción de nuestro pedido
  let recvBtn = null;
  for (const row of response.inline_keyboard) {
    for (const btn of row) {
      if (btn.callback_data === `recv_order:${testOrder.id}`) {
        recvBtn = btn;
      }
    }
  }

  if (!recvBtn) {
    throw new Error(`No se encontró el botón de recepción para el pedido #${testOrder.id}`);
  }
  console.log(`Botón de recepción: "${recvBtn.text}" -> callback: ${recvBtn.callback_data}`);

  // 3.2 Click en recibir pedido
  console.log(`\n3.2 Recibiendo pedido #${testOrder.id} vía botón...`);
  response = await sendWebhook({ chatId: CHAT_ID, callbackQueryData: recvBtn.callback_data });
  console.log('Respuesta:', response.output);

  if (!response.output.includes('Recibido con éxito')) {
    throw new Error('La respuesta del bot no indicó recepción exitosa');
  }

  // Verificar en la DB
  const receivedOrder = await prisma.pedidoProveedor.findUnique({
    where: { id: testOrder.id }
  });
  
  if (receivedOrder.estado !== 'Recibido') {
    throw new Error('El estado del pedido en base de datos no es "Recibido"');
  }

  const updatedProd = await prisma.producto.findUnique({ where: { id: prod.id } });
  console.log(`Stock del producto ${prod.nombre}: Antes = ${stockBefore}, Ahora = ${updatedProd.stock} (Esperado: ${stockBefore + 5})`);
  
  if (updatedProd.stock !== stockBefore + 5) {
    throw new Error('El stock del producto no se incrementó en la cantidad esperada');
  }

  // Limpieza del pedido de prueba
  await prisma.pedidoProveedor.delete({ where: { id: testOrder.id } });
  console.log('Pedido de prueba eliminado de la base de datos para limpieza.');
  console.log('✅ Flujo de recepción interactiva completado.');

  console.log('\n=== ¡TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO! ===');
}

runTests().catch(err => {
  console.error('\n❌ PRUEBA FALLIDA:', err.message || err);
  process.exit(1);
});
