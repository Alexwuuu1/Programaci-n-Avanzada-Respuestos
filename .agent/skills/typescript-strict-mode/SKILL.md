---
name: typescript-strict-mode
description: Forzar código tipado estricto sin any, definiendo interfaces de TypeScript antes de implementar lógica.
---
# TypeScript y Estándares de Tipado Estricto

Esta skill obliga al agente a mantener un código TypeScript riguroso, reduciendo errores en tiempo de compilación y asegurando que las integraciones modulares encajen sin fallos.

## Reglas de Desarrollo en TypeScript

1. **Definición de Interfaces Primero**:
   - Antes de escribir cualquier lógica en un componente o hook, el agente **debe declarar explícitamente los tipos e interfaces de TypeScript** en la cabecera del archivo o en un archivo `.types.ts` adyacente.
   - Ejemplo:
     ```typescript
     export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       variant?: 'default' | 'outline' | 'ghost'
       isLoading?: boolean
     }
     ```

2. **Prohibición Estricta de `any`**:
   - Queda totalmente prohibido el uso del tipo genérico `any` en cualquier parte del código.
   - En su lugar, el agente debe usar tipos específicos o, si el tipo es verdaderamente desconocido, `unknown` (acompañado de type guards si es necesario).

3. **Configuración Estricta de Retornos**:
   - Todas las funciones (incluyendo hooks y peticiones a APIs en `services/`) deben declarar explícitamente el tipo de dato que retornan.
   - Ejemplo:
     ```typescript
     export const fetchUser = async (id: string): Promise<User> => { ... }
     ```

4. **Integración con Linters (ESLint y Prettier)**:
   - Respetar de forma rigurosa las reglas definidas en `eslint.config.js`. No omitir advertencias ni desactivar reglas de tipado mediante comentarios `eslint-disable` a menos que sea explícitamente validado por el usuario.
