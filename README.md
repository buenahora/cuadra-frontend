# Cuadra — Frontend

Aplicación web de Cuadra en React + Vite: los 20 flujos de los tres grupos de
usuario (persona que busca alquiler, propietario que publica, corredor), más
las pantallas de auth.

**Tagline:** El precio justo, cuadra por cuadra.

## Quickstart

```bash
npm install
cp .env.example .env     # VITE_API_BASE_URL -> backend local en :8000
                         # VITE_CARTO_API_KEY -> tiles del mapa (sin ella dicen "API KEY REQUIRED")
npm run dev              # http://localhost:5173
```

Para levantar frontend + backend juntos (y chequear el warehouse de la data
layer) hay un script en la carpeta que contiene los tres repos:
`bash ../scripts/start_stack.sh`.

Scripts: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.

## Estructura

```
src/screens/      Las pantallas, agrupadas por grupo de usuario (grupo1/2/3, auth)
src/components/   Componentes compartidos; src/components/ui/ los primitivos y los gráficos
src/api/          Cliente HTTP del backend (client.js) y un módulo por recurso
src/lib/          Formato, geo, stats, favoritos, token
src/data/         Datos todavía hardcodeados (barrios, fotos, mocks de geo)
design/           Entregables de UX/UI del curso: informe, manual de marca, guía de estilos, pitch, prototipos
infra/            CloudFormation del stack del frontend (S3 + CloudFront)
```

## Deploy

El CI despliega solo. En cada push a `main`,
`.github/workflows/deploy.yml`:

1. lint;
2. lee `UserPoolId` / `UserPoolClientId` de los outputs del stack del backend;
3. `npm run build` apuntando a `https://<SITE_DOMAIN_NAME>/api`;
4. `aws cloudformation deploy` de `infra/frontend.yaml`;
5. `aws s3 sync dist/` al bucket del sitio + invalidación de CloudFront.

Qué secrets y variables hay que configurar: `infra/README.md`. El runbook
completo de infra vive en el repo del backend (`infra/README.md` de
`cuadra-backend`).

## Estado

Prototipo funcional. Varias pantallas siguen con datos hardcodeados en
`src/data/`; la API real existe (ver el repo del backend) y se va enchufando
pantalla por pantalla.
