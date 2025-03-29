-- Limpieza inicial
DROP TABLE IF EXISTS articulos CASCADE;
DROP TABLE IF EXISTS temas CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS grados CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('administrador', 'estudiante'))
);

-- Tabla de grados
CREATE TABLE grados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de áreas
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de temas
CREATE TABLE temas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

-- Tabla de artículos con valor por defecto en 'contenido'
CREATE TABLE articulos (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    contenido JSONB NOT NULL DEFAULT '[
      {
        "titulo": "Título del primer elemento",
        "descripcion": "<h2>Título ejemplo</h2><p>Acá copiar y pegar todo el contenido incluyendo</p><a href=''https://ejemplo.com/''>",
        "link": "Por el momento dejar vacío, si hay links incluirlos en la descripción",
        "multimedia": ["https://ejemplo.com/imagen.jpg", "https://ejemplo.com/video.mp4"],
        "fuente": "Mencionar la fuente o dejar vacía"
      },
      {
        "titulo": "Título del primer elemento",
        "descripcion": "<h2>Título ejemplo</h2><p>Acá copiar y pegar todo el contenido incluyendo</p><a href=''https://ejemplo.com/''>",
        "link": "Por el momento dejar vacío, si hay links incluirlos en la descripción",
        "multimedia": ["https://ejemplo.com/imagen.jpg", "https://ejemplo.com/video.mp4"],
        "fuente": "Mencionar la fuente o dejar vacía"
      }
    ]'::jsonb,
    grado_id INTEGER NOT NULL REFERENCES grados(id) ON DELETE CASCADE,
    area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    tema_id INTEGER NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
