---
name: docker-standard
description: Asegurar el correcto uso de contenedores Docker para desarrollo, manteniendo la imagen optimizada, los volúmenes configurados para live reload y las dependencias del host aisladas.
---
# Estándar de Contenedores y Configuración Docker

Esta skill asegura que el agente trabaje correctamente con Docker, evitando conflictos de dependencias entre la máquina local y el contenedor.

## Guías de Desarrollo en Contenedores

1. **Uso de Imágenes Oficiales y Ligeras**:
   - Para las imágenes base, el agente siempre preferirá versiones alpine oficiales (ej: `node:24-alpine` para la versión 24). Esto mantiene el contenedor ligero y con la mínima superficie de seguridad expuesta.

2. **Aislamiento de `node_modules`**:
   - El agente debe asegurarse de que la carpeta `node_modules` de la máquina local (host) no interfiera con la del contenedor. 
   - El archivo `docker-compose.yml` debe usar volúmenes anónimos (ej: `- /app/node_modules`) para evitar que las dependencias locales se monten y sobrescriban las dependencias del contenedor.
   - El archivo `.dockerignore` debe excluir la carpeta `node_modules` local de la construcción de la imagen.

3. **Soporte de HMR (Hot Module Replacement) en Windows**:
   - Al configurar servidores de desarrollo (como Vite) dentro de contenedores montados en hosts Windows, el agente debe incluir variables de entorno que fuercen el polling de archivos (ej: `WATCHPACK_POLLING=true`, `CHOKIDAR_USEPOLLING=true`). Esto asegura que los cambios realizados en el editor de código local se detecten instantáneamente dentro de Docker.

4. **Variables de Entorno Limpias**:
   - Toda configuración o variable secreta debe ser inyectada a través de variables de entorno en el `docker-compose.yml` o mediante un archivo `.env`, nunca quemadas directamente en el `Dockerfile` ni en el código fuente.
