---
name: git-semantic-commit
description: Forzar confirmaciones de Git semánticas y prohibir estrictamente al agente ejecutar Git o GitHub de forma automática o sin autorización explícita.
---
# Control de Git Semántico y Restricciones de Automatización

Esta skill rige el comportamiento del agente respecto al sistema de control de versiones Git, asegurando un historial limpio y previniendo ejecuciones automáticas no deseadas.

## Restricción de Automatización de Git/GitHub (¡CRÍTICO!)

1. **Prohibición de Ejecución Automática**:
   - **Queda estrictamente prohibido que el agente ejecute cualquier comando de Git** (como `git init`, `git add`, `git commit`, `git status`, `git push`, etc.) o de GitHub CLI (`gh`) de forma automática, silenciosa o proactiva tras realizar ediciones de código.
   - El agente **solo** puede proponer o ejecutar comandos de Git si el usuario lo solicita explícitamente en el prompt de la conversación.

## Convención de Commits Semánticos (Conventional Commits)

Cuando el usuario solicite explícitamente realizar un commit, el mensaje debe seguir estrictamente el estándar de **Conventional Commits**:

1. **Formato**:
   `<tipo>(<ámbito>): <descripción corta en minúsculas>`

2. **Tipos permitidos**:
   - `feat`: Nueva característica para el usuario.
   - `fix`: Corrección de un bug.
   - `docs`: Cambios únicamente en la documentación.
   - `style`: Cambios que no afectan el significado del código (espacios, formateo, comillas faltantes, etc.).
   - `refactor`: Cambio de código que no corrige un bug ni añade una característica.
   - `chore`: Tareas de mantenimiento, actualización de dependencias o configuraciones del build.

3. **Ejemplos**:
   - `feat(auth): add login form validation`
   - `fix(landing): fix layout shift on mobile devices`
   - `style(components): run prettier on button component`
