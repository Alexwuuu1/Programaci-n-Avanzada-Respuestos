---
name: ux-flow-validator
description: Forzar diseño Mobile-First y validar flujos felices (Happy Path) y de error (Edge Cases) antes de escribir código UI.
---
# Validación de Flujos de Experiencia de Usuario (UX)

Esta skill obliga al agente a realizar un análisis previo de usabilidad y estructuración de flujos antes de proponer e implementar código visual.

## Directrices de Diseño y UX

1. **Enfoque Mobile-First**:
   - Toda interfaz debe ser diseñada pensando primero en pantallas móviles. El agente debe implementar estilos responsivos que partan de la base móvil y se adapten a pantallas de escritorio usando los breakpoints de Tailwind (`md:`, `lg:`, `xl:`).

2. **Validación de Flujos antes del Código**:
   - Antes de escribir la UI de una característica, el agente debe definir de manera explícita en su pensamiento y propuesta:
     - **Happy Path (Caso de Éxito)**: El flujo normal que realiza el usuario (ej: llena formulario correctamente -> botón cambia a loading -> se muestra mensaje de éxito).
     - **Edge Cases (Casos de Error y Límites)**: Cómo responde la aplicación si algo sale mal (ej: error de servidor -> botón sale del estado loading -> se muestra alerta de error y se guardan los datos ingresados para que el usuario no tenga que reescribirlos).
     - **Estados de Carga e Interactividad**: La presencia de spinners, esqueletos de carga y estados deshabilitados en botones para evitar dobles clics o clics accidentales.

3. **Accesibilidad (A11y)**:
   - Utilizar atributos ARIA correspondientes, roles semánticos HTML y asegurar la navegación por teclado (focus outlines visibles) para todos los elementos interactivos, apoyándose en los primitivos accesibles de Radix UI.
