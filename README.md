# wsa_mobile_app

## Build local con Docker (EAS Android)

Este repo incluye un flujo reproducible para ejecutar `eas build --platform android --local --docker` usando solo Docker Desktop (sin WSL ni instalación local de Node/OpenJDK).

### Archivos añadidos

- `docker/Dockerfile.eas-cli`: imagen mínima basada en `node:20-bullseye` con `eas-cli` y dependencias como Git, Java 17 y Python.
- `docker-compose.eas.yml`: define el servicio `eas` que monta el repo, comparte cachés (`./docker/cache/*`) y conecta el socket de Docker del host (`DOCKER_SOCK_PATH`).
- `docker/scripts/local-android-build.sh`: script helper que ejecuta `eas build --local --docker` con el perfil indicado y coloca el `.aab` dentro de `build-artifacts/`.

### Pasos

1. **Preparar Docker Desktop**  
   - Asegúrate de que Docker Desktop esté corriendo.  
   - Si estás en Windows, exporta `DOCKER_SOCK_PATH=//./pipe/docker_engine` antes de ejecutar `docker compose`. En Linux/macOS no hace falta (usa `/var/run/docker.sock` por defecto).

2. **Construir la imagen CLI**  
   ```bash
   docker compose -f docker-compose.eas.yml build eas
   ```

3. **Instalar dependencias del proyecto** (esto se hace dentro del contenedor para evitar tocar tu máquina):  
   ```bash
   docker compose -f docker-compose.eas.yml run --rm eas npm install
   ```

4. **Autenticarse en Expo/EAS**  
   - Puedes iniciar sesión interactiva:  
     ```bash
     docker compose -f docker-compose.eas.yml run --rm eas eas login
     ```
   - O bien usar `EXPO_TOKEN`/`EAS_BUILD_PROFILE` como variables de entorno cuando ejecutes el build:  
     ```bash
     EXPO_TOKEN=tu-token docker compose -f docker-compose.eas.yml run --rm eas ./docker/scripts/local-android-build.sh production
     ```

5. **Crear un build Android local**  
   ```bash
   # Usa el perfil configurado en eas.json (por defecto \"preview\")
   docker compose -f docker-compose.eas.yml run --rm eas ./docker/scripts/local-android-build.sh

   # Para un perfil distinto (ej. production) y con flags extra como --clear-cache:
   docker compose -f docker-compose.eas.yml run --rm eas ./docker/scripts/local-android-build.sh production --clear-cache
   ```
   El archivo `.aab` quedará en `build-artifacts/app-<perfil>.aab` dentro del repo.

### Notas

- Los directorios `docker/cache/*` almacenan cachés de Expo, Gradle y Android para acelerar builds subsecuentes.
- Si necesitas pasar credenciales de keystore o variables secretas, utiliza `--env-file .env` o `-e CLAVE=valor` al invocar `docker compose run`.
- El comando usa siempre `--docker`, así que el build real ocurre en la imagen oficial de Expo; el contenedor `eas` solo actúa como wrapper Linux estable.

### Configuración de Resend para "Olvidé mi contraseña"

1. **Variables en `.env`**

   ```bash
   EXPO_PUBLIC_RESEND_API_KEY=re_XXXXXXXXXXXXXX
   EXPO_PUBLIC_RESEND_FROM=soporte@alwswsa.shop
   EXPO_PUBLIC_ADMIN_EMAIL=admin@alwswsa.shop
   ```

2. **Permitir variables en Expo**

   El archivo `app.config.ts` importa `dotenv/config` y expone `resendKey`, `resendFrom` y `adminEmail` dentro de `expo.extra`, lo que garantiza su disponibilidad en tiempo de ejecución (incluido EAS Build).

3. **Helper de envío**

   `services/emailService.ts` usa la API de Resend para mandar los dos correos (empleado y administración) cuando un usuario solicita restablecer su contraseña.
