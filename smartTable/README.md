
# SmartTable Frontend

Este proyecto es el frontend de SmartTable, desarrollado en React + TypeScript + Vite.

## Estructura

- `src/app/` — Contiene la aplicación principal, rutas, contexto y componentes.
- `src/services/` — Capa centralizada para peticiones al backend (mockeadas por ahora).
- `src/mocks/` — Datos simulados consumidos por los servicios.

## Desarrollo

Instala dependencias y ejecuta el entorno de desarrollo:

```bash
npm install
npm run dev
```

## Preparado para backend real

La lógica de acceso a datos está centralizada en `src/services/`, por lo que conectar un backend real en el futuro será sencillo.
