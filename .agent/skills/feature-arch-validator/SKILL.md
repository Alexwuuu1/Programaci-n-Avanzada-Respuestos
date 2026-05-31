---
name: feature-arch-validator
description: Validar y forzar la separación por módulos (Feature-Driven Development) y el principio de Aislamiento de Contexto para ahorrar tokens.
---
# Validación de Arquitectura por Características (Feature-Driven) y Aislamiento de Contexto

Esta skill regula cómo debe estructurarse el código y cómo el agente debe interactuar con los archivos para minimizar el consumo de tokens y asegurar la modularidad.

## Reglas de Estructura (Feature-Driven Development)

1. **Separación por Características**:
   - Todo módulo funcional de la aplicación debe crearse dentro de `src/features/<nombre-caracteristica>/`.
   - Cada característica debe ser autónoma y contener sus propios componentes y lógica.
   - Directorio de ejemplo:
     ```text
     src/features/landing/
     ├── components/        # Componentes exclusivos de la landing
     ├── hooks/             # Custom hooks exclusivos
     ├── services/          # Llamadas a API de la landing
     └── Landing.tsx        # Componente contenedor principal
     ```

2. **Componentes Atómicos Reutilizables**:
   - Los componentes de interfaz genéricos e independientes del negocio (botones, inputs, modales, etc.) deben colocarse en `src/components/ui/` (usualmente importados de Shadcn UI).
   - Componentes de layout global (Header, Footer, Sidebar) deben ir en `src/components/layout/`.

3. **Limitación de Tamaño de Archivo**:
   - **Ningún** archivo de componente debe exceder las 150 líneas de código.
   - Si un componente excede este límite, el agente debe proactivamente refactorizarlo, extrayendo lógica a custom hooks (`hooks/`) o subcomponentes más pequeños.

## Reglas de Ahorro de Tokens (Aislamiento de Contexto)

1. **Aislamiento Activo**:
   - Para resolver cualquier tarea o bug, el agente **solo** leerá o analizará archivos pertenecientes a la característica activa (ej: si trabajas en `src/features/auth/`, el agente no debe cargar archivos de `src/features/landing/`).
   - El agente no debe listar ni leer directorios completos recursivamente a menos que sea estrictamente necesario para resolver la integración.

2. **Búsquedas de Contexto Precisas**:
   - Utilizar herramientas de búsqueda focalizada (`grep_search`) buscando identificadores o selectores específicos, en lugar de leer archivos completos.
