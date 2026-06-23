# Repuestos La Paz - Sistema ERP con Agente de IA y Bot de Telegram

Este repositorio contiene la solución completa de gestión para **Repuestos La Paz**: un ERP Web moderno, un Bot de Telegram interactivo, un orquestador de flujos en n8n y un modelo de lenguaje local (Ollama) integrado con la base de datos de producción.

---

## 🛠️ Requisitos Previos

Antes de levantar el proyecto en una máquina nueva, asegúrate de tener instalado:
1. **Docker Desktop** (con soporte para WSL2 en Windows).
2. **Ollama** (descargado de [ollama.com](https://ollama.com/)).
3. **Node.js** (v18 o superior, opcional para herramientas locales).
4. **Git**.

---

## 🚀 Guía de Puesta en Marcha (Paso a Paso)

### Paso 1: Clonar el Repositorio y Entrar
```bash
git clone https://github.com/Alexwuuu1/Programaci-n-Avanzada-Respuestos.git
cd Programaci-n-Avanzada-Respuestos
git checkout proyecto-avanzado
```

### Paso 2: Levantar los Contenedores
Inicia los servicios base del ERP (Base de Datos, Backend, Frontend y Administrador de DB):
```bash
docker compose up -d
```
Adicionalmente, inicia los contenedores del ecosistema de n8n y el túnel de ngrok:
```bash
docker start sager-n8n sager-ngrok
```

### Paso 3: Generar Cliente de Base de Datos y Sembrar Datos (Seed)
Para asegurar que Prisma esté sincronizado y la base de datos PostgreSQL contenga información de prueba (Kardex, ventas, empleados y clientes):

1. **Generar Cliente Prisma:**
   ```bash
   docker exec proyectoprogramacion-backend-1 npx prisma generate
   ```
2. **Empujar el Esquema a PostgreSQL:**
   ```bash
   docker exec proyectoprogramacion-backend-1 npx prisma db push
   ```
3. **Sembrar Datos Iniciales:**
   ```bash
   docker exec proyectoprogramacion-backend-1 npm run seed
   ```
4. **Reiniciar Backend (para limpiar caché de Prisma):**
   ```bash
   docker restart proyectoprogramacion-backend-1
   ```

### Paso 4: Levantar Ollama (IA Local)
El sistema requiere que el servidor de Ollama esté corriendo para clasificar y responder las preguntas en lenguaje natural.
1. Abre la aplicación **Ollama** en tu máquina host o ejecuta en la terminal:
   ```bash
   ollama serve
   ```
2. Asegúrate de tener descargado el modelo configurado en n8n (ej: `llama3.1`):
   ```bash
   ollama pull llama3.1
   ```

---

## 🌐 Configuración del Túnel ngrok (Web vs. Telegram)

Las cuentas gratuitas de ngrok solo permiten tener **un túnel activo a la vez**. Puedes decidir qué parte del sistema exponer al exterior:

### Opción A: Exponer la Web del ERP (Permite compartir el ERP por URL)
Detén el túnel de n8n y corre ngrok redirigiendo al puerto `5173` de la web:
```bash
docker stop sager-ngrok
docker rm sager-ngrok
docker run -d --name sager-ngrok --network proyectoprogramacion_default -e NGROK_AUTHTOKEN=<TU_TOKEN> ngrok/ngrok:latest http web:5173 --url=<TU_DOMINIO_ESTATICO>
```

### Opción B: Exponer el Bot de Telegram (Permite interactuar con el Bot desde el celular)
Detén el túnel de la web y corre ngrok redirigiendo al puerto `5678` de n8n:
```bash
docker stop sager-ngrok
docker rm sager-ngrok
docker run -d --name sager-ngrok --network proyectoprogramacion_default -e NGROK_AUTHTOKEN=<TU_TOKEN> ngrok/ngrok:latest http sager-n8n:5678 --url=<TU_DOMINIO_ESTATICO>
```
*Nota: Tras cambiar a la Opción B, reinicia el contenedor de n8n (`docker restart sager-n8n`) para que registre la URL del webhook en los servidores de Telegram.*

---

## 🔑 Credenciales del Sistema de Prueba

| Usuario | Contraseña | Rol / Permisos | Empleado Asociado |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`admin123`** | **Administrador (Acceso Total)** | Carlos Mendoza |
| **`andrea`** | **`andrea123`** | **Vendedor (Módulo Ventas)** | Andrea Rojas |
| **`maria`** | **`maria123`** | **Cajero (Caja y Ventas)** | Maria Chavez |
| **`jose`** | **`jose123`** | **Operario (Producción)** | Jose Mamani |
| **`luis`** | **`luis123`** | **Operario (Producción)** | Luis Torrico |

* **Adminer (Gestor PostgreSQL):** Disponible localmente en [http://localhost:8080](http://localhost:8080) (Motor: PostgreSQL, Servidor: `db`, Usuario: `admin`, Contraseña: `admin_pass`, Base de datos: `repuestos_db`).
* **n8n Workflow Editor:** Acceso local en [http://localhost:5678](http://localhost:5678).

---

## 🤖 Uso de los Agentes de IA

1. **ERP Web:** Ingresa al apartado **Agentes IA** en el menú lateral. Encontrarás el chat unificado. Puedes realizar cualquier consulta de stock, ventas o finanzas, o usar los **Atajos de Consulta** rápidos del panel derecho para cargar preguntas de ejemplo con un clic.
2. **Bot de Telegram:** Busca tu bot en Telegram, presiona el botón físico **`🔎 Buscar Stock`** para navegar por categorías o interactúa libremente en lenguaje natural.
