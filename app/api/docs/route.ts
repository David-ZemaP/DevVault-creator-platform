import { NextRequest, NextResponse } from "next/server";
import { openApiSpec } from "@/lib/docs/openapi";

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");

  if (format === "json") {
    return NextResponse.json(openApiSpec);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevVault Creator Platform API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
  <style>
    body {
      margin: 0;
      background: #0d1117;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .top-nav {
      background: #161b22;
      border-bottom: 1px solid #30363d;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .top-nav a {
      color: #58a6ff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    .top-nav a:hover {
      text-decoration: underline;
    }
    .top-nav .brand {
      font-weight: 700;
      font-size: 15px;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }
    /* Dark theme adaptation for Swagger UI */
    .swagger-ui .topbar { display: none; }
    .swagger-ui {
      background: #0d1117;
      color: #c9d1d9;
    }
    .swagger-ui .info .title {
      color: #ffffff;
    }
    .swagger-ui .info p, .swagger-ui .info li {
      color: #8b949e;
    }
    .swagger-ui .scheme-container {
      background: #161b22;
      box-shadow: none;
      border-bottom: 1px solid #30363d;
    }
    .swagger-ui .opblock .opblock-summary-operation-id,
    .swagger-ui .opblock .opblock-summary-path,
    .swagger-ui .opblock .opblock-summary-path__deprecated {
      color: #c9d1d9;
    }
    .swagger-ui .opblock-tag {
      color: #ffffff;
      border-bottom: 1px solid #30363d;
    }
    .swagger-ui section.models {
      border: 1px solid #30363d;
      border-radius: 8px;
      background: #161b22;
    }
    .swagger-ui section.models h4 {
      color: #ffffff;
    }
  </style>
</head>
<body>
  <nav class="top-nav">
    <div class="brand">
      <span>DevVault Creator Platform</span>
      <span class="badge">OpenAPI 3.0</span>
    </div>
    <div>
      <a href="/api/docs/spec" target="_blank">View Raw JSON Spec &rarr;</a>
    </div>
  </nav>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/spec',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        docExpansion: "list",
        filter: true,
      });
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
