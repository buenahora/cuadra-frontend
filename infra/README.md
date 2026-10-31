# Infra del frontend

`frontend.yaml` → stack `alquileres-<env>-frontend`: bucket privado del sitio
y distribución de CloudFront. Lo despliega el CI
(`.github/workflows/deploy.yml`) en cada push a `main`; no se toca a mano.

CloudFront tiene dos orígenes:

- `/*` → el bucket del sitio (el build de Vite).
- `/api/*` → `OriginDomainName` (el ALB del backend), con un header secreto de
  origen que el ALB valida: el secreto lo crea el stack del backend y acá se
  lee de Secrets Manager por nombre.

Depende del stack del backend: el workflow lee de sus outputs `UserPoolId` y
`UserPoolClientId` para el build. Si el stack del backend no existe todavía,
el deploy del frontend falla ahí — es el orden del runbook.

## Configuración del repo

Secrets: `AWS_DEPLOY_ROLE_ARN` (output `FrontendDeployRoleArn` del stack base),
`CFN_EXEC_ROLE_ARN` (output `CfnExecutionRoleArn`).

Variables: `SITE_DOMAIN_NAME`, `ORIGIN_DOMAIN_NAME`, `SITE_CERTIFICATE_ARN`
(certificado ACM en us-east-1), y opcionalmente `AWS_REGION`, `PROJECT`,
`ENVIRONMENT`.

El runbook completo, la tabla de todos los secrets/variables y el orden del
primer despliegue están en el repo del backend: `infra/README.md`.
