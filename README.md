# Alarma Tráfico GT — MCP

Servidor MCP remoto para enviar la alerta final de Alarma Tráfico GT a Google Apps Script.

## Variables obligatorias en Cloudflare

- `AT_APPS_SCRIPT_URL`
  - La URL `/exec` del Apps Script.
- `AT_FEED_SECRET`
  - El mismo secreto configurado como `AT_FEED_SECRET` en las propiedades del Apps Script.

## Endpoint

Después del despliegue:

`https://NOMBRE-DE-TU-WORKER.workers.dev/mcp`

## Herramienta

`publicar_alerta`

Campos:
- nivel
- tipo
- ubicacion
- resumen
- contenido
- estado
- fuente

No pongas secretos en este repositorio. Configúralos como secretos/variables del Worker.
