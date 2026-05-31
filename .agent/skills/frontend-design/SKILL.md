---
name: frontend-design
description: Evitar interfaces genéricas ("AI slop") mediante la elección consciente de una dirección estética, tipografía con carácter, asimetrías y transiciones físicas en micro-interacciones.
---
# Directrices de Diseño de Interfaces Premium (Anti-AI Slop)

Esta skill obliga al agente a diseñar con criterio estético premium y evitar los diseños de interfaz sobreutilizados y aburridos que suelen generar las inteligencias artificiales por defecto.

## Principios Estéticos Fundamentales

1. **Compromiso con una Dirección Estética**:
   - Antes de escribir cualquier código de estilo, el agente debe declarar y documentar qué estética va a usar (ej: brutalista digital, neo-brutalista, minimalista editorial, retro-futurista, skeumórfico suave, etc.) y mantenerla coherente en toda la interfaz.

2. **Prohibición de Elementos Genéricos ("AI Slop")**:
   - **No** usar tipografías estándar del navegador o Inter de forma aburrida.
   - **No** usar gradientes genéricos de púrpura a azul sin un propósito visual bien justificado.
   - **No** crear el clásico diseño de cuadrícula simétrica de 3 tarjetas idénticas a menos que sea la única alternativa lógica.

3. **Tipografía con Carácter**:
   - Utilizar combinaciones tipográficas complementarias con personalidad (ej: combinar una fuente Serif con carácter para encabezados con una Sans-serif limpia para cuerpo de texto).
   - Definir una jerarquía clara de pesos (`font-bold`, `font-medium`, `font-light`) y contrastar tamaños de forma intencional.

4. **Diseño Espacial y Composición**:
   - Utilizar el espacio en blanco (espacio negativo) de forma creativa para guiar el flujo visual.
   - Introducir asimetrías controladas, traslapes de tarjetas, imágenes que rompan la grilla y alineaciones dinámicas que den dinamismo al scroll.

5. **Movimiento Físico y Micro-interacciones**:
   - Todos los elementos interactivos (botones, enlaces, tarjetas clickeables) deben reaccionar con micro-animaciones físicas.
   - Usar transiciones fluidas en cambios de estado (`transition-all duration-300 ease-out` o físicas usando curvas cúbicas).
   - Los hovers no deben limitarse a cambiar la opacidad; deben proponer cambios de escala suaves, sombras proyectadas o desplazamientos tridimensionales ligeros.
