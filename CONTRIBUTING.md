# Cómo añadir tu herramienta a StickyBit Tools

Cada herramienta es un fichero `tools/<slug>.yml`. Hay dos formas de enviarla:

## Opción A — Issue (la más fácil)
Abre un [issue "Enviar herramienta"](../../issues/new?template=submit-tool.yml) y rellena el formulario. Un moderador creará la ficha.

## Opción B — Pull Request
1. Haz fork y copia `tools/_example.yml` a `tools/mi-herramienta.yml`.
   - Atajo: `npm run new -- https://github.com/usuario/repo --category recon --tags go,cli` genera el fichero consultando GitHub.
2. Rellena los campos y ejecuta `npm run validate`.
3. Abre el PR. Se valida automáticamente y un moderador lo revisa.

## Campos

| Campo | Obligatorio | Notas |
|---|---|---|
| `name` | sí | Máx. 40 caracteres |
| `repo` | sí | `https://github.com/<usuario>/<repo>`, público |
| `description` | sí | 20–200 caracteres |
| `category` | sí | `recon`, `osint`, `web`, `network`, `defensive`, `ctf`, `forensics`, `other` |
| `author` | sí | Tu usuario de GitHub |
| `tags` | no | Hasta 6, en minúsculas: `[python, cli]` |
| `language`, `license` | no | Se rellenan desde GitHub con `npm run build:github` |

## Requisitos
- Repositorio **público** con **licencia** y **README** con instrucciones de uso.
- Eres el autor o tienes su permiso.
- **No se admite**: malware, ransomware, stealers, datos filtrados o herramientas diseñadas para uso malicioso/no autorizado.
- StickyBit solo enlaza a GitHub: no aloja binarios ni código.
- El autor puede pedir la retirada de su herramienta en cualquier momento (borrando su `.yml`).
