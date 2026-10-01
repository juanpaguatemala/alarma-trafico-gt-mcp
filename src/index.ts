import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { env } from "cloudflare:workers";

function createServer() {
  const server = new McpServer(
    {
      name: "alarma-trafico-gt-mcp",
      version: "1.0.0",
    },
    {
      instructions:
        "Usa publicar_alerta únicamente cuando el usuario haya terminado de preparar una alerta de Alarma Tráfico GT. " +
        "Envía exactamente el texto final de publicación en contenido. No envíes explicaciones ni borradores.",
    }
  );

  server.registerTool(
    "publicar_alerta",
    {
      title: "Publicar alerta de tránsito",
      description:
        "Envía una alerta final de Alarma Tráfico GT al sistema de publicación. " +
        "Debe usarse únicamente con el texto final listo para publicar.",
      inputSchema: {
        nivel: z.enum(["rojo", "amarillo", "verde"]),
        tipo: z.string().min(1),
        ubicacion: z.string().min(1),
        resumen: z.string().min(1),
        contenido: z.string().min(1),
        estado: z.string().default("ACTIVO"),
        fuente: z.string().default("CHATGPT"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ nivel, tipo, ubicacion, resumen, contenido, estado, fuente }) => {
      if (!env.AT_APPS_SCRIPT_URL) {
        return {
          isError: true,
          content: [{ type: "text", text: "Falta configurar AT_APPS_SCRIPT_URL en Cloudflare." }],
        };
      }

      if (!env.AT_FEED_SECRET) {
        return {
          isError: true,
          content: [{ type: "text", text: "Falta configurar el secreto AT_FEED_SECRET en Cloudflare." }],
        };
      }

      const response = await fetch(env.AT_APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: env.AT_FEED_SECRET,
          nivel,
          tipo,
          ubicacion,
          resumen,
          contenido,
          estado,
          fuente,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Apps Script respondió HTTP ${response.status}: ${text.slice(0, 1000)}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Alerta enviada correctamente al feed. Respuesta del sistema: ${text.slice(0, 1000)}`,
          },
        ],
      };
    }
  );

  return server;
}

const handler = createMcpHandler(createServer, {
  route: "/mcp",
  legacy: "reject",
});

export default {
  fetch(request: Request, envArg: Env, ctx: ExecutionContext) {
    return handler(request, envArg, ctx);
  },
} satisfies ExportedHandler<Env>;
