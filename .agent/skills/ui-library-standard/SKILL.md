---
name: ui-library-standard
description: Uso consistente de Shadcn/UI y Radix Primitives para construir interfaces con Tailwind CSS sin duplicar código.
---
# Estándar de Componentes de Interfaz (Shadcn/UI & Radix)

Esta skill define la guía para la creación e importación de componentes UI de presentación para mantener una interfaz coherente y ligera.

## Guías de UI/UX y Construcción de Componentes

1. **Uso de `src/components/ui/`**:
   - Todo componente UI base (como Button, Input, Dialog, Dropdown, etc.) debe importarse desde `@/components/ui`.
   - Antes de crear un nuevo componente visual desde cero, el agente debe verificar si ya existe en `src/components/ui/` o si está disponible en la biblioteca de Shadcn UI.
   - Si no existe en el proyecto pero es un componente de Shadcn, el agente debe instalarlo utilizando la CLI correspondiente (`npx shadcn@latest add <componente>`) o crearlo manualmente basándose en Radix Primitives y Tailwind.

2. **Composición de TailwindCSS**:
   - Para modificar estilos o comportamientos en un componente, se debe extender su API mediante la propiedad `className` combinada con la función `cn(...)`.
   - No escribir CSS personalizado en archivos externos para componentes atómicos; usar siempre las clases de utilidad de Tailwind CSS.

3. **Sin Componentes Duplicados**:
   - No crear archivos como `CustomButton.tsx` o `MyDialog.tsx` si ya existe un `@/components/ui/button` o `@/components/ui/dialog`. En su lugar, componer usando las variantes y propiedades de los componentes existentes.
