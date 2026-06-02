# TP N.º 6 — Aeropuertos Globales

## 1. Descripción del Proyecto

Aplicación web full-stack diseñada para visualizar, buscar, crear, editar y eliminar aeropuertos de todo el mundo sobre un mapa interactivo. El sistema utiliza **MongoDB** como base de datos principal para el almacenamiento persistente de aeropuertos, y **Redis** en dos instancias independientes para resolver dos problemas específicos: consultas de geolocalización (aeropuertos cercanos a un punto) y ranking de popularidad (aeropuertos más consultados).

El frontend se desarrolló con **React** y **Leaflet**, mostrando los aeropuertos como marcadores sobre un mapa con soporte de clustering para manejar grandes volúmenes de datos sin saturar la interfaz. El backend es una **API REST** construida con **NestJS** que expone endpoints CRUD, consultas geoespaciales y estadísticas de acceso.

Todos los servicios se orquestan con **Docker Compose**, permitiendo desplegar el sistema completo con un solo comando.

---

## 2. Objetivos del Trabajo Práctico

El trabajo práctico propone construir un sistema de gestión de aeropuertos que integre **dos bases de datos NoSQL** con roles complementarios:

### Almacenamiento Principal — MongoDB

MongoDB se utiliza como base de datos primaria, almacenando la información completa de cada aeropuerto: nombre, ciudad, coordenadas geográficas, altitud, zona horaria y códigos IATA/ICAO. Se eligió MongoDB por su flexibilidad de esquema, ya que no todos los aeropuertos tienen los mismos campos (algunos carecen de código ICAO, otros de altitud), y un modelo documental permite representar esta variabilidad sin tablas rígidas.

### Redis GEO — Geolocalización

Redis se emplea en su módulo GEO para almacenar las coordenadas de los aeropuertos y resolver consultas de cercanía como *"¿qué aeropuertos hay en un radio de 50 km alrededor de esta coordenada?"*. Esto se logra con los comandos `GEOADD` para inserción, `GEOSEARCH` para consultas por radio y `ZREM` para eliminación. Se optó por Redis GEO en lugar de consultas geoespaciales en MongoDB porque Redis, al trabajar en memoria, ofrece latencias de milisegundos para este tipo de operaciones.

### Redis Popularidad — Ranking de Accesos

Una segunda instancia de Redis mantiene un **Sorted Set** (`ZSET`) llamado `airport_popularity` que cuenta cuántas veces se consulta cada aeropuerto. Cada vez que un usuario hace clic en un marcador del mapa, se dispara una petición `GET /airports/{code}` que incrementa el contador con `ZINCRBY`. El ranking puede consultarse mediante `ZRANGE...REV WITHSCORES`.

El set de popularidad tiene un **TTL de 24 horas** (`EXPIRE 86400`), de modo que el ranking se reinicia diariamente y refleja la actividad reciente.

### Carga Inicial de Datos

El proyecto incluye un archivo `data_trasport.json` con datos de más de 2000 aeropuertos reales. Al iniciar el backend por primera vez, un `SeedService` implementado con `OnModuleInit` detecta que la base de datos está vacía y ejecuta automáticamente:

1. Inserción de todos los aeropuertos en la colección `airports` de MongoDB.
2. Registro de cada coordenada en Redis GEO mediante `GEOADD`.

Si los datos ya existen (por ejemplo, tras un reinicio del contenedor), el proceso se salta automáticamente.

### Frontend con Leaflet

El frontend muestra todos los aeropuertos como marcadores sobre un mapa en estilo oscuro (CartoDB dark). Se utiliza `MarkerClusterGroup` de `react-leaflet-cluster` para agrupar marcadores cercanos y evitar saturación visual en zonas con alta densidad de aeropuertos, como Europa o Estados Unidos. Al hacer clic en un marcador:

1. Se envía una petición `GET /airports/{code}` al backend.
2. Se muestra un popup con los datos reales del aeropuerto (nombre, código, ciudad, elevación, zona horaria).
3. El backend registra la consulta como una visita en el ranking de popularidad.

### Docker Compose

Todos los servicios se orquestan con Docker Compose, definiendo cinco contenedores:

| Servicio     | Rol                                          |
| ------------ | -------------------------------------------- |
| `mongodb`    | Base de datos principal                      |
| `redis-geo`  | Almacenamiento geoespacial para cercanía     |
| `redis-pop`  | Ranking de popularidad con TTL               |
| `backend`    | API REST NestJS                              |
| `frontend`   | Cliente React con Leaflet (servido con Nginx)|

---

## 3. Tecnologías Utilizadas

### 3.1 MongoDB — Base de Datos Principal

**¿Por qué MongoDB?**

El dominio del problema —aeropuertos— presenta datos con estructura semi-estructurada: no todos los aeropuertos tienen código ICAO, algunos registran altitud y otros no, y la zona horaria es un campo opcional. MongoDB, con su modelo de documentos JSON-like, permite almacenar esta variabilidad de forma natural, sin necesidad de definir columnas nullables ni esquemas rígidos.

Además, MongoDB ofrece índices geoespaciales (`2dsphere`) que podrían utilizarse como alternativa a Redis GEO, aunque en este proyecto se optó por Redis para las consultas de cercanía por su menor latencia.

La interacción con MongoDB se realiza a través de **Mongoose**, un ODM (Object Document Mapper) que proporciona tipado, validación y una API fluida para operaciones CRUD. NestJS se integra con Mongoose mediante `MongooseModule`, que se configura con la URL de conexión y se importa en el módulo raíz de la aplicación.

### 3.2 Redis — Geolocalización y Popularidad

**¿Por qué Redis?**

Redis es una base de datos clave-valor en memoria que ofrece estructuras de datos especializadas. Para este TP se utilizan dos de sus funcionalidades:

- **Redis GEO**: Almacena coordenadas geográficas en un Sorted Set interno utilizando codificación geohash. Esto permite ejecutar consultas como `GEOSEARCH` para encontrar puntos dentro de un radio determinado. La operación es puramente en memoria, con latencias típicas de menos de 1 ms.

- **Redis Sorted Sets**: El ZSET `airport_popularity` mantiene un ranking ordenado por score. `ZINCRBY` incrementa el contador de visitas para un aeropuerto, y `ZRANGE...REV WITHSCORES` devuelve los más populares en orden descendente.

El servicio `RedisService` mantiene dos clientes separados (`geoClient` y `popClient`), cada uno conectado a su respectiva instancia de Redis definida en Docker Compose.

### 3.3 NestJS — Backend API REST

**¿Por qué NestJS?**

NestJS es un framework para construir aplicaciones Node.js del lado del servidor con una arquitectura modular inspirada en Angular. Proporciona:

- **Inyección de dependencias**: Los servicios se declaran como `@Injectable()` y se inyectan en los controladores mediante el constructor, lo que facilita el testing y el desacoplamiento.
- **Módulos**: Cada funcionalidad se encapsula en un módulo (`@Module()`) que declara sus propios controladores, servicios y dependencias.
- **Decoradores**: Las rutas HTTP, parámetros y validaciones se definen mediante decoradores (`@Get()`, `@Post()`, `@Body()`, `@Param()`), manteniendo el código declarativo y legible.
- **Swagger**: Integración nativa con `@nestjs/swagger` para generar documentación interactiva de la API.

El `ValidationPipe` global está configurado con `whitelist: true` y `forbidNonWhitelisted: true`, lo que garantiza que solo los campos definidos en los DTOs lleguen al servicio, rechazando automáticamente cualquier campo no esperado.

### 3.4 React + Leaflet — Frontend

**¿Por qué React?**

React permite construir interfaces de usuario declarativas basadas en componentes. Cada parte de la interfaz (mapa, lista, formulario, búsqueda) es un componente independiente con su propio estado y lógica. Esto facilita mantener la UI sincronizada con los datos de la aplicación.

**¿Por qué Leaflet?**

Leaflet es la librería de mapas interactivos más madura del ecosistema JavaScript. `react-leaflet` proporciona componentes React para integrarla de forma natural, y `react-leaflet-cluster` agrega clustering de marcadores con mínima configuración.

El hook `useAirportFilters` utiliza `useMemo` para evitar recalcular el filtrado en cada render, ya que la lista de aeropuertos puede ser extensa. El hook `useNotification` centraliza la lógica de temporizador y estado de las notificaciones.

### 3.5 Docker Compose — Orquestación

**¿Por qué Docker Compose?**

Docker Compose permite definir y ejecutar aplicaciones multi-contenedor con una configuración declarativa en YAML. Cada servicio corre en su propio contenedor con redes, volúmenes y dependencias claramente especificadas. Con un solo comando (`docker compose up`) se inician todos los servicios en el orden correcto.

**Variables de entorno:**

```yaml
backend:
  environment:
    - MONGO_URL=mongodb://mongodb:27017/airport_db
    - REDIS_GEO_URL=redis://redis-geo:6379
    - REDIS_POP_URL=redis://redis-pop:6379
  depends_on:
    - mongodb
    - redis-geo
    - redis-pop
```

Cada servicio es referenciable por su nombre DNS dentro de la red de Docker, por lo que el backend se conecta a `mongodb`, `redis-geo` y `redis-pop` sin necesidad de direcciones IP fijas.

---

## 4. Arquitectura del Sistema

```
┌─────────────┐     ┌──────────────────────────────────────────────────────┐
│             │     │                   Backend (NestJS)                   │
│   Cliente   │     │                                                      │
│  (React +   │────▶│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│   Leaflet)  │     │  │Controller│──▶│  Service  │──▶│  Mongoose (ODM)  │──▶──▶  MongoDB
│             │     │  └──────────┘  └─────┬─────┘  └──────────────────┘  │
└─────────────┘     │                      │                               │
                    │                      ▼                               │
                    │              ┌─────────────────┐                     │
                    │              │  RedisService    │                     │
                    │              ├─────────────────┤                     │
                    │              │  geoClient ──────▶─────────────────────┼──▶  redis-geo:6379
                    │              │  popClient  ─────▶─────────────────────┼──▶  redis-pop:6380
                    │              └─────────────────┘                     │
                    └──────────────────────────────────────────────────────┘
```

### Flujo de operaciones

1. **Carga inicial de datos**: Al arrancar, `SeedService` (que implementa `OnModuleInit`) verifica la cantidad de documentos en MongoDB y la cardinalidad de la clave GEO en Redis. Si ambos están vacíos, lee el archivo `data_trasport.json`, inserta cada aeropuerto en MongoDB y registra sus coordenadas en Redis GEO.

2. **Visualización en el mapa**: El frontend carga todos los aeropuertos mediante `GET /airports` y los renderiza como marcadores clusterizados sobre el mapa.

3. **Consulta de un aeropuerto**: Cuando el usuario hace clic en un marcador, el frontend envía `GET /airports/{code}` al backend. El servicio busca el aeropuerto en MongoDB, registra la visita en Redis Popularidad mediante `ZINCRBY`, y devuelve los datos al frontend para mostrarlos en un popup.

4. **Búsqueda de aeropuertos cercanos**: `GET /airports/nearby?lat=...&lng=...&radius=50` ejecuta `GEOSEARCH` en Redis GEO para obtener los códigos de aeropuertos dentro del radio especificado, y luego consulta MongoDB para completar los datos de cada uno.

5. **Operaciones CRUD**: La creación y actualización de aeropuertos operan sobre MongoDB y sincronizan automáticamente Redis GEO. La eliminación remueve el aeropuerto de ambas bases de datos y también del ranking de popularidad.

---

## 5. Modelo de Datos

### Documento en MongoDB — Colección `airports`

Los campos `iata_faa` e `icao` están definidos con `{ sparse: true }` en el esquema de Mongoose, lo que permite que sean opcionales pero únicos cuando están presentes.

### Redis GEO — Clave `airports-geo`

Redis almacena internamente cada coordenada como un elemento de un Sorted Set, donde el score es la coordenada codificada en geohash de 52 bits:

### Redis Popularidad — Clave `airport_popularity`

SortedSet con TTL de 24 horas

---

## 6. API REST

Base URL: `http://localhost:3000/api`

### Endpoints

| Método | Ruta                    | Descripción                                          | Parámetros                                   |
| ------ | ----------------------- | ---------------------------------------------------- | -------------------------------------------- |
| `POST`   | `/airports`             | Crear un nuevo aeropuerto                            | Cuerpo JSON con `name`, `city`, `iata_faa`, `icao`, `lat`, `lng`, `alt` (opcional), `tz` (opcional) |
| `GET`    | `/airports`             | Obtener todos los aeropuertos                        | `?search=` (filtro por nombre), `?city=` (filtro por ciudad) |
| `GET`    | `/airports/{code}`      | Obtener un aeropuerto por código IATA o ICAO         | — |
| `PUT`    | `/airports/{code}`      | Actualizar un aeropuerto                             | Cuerpo JSON con los campos a actualizar |
| `DELETE` | `/airports/{code}`      | Eliminar un aeropuerto                               | — |
| `GET`    | `/airports/nearby`      | Aeropuertos cercanos a una coordenada                | `?lat=` (requerido), `?lng=` (requerido), `?radius=` (opcional, default 50 km) |
| `GET`    | `/airports/popular`     | Top 10 aeropuertos más visitados                     | — |

### Ejemplos de uso

```bash
# Crear un aeropuerto
curl -X POST http://localhost:3000/api/airports \
  -H "Content-Type: application/json" \
  -d '{"name":"Aeropuerto de Prueba","city":"Buenos Aires","iata_faa":"TST","icao":"SATD","lat":-34.5,"lng":-58.4}'

# Listar aeropuertos
curl http://localhost:3000/api/airports

# Buscar por nombre
curl "http://localhost:3000/api/airports?search=ezeiza"

# Obtener un aeropuerto (incrementa popularidad)
curl http://localhost:3000/api/airports/EZE

# Aeropuertos cercanos a Buenos Aires (radio 100 km)
curl "http://localhost:3000/api/airports/nearby?lat=-34.6&lng=-58.4&radius=100"

# Top 10 populares
curl http://localhost:3000/api/airports/popular
```

La documentación interactiva generada con Swagger está disponible en `http://localhost:3000/api/docs` cuando el backend está en ejecución.

---

## 7. Frontend — Visualización en Mapa

El frontend es una Single Page Application (SPA) desarrollada con React 19 y Vite 8. Se estructura en componentes independientes que se comunican mediante props y hooks.

### Mapa con Clustering

El componente `AirportMap` renderiza un `MapContainer` de `react-leaflet` centrado en coordenada `[20, 0]` con zoom 3 (vista mundial). Las capas del mapa son:

- **TileLayer**: Utiliza el servicio CartoDB dark (`dark_all`) para un estilo visual oscuro y moderno.
- **MarkerClusterGroup**: Agrupa marcadores cercanos y los despliega al hacer zoom, mejorando el rendimiento y la legibilidad.
- **Markers**: Cada aeropuerto con coordenadas válidas se representa como un marcador con el icono por defecto de Leaflet.

### Panel Lateral (Glassmorphism)

El panel lateral superpuesto al mapa utiliza el efecto glassmorphism (fondo semitransparente con `backdrop-filter: blur()`) para integrarse visualmente con el mapa sin ocultarlo. Contiene:

1. **Título y descripción**: Identificación de la aplicación.
2. **Búsqueda**: Dos campos de texto — uno para búsqueda por nombre y otro para filtro por ciudad — con botones de "Buscar" y "Limpiar".
3. **Lista de aeropuertos**: Muestra hasta 100 resultados con el código (IATA/ICAO), nombre y ciudad de cada aeropuerto. Al hacer clic en un elemento, el mapa se desplaza suavemente (flyTo) hasta la posición del aeropuerto.
4. **Ranking de populares**: Los 10 aeropuertos más visitados, con su nombre y cantidad de visitas, actualizados después de cada consulta.
5. **Botón "+ Nuevo"**: Abre un modal para crear un nuevo aeropuerto.

### Modal de Formulario

El componente `AirportForm` se muestra como un modal overlay con campos para todos los datos del aeropuerto. Valida que latitud y longitud sean números válidos antes de enviar. Se utiliza tanto para crear como para editar, distinguiendo el modo según si recibe o no un aeropuerto existente como prop.

### Notificaciones

El hook `useNotification` maneja notificaciones transitorias que aparecen en la parte inferior de la pantalla con una animación de slide-up. Se muestran en color verde para operaciones exitosas y rojo para errores, desapareciendo automáticamente después de 3 segundos.

---

## 8. Docker Compose

### Archivo `docker-compose.yml`

Define cinco servicios y un volumen persistente:

```yaml
services:
  mongodb:
    image: mongo:latest
    container_name: mongo-aeropuertos
    ports: ["27018:27017"]
    volumes: [mongo_data:/data/db]

  redis-geo:
    image: redis:alpine
    container_name: redis-geo-aeropuertos
    ports: ["6379:6379"]

  redis-pop:
    image: redis:alpine
    container_name: redis-pop-aeropuertos
    ports: ["6380:6379"]

  backend:
    build: ./backend
    container_name: api-backend-aeropuertos
    ports: ["3000:3000"]
    environment:
      - MONGO_URL=mongodb://mongodb:27017/airport_db
      - REDIS_GEO_URL=redis://redis-geo:6379
      - REDIS_POP_URL=redis://redis-pop:6379
    depends_on: [mongodb, redis-geo, redis-pop]

  frontend:
    build: ./frontend
    container_name: frontend-aeropuertos
    ports: ["80:80"]
    depends_on: [backend]

volumes:
  mongo_data:
```

### Servicios

| Servicio     | Imagen          | Puerto Host | Puerto Contenedor | Propósito                        |
| ------------ | --------------- | ----------- | ----------------- | -------------------------------- |
| `mongodb`    | `mongo:latest`  | `27018`     | `27017`           | Base de datos principal          |
| `redis-geo`  | `redis:alpine`  | `6379`      | `6379`            | Geolocalización geoespacial      |
| `redis-pop`  | `redis:alpine`  | `6380`      | `6379`            | Ranking de popularidad           |
| `backend`    | build local     | `3000`      | `3000`            | API REST NestJS                  |
| `frontend`   | build local     | `80`        | `80`              | Cliente React + Nginx            |

### Desarrollo con hot-reload

El archivo `docker-compose.dev.yml` utiliza `Dockerfile.dev` tanto para backend como para frontend, montando los directorios de código como volúmenes para que los cambios se reflejen en tiempo real sin necesidad de reconstruir las imágenes.

---

## 9. Cómo Ejecutar el Proyecto

### Requisitos

- Docker Engine 24+ y Docker Compose 2.20+ instalados.
- Puertos 80, 3000, 6379, 6380 y 27018 disponibles (modificables en `docker-compose.yml`).

### Puesta en marcha

```bash
# 1. Clonar el repositorio y acceder al directorio
git clone <url-del-repo> tp6-airports
cd tp6-airports

# 2. Iniciar todos los servicios
docker compose up -d

# 3. Verificar que los contenedores estén corriendo
docker compose ps

# 4. Esperar 30-60 segundos a que el backend complete la carga inicial de datos.
#    Si es la primera ejecución, el SeedService importará automáticamente
#    los aeropuertos desde data_trasport.json.

# 5. Acceder desde el navegador:
#    - Frontend:    http://localhost
#    - API:         http://localhost:3000/api
#    - Swagger:     http://localhost:3000/api/docs
```

### Modo desarrollo

```bash
docker compose -f docker-compose.dev.yml up -d
# Frontend con hot-reload en http://localhost:5173
```

### Detener y limpiar

```bash
# Detener servicios (los datos persisten)
docker compose down

# Detener y eliminar volúmenes (borra todos los datos)
docker compose down -v
```
