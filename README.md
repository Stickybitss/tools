# StickyBit Tools

Directorio comunitario de herramientas de ciberseguridad (futuro `tools.stickybit.es`).

Generador estático **sin dependencias** (solo Node ≥ 20). Produce `dist/`, que se puede alojar en cualquier hosting estático (Cloudflare Pages, GitHub Pages, Netlify…).

## Uso

```bash
npm run dev            # build + servidor en http://localhost:4321 (se reconstruye al editar)
npm run build          # genera dist/
npm run build:github   # igual, añadiendo stars/lenguaje/licencia reales desde la API de GitHub
npm run validate       # valida tools/*.yml
npm test               # tests
npm run new -- <url>   # crea tools/<slug>.yml desde un repo de GitHub
```

Para `build:github` puedes exportar `GITHUB_TOKEN` y evitar el límite de peticiones.

## Estructura

```
tools/*.yml        Una herramienta por fichero (los "_*.yml" se ignoran)
site.json          URL del sitio, enlaces de comunidad y de envío
src/               styles.css, extra.css, client.js
scripts/           build, validate, serve, new-tool, tests
.github/           Formulario de envío, plantilla de PR y validación en CI
dist/              Salida (no versionada)
```

## Qué genera `dist/`
`index.html`, una ficha por herramienta en `tool/<slug>/`, `tools.json` (API pública), `sitemap.xml`, `robots.txt`, `404.html`.

## Flujo de envío de herramientas

```
Autor ──▶ botón "Enviar herramienta" ──▶ formulario de GitHub (issue)
                                              │
                                              ▼
                              Aviso en Discord (notify-discord.yml)
                                              │
                    moderador revisa y pone la etiqueta «aprobada»
                                              │
                                              ▼
                  Se crea solo un PR con tools/<slug>.yml (approve-tool.yml)
                                              │
                         moderador pulsa «Merge» ──▶ se publica la web
```

Si la ficha no se puede crear (repo privado, sin licencia, duplicado…), el bot comenta el motivo en el issue y quita la etiqueta.

### Configuración (una sola vez, en GitHub)

1. **Webhook de Discord**: en el canal de moderadores → *Editar canal* → *Integraciones* → *Webhooks* → *Nuevo webhook* → copiar la URL.
2. En el repo: *Settings → Secrets and variables → Actions → New repository secret*
   - Nombre: `DISCORD_WEBHOOK_URL`, valor: la URL del webhook.
3. En el repo: *Settings → Actions → General → Workflow permissions*: marcar **Read and write permissions** y **Allow GitHub Actions to create and approve pull requests**.
4. Crear dos etiquetas (*Issues → Labels*): `nueva-herramienta` y `aprobada`.
5. Ajustar `site.json` (`repoUrl`, `submitUrl`, `githubUrl`, `discordUrl`) con la organización real.

> La URL del webhook es un secreto: nunca la pongas en el código ni en `site.json`.

## Pendiente antes de publicar
- [ ] Revisar `site.json` (organización de GitHub, URL del formulario, Discord).
- [ ] Borrar las entradas `demo: true` al llegar herramientas reales.
- [ ] Elegir hosting y conectar `tools.stickybit.es`.
- [ ] Imagen Open Graph para compartir en redes.

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para enviar una herramienta.
