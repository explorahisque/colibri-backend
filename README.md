# Co-Libri Learning Backend

## 📋 Descripción
Backend para la plataforma Co-Libri Learning, un sistema de gestión de contenidos educativos que permite administrar grados, áreas, temas y subtemas.

## 🛠 Tecnologías
- Node.js
- Express
- PostgreSQL
- JWT para autenticación
- bcrypt para encriptación
- CORS habilitado
- dotenv para variables de entorno

## 📦 Requisitos Previos
- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## 🚀 Instalación

1. Clonar el repositorio:
```bash
git clone <repositorio>
cd backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar la base de datos:
```sql
-- Crear la base de datos
CREATE DATABASE educacion;

-- Crear las tablas necesarias
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'usuario',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    grado_id INTEGER REFERENCES grados(id) ON DELETE CASCADE
);

CREATE TABLE temas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    area_id INTEGER REFERENCES areas(id) ON DELETE CASCADE
);

CREATE TABLE subtemas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contenido JSONB,
    tema_id INTEGER REFERENCES temas(id) ON DELETE CASCADE
);
```

4. Configurar variables de entorno:
Crear archivo `.env` con:
```env
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRES_IN=24h
PGUSER=tu_usuario
PGHOST=localhost
PGPASSWORD=tu_contraseña
PGDATABASE=educacion
PGPORT=5432
```

5. Iniciar el servidor:
```bash
npm start
```

## 🔑 Autenticación

### Endpoints de Autenticación

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "explora@hisque.com.co",
    "password": "tu_contraseña"
}
```

#### Verificar Perfil
```http
GET /api/usuarios/perfil
Authorization: Bearer <token>
```

## 📚 API Endpoints

### Grados

- `GET /api/grados` - Obtener todos los grados
- `POST /api/grados` - Crear nuevo grado
- `PUT /api/grados/:id` - Actualizar grado
- `DELETE /api/grados/:id` - Eliminar grado
- `GET /api/grados/:id` - Obtener grado por ID

### Áreas

- `GET /api/areas` - Obtener todas las áreas
- `POST /api/areas` - Crear nueva área
- `PUT /api/areas/:id` - Actualizar área
- `DELETE /api/areas/:id` - Eliminar área
- `GET /api/areas/:id` - Obtener área por ID

### Temas

- `GET /api/temas` - Obtener todos los temas
- `POST /api/temas` - Crear nuevo tema
- `PUT /api/temas/:id` - Actualizar tema
- `DELETE /api/temas/:id` - Eliminar tema
- `GET /api/temas/:id` - Obtener tema por ID

### Subtemas

- `GET /api/subtemas` - Obtener todos los subtemas
- `POST /api/subtemas` - Crear nuevo subtema
- `PUT /api/subtemas/:id` - Actualizar subtema
- `DELETE /api/subtemas/:id` - Eliminar subtema
- `GET /api/subtemas/:id` - Obtener subtema por ID
- `GET /api/subtemas/:id/contenido` - Obtener contenido del subtema
- `POST /api/subtemas/duplicar/:id` - Duplicar subtema

### Gestión de Base de Datos

- `GET /api/backup` - Crear respaldo de la base de datos
- `POST /api/restore` - Restaurar base de datos desde respaldo
- `DELETE /api/clear` - Limpiar base de datos
- `POST /api/importarContenidoNuevo` - Importar contenido nuevo

## 📊 Estructura de Datos

### Contenido de Subtema (JSON)
```json
{
    "tema": {
        "fuente1": [
            {
                "title": "Título del recurso",
                "link": "URL del recurso",
                "snippet": "Descripción breve"
            }
        ],
        "fuente2": [
            "Contenido textual"
        ]
    }
}
```

## 🔒 Seguridad

- Autenticación mediante JWT
- Protección de rutas administrativas
- Encriptación de contraseñas con bcrypt
- Validación de datos de entrada
- CORS configurado

## 🔄 Integración con Frontend

1. Configurar la URL base en el frontend:
```javascript
const API_URL = 'http://localhost:3000';
```

2. Incluir el token en las peticiones:
```javascript
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
};
```

3. Manejar respuestas de error:
```javascript
if (response.status === 401) {
    // Redirigir a login
    window.location.href = '/login.html';
}
```

## 🛟 Manejo de Errores

- Todos los endpoints retornan errores en formato JSON
- Códigos de estado HTTP apropiados
- Mensajes de error descriptivos
- Logging de errores en consola

## 📝 Scripts Disponibles

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

## 🔧 Mantenimiento

### Respaldo de Base de Datos
```bash
pg_dump -U usuario educacion > backup.sql
```

### Restaurar Base de Datos
```bash
psql -U usuario educacion < backup.sql
```

## 👥 Contribución

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/NuevaCaracteristica`
3. Commit cambios: `git commit -m 'Añadir nueva característica'`
4. Push a la rama: `git push origin feature/NuevaCaracteristica`
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.
