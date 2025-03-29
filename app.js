const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Se usará para respaldo de la base de datos
const db = require('./db'); // Conexión a PostgreSQL
const importContentRouter = require('./importContent'); // Router para importar datos
const authRoutes = require("./routes/auth");
const { verificarToken, verificarRol } = require('./middlewares/authMiddleware');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api/auth", authRoutes); // Rutas de autenticación

// ⬇️ Ruta base para verificar el servidor
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

app.get('/api/usuarios', verificarToken, verificarRol(['administrador']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM usuarios ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Eliminar el endpoint GET /api/roles
// app.get('/api/roles', verificarToken, verificarRol(['administrador']), async (req, res) => {
//   try {
//     const result = await db.query('SELECT * FROM roles ORDER BY id');
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error al obtener los roles:', error);
//     res.status(500).json({ error: 'Error al obtener los roles' });
//   }
// });

// ⬇️ Prueba de conexión a la base de datos
app.get('/api/time', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ currentTime: result.rows[0].now });
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

app.get('/api/usuarios/perfil', verificarToken, (req, res) => {
  res.json({
    id: req.usuario.id,
    email: req.usuario.email,
    rol: req.usuario.rol
  });
});

// ⬇️ Montar el endpoint de importación
app.use('/api', importContentRouter);

// ======================================
// 🔹 CRUD DE GRADOS, ÁREAS, TEMAS Y SUBTEMAS
// ======================================

// Corregir la definición de protegerRutasAdmin
const protegerRutasAdmin = [verificarToken, verificarRol(['administrador'])]; // Cambiar 'admin' por 'administrador'

/**
 * Endpoints para "Grados"
 */

/**
 * Obtener todos los grados
 */
app.get('/api/grados', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM grados ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los grados:', error);
    res.status(500).json({ error: 'Error al obtener los grados' });
  }
});

/**
 * Crear un nuevo grado
 */
app.post('/api/grados', protegerRutasAdmin, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const result = await db.query('INSERT INTO grados (nombre) VALUES ($1) RETURNING *', [nombre]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al agregar el grado:', error);
    res.status(500).json({ error: 'Error al agregar el grado' });
  }
});

/**
 * Editar un grado
 */
app.put('/api/grados/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const result = await db.query('UPDATE grados SET nombre = $1 WHERE id = $2 RETURNING *', [nombre, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Grado no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el grado:', error);
    res.status(500).json({ error: 'Error al actualizar el grado' });
  }
});

/**
 * Eliminar un grado
 */
app.delete('/api/grados/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM grados WHERE id = $1', [id]);
    res.json({ message: 'Grado eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el grado:', error);
    res.status(500).json({ error: 'Error al eliminar el grado' });
  }
});

/**
 * Obtener un grado por ID
 */
app.get('/api/grados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM grados WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Grado no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el grado:', error);
    res.status(500).json({ error: 'Error al obtener el grado' });
  }
});

/**
 * Duplicar un grado
 */
app.post('/api/grados/duplicar/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const grado = await db.query('SELECT * FROM grados WHERE id = $1', [id]);
    if (grado.rows.length === 0) return res.status(404).json({ error: 'Grado no encontrado' });

    const { nombre } = grado.rows[0];
    const nuevoNombre = `${nombre} (Copia)`;
    const result = await db.query('INSERT INTO grados (nombre) VALUES ($1) RETURNING *', [nuevoNombre]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al duplicar el grado:', error);
    res.status(500).json({ error: 'Error al duplicar el grado' });
  }
});

/**
 * Endpoints para "Áreas"
 */

/**
 * Obtener todas las áreas
 */
app.get('/api/areas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM areas ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener las áreas:', error);
    res.status(500).json({ error: 'Error al obtener las áreas' });
  }
});

/**
 * Crear una nueva área
 */
app.post('/api/areas', protegerRutasAdmin, async (req, res) => {
  try {
    const { nombre, grado_id } = req.body;
    if (!nombre || !grado_id) return res.status(400).json({ error: 'El nombre y grado_id son obligatorios' });
    const result = await db.query('INSERT INTO areas (nombre, grado_id) VALUES ($1, $2) RETURNING *', [nombre, grado_id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al agregar el área:', error);
    res.status(500).json({ error: 'Error al agregar el área' });
  }
});

/**
 * Editar un área
 */
app.put('/api/areas/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const result = await db.query('UPDATE areas SET nombre = $1 WHERE id = $2 RETURNING *', [nombre, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Área no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el área:', error);
    res.status(500).json({ error: 'Error al actualizar el área' });
  }
});

/**
 * Eliminar un área
 */
app.delete('/api/areas/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM areas WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Área no encontrada' });
    res.json({ message: 'Área eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar el área:', error);
    res.status(500).json({ error: 'Error al eliminar el área' });
  }
});

/**
 * Obtener un área por ID
 */
app.get('/api/areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM areas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Área no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el área:', error);
    res.status(500).json({ error: 'Error al obtener el área' });
  }
});

/**
 * Duplicar un area
 */
app.post('/api/areas/duplicar/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const area = await db.query('SELECT * FROM areas WHERE id = $1', [id]);
    if (area.rows.length === 0) return res.status(404).json({ error: 'Area no encontrado' });

    const { nombre, grado_id } = area.rows[0];
    const nuevoNombre = `${nombre} (Copia)`;
    const result = await db.query('INSERT INTO areas (nombre, grado_id) VALUES ($1, $2) RETURNING *', [nuevoNombre, grado_id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al duplicar el area:', error);
    res.status(500).json({ error: 'Error al duplicar el area' });
  }
});

/**
 * Endpoints para "Temas"
 */

/**
 * Obtener todos los temas
 */
app.get('/api/temas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM temas ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los temas:', error);
    res.status(500).json({ error: 'Error al obtener los temas' });
  }
});

/**
 * Crear un nuevo tema
 */
app.post('/api/temas', protegerRutasAdmin, async (req, res) => {
  try {
    const { nombre, area_id } = req.body;
    if (!nombre || !area_id) return res.status(400).json({ error: 'El nombre y area_id son obligatorios' });
    const result = await db.query('INSERT INTO temas (nombre, area_id) VALUES ($1, $2) RETURNING *', [nombre, area_id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al agregar el tema:', error);
    res.status(500).json({ error: 'Error al agregar el tema' });
  }
});

/**
 * Editar un tema
 */
app.put('/api/temas/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const result = await db.query('UPDATE temas SET nombre = $1 WHERE id = $2 RETURNING *', [nombre, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tema no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el tema:', error);
    res.status(500).json({ error: 'Error al actualizar el tema' });
  }
});

/**
 * Eliminar un tema
 */
app.delete('/api/temas/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM temas WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Tema no encontrado' });
    res.json({ message: 'Tema eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el tema:', error);
    res.status(500).json({ error: 'Error al eliminar el tema' });
  }
});

/**
 * Obtener un tema por ID
 */
app.get('/api/temas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM temas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tema no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el tema:', error);
    res.status(500).json({ error: 'Error al obtener el tema' });
  }
});

/**
 * Duplicar un tema
 */
app.post('/api/temas/duplicar/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const tema = await db.query('SELECT * FROM temas WHERE id = $1', [id]);
    if (tema.rows.length === 0) return res.status(404).json({ error: 'Tema no encontrado' });

    const { nombre, area_id } = tema.rows[0];
    const nuevoNombre = `${nombre} (Copia)`;
    const result = await db.query('INSERT INTO temas (nombre, area_id) VALUES ($1, $2) RETURNING *', [nuevoNombre, area_id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al duplicar el tema:', error);
    res.status(500).json({ error: 'Error al duplicar el tema' });
  }
});

// POST route to create a new user
app.post('/api/usuarios', verificarToken, verificarRol(['administrador']), async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body; // Extract properties from req.body

        // Validate the data
        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({ error: 'Nombre, email, password y rol son obligatorios' });
        }

        // Check if the email is a valid format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Formato de email inválido' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Insert the new user into the database
        const result = await db.query(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, email, hashedPassword, rol]
        );
        res.status(201).json(result.rows[0]); // Respond with the newly created user
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        // Check the type of error and send a more specific message if possible
        if (error.code === '22P02') {
            // "invalid_text_representation" (e.g., invalid integer format)
            return res.status(400).json({ error: 'Formato de datos inválido' });
        } else if (error.code === '23505') {
            // "unique_violation" (e.g., duplicate email)
            return res.status(409).json({ error: 'El email ya está en uso' });
        } else if (error.code === '23502') {
            // "not_null_violation" (e.g., missing required field)
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

// PUT route to update an existing user
app.put('/api/usuarios/:id', verificarToken, verificarRol(['administrador']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol } = req.body; // Extract properties from req.body

    // Validate the data
    if (!nombre || !email || !rol) {
      return res.status(400).json({ error: 'Nombre, email y rol son obligatorios' });
    }

    // Check if the ID is a valid integer
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    // Update the user in the database
    const result = await db.query(
      'UPDATE usuarios SET nombre = $1, email = $2, rol = $3 WHERE id = $4 RETURNING *',
      [nombre, email, rol, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]); // Respond with the updated user
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    // Check the type of error and send a more specific message if possible
    if (error.code === '22P02') {
      // "invalid_text_representation" (e.g., invalid integer format)
      return res.status(400).json({ error: 'Formato de datos inválido' });
    } else if (error.code === '23505') {
      // "unique_violation" (e.g., duplicate email)
      return res.status(409).json({ error: 'El email ya está en uso' });
    }
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// DELETE route to delete an existing user
app.delete('/api/usuarios/:id', verificarToken, verificarRol(['administrador']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the ID is a valid integer
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        // Delete the user from the database
        const result = await db.query(
            'DELETE FROM usuarios WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});

// ======================================
// 🔹 NUEVOS ENDPOINTS: GESTIÓN DE BASE DE DATOS
// ======================================
const backupFile = path.join(__dirname, 'backup.json');

/**
 * Respaldar la base de datos
 */
app.get('/api/backup', async (req, res) => {
  try {
    const grados = await db.query('SELECT * FROM grados');
    const areas = await db.query('SELECT * FROM areas');
    const temas = await db.query('SELECT * FROM temas');
    const articulos = await db.query('SELECT * FROM articulos');

    const backupData = { 
      grados: grados.rows, 
      areas: areas.rows, 
      temas: temas.rows, 
      articulos: articulos.rows 
    };

    res.json(backupData); // Enviar los datos directamente al cliente
  } catch (error) {
    console.error('Error al realizar el respaldo:', error);
    res.status(500).json({ error: 'Error al realizar el respaldo' });
  }
});

/**
 * Importar un respaldo
 */
app.post('/api/restore', async (req, res) => {
  try {
    if (!fs.existsSync(backupFile)) return res.status(400).json({ error: 'No hay respaldo disponible' });

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
    // Eliminar datos de articulos, temas, areas y grados
    await db.query('DELETE FROM articulos');
    await db.query('DELETE FROM temas');
    await db.query('DELETE FROM areas');
    await db.query('DELETE FROM grados');

    for (const grado of backupData.grados) {
      await db.query('INSERT INTO grados (id, nombre) VALUES ($1, $2)', [grado.id, grado.nombre]);
    }
    for (const area of backupData.areas) {
      await db.query('INSERT INTO areas (id, nombre, grado_id) VALUES ($1, $2, $3)', [area.id, area.nombre, area.grado_id]);
    }
    for (const tema of backupData.temas) {
      await db.query('INSERT INTO temas (id, nombre, area_id) VALUES ($1, $2, $3)', [tema.id, tema.nombre, tema.area_id]);
    }
    for (const articulo of backupData.articulos) {
      await db.query(
        'INSERT INTO articulos (id, titulo, contenido, grado_id, area_id, tema_id, usuario_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [articulo.id, articulo.titulo, articulo.contenido, articulo.grado_id, articulo.area_id, articulo.tema_id, articulo.usuario_id || 1, articulo.created_at, articulo.updated_at]
      );
    }
    res.json({ message: 'Base de datos restaurada con éxito' });
  } catch (error) {
    console.error('Error al restaurar la base de datos:', error);
    res.status(500).json({ error: 'Error al restaurar la base de datos' });
  }
});

/**
 * Limpiar la base de datos
 */
app.delete('/api/clear', async (req, res) => {
  try {
    await db.query('DELETE FROM articulos');
    await db.query('DELETE FROM temas');
    await db.query('DELETE FROM areas');
    await db.query('DELETE FROM grados');
    res.json({ message: 'Base de datos limpiada correctamente' });
  } catch (error) {
    console.error('Error al limpiar la base de datos:', error);
    res.status(500).json({ error: 'Error al limpiar la base de datos' });
  }
});

// Eliminar el endpoint POST /api/importarContenidoNuevo
// app.post('/api/importarContenidoNuevo', async (req, res) => {
//   try {
//     let importedCount = 0, newCount = 0, combinedCount = 0;
//     const notImported = [];
//     const fileData = req.body;
//     // ...existing code...
//   } catch (error) {
//     console.error('Error en importarContenidoNuevo:', error);
//     res.status(500).json({ error: 'Error al importar contenido nuevo' });
//   }
// });

// Eliminar el endpoint POST /api/importData
// app.post('/api/importData', verificarToken, verificarRol(['administrador']), async (req, res) => {
//   try {
//     const { tableName, mappings, data } = req.body;
//     // ...existing code...
//   } catch (error) {
//     console.error('Error en /api/importData:', error);
//     res.status(500).json({ message: 'Error al importar datos.' });
//   }
// });

// New API endpoint to get existing data for a table
app.get('/api/getExistingData', verificarToken, verificarRol(['administrador']), async (req, res) => {
    try {
        const { table } = req.query;
        if (!table) {
            return res.status(400).json({ error: 'Table name is required' });
        }
        const result = await db.query(`SELECT * FROM ${table}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting existing data:', error);
        res.status(500).json({ error: 'Failed to get existing data' });
    }
});

// New API endpoint to validate a foreign key
app.get('/api/validateForeignKey', verificarToken, verificarRol(['administrador']), async (req, res) => {
    try {
        const { table, id } = req.query;
        if (!table || !id) {
            return res.status(400).json({ error: 'Table name and ID are required' });
        }
        const result = await db.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
        const exists = result.rows.length > 0;
        res.json({ exists: exists });
    } catch (error) {
        console.error('Error validating foreign key:', error);
        res.status(500).json({ error: 'Failed to validate foreign key', exists: false });
    }
});

// New API endpoint to insert data into a table
app.post('/api/insertData', verificarToken, verificarRol(['administrador']), async (req, res) => {
    try {
        const { tableName, data } = req.body;

        if (!tableName || !data) {
            return res.status(400).json({ error: 'Table name and data are required' });
        }

        // Log para depuración
        console.log(`Insertando datos en la tabla: ${tableName}`, data);

        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;

        try {
            const result = await db.query(query, values);
            res.json(result.rows[0]);
        } catch (dbError) {
            console.error('Error al ejecutar la consulta:', dbError);
            if (dbError.code === '23505') {
                // Error de clave única duplicada
                return res.status(409).json({ error: 'Registro duplicado' });
            } else if (dbError.code === '23503') {
                // Error de clave foránea
                return res.status(400).json({ error: 'Violación de clave foránea' });
            } else {
                return res.status(500).json({ error: 'Error al insertar datos en la base de datos' });
            }
        }
    } catch (error) {
        console.error('Error en /api/insertData:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

// New API endpoint to update data in a table
app.put('/api/updateData', verificarToken, verificarRol(['administrador']), async (req, res) => {
    try {
        const { table, id } = req.query;
        const { data } = req.body;

        if (!table || !id || !data) {
            return res.status(400).json({ error: 'Table name, ID, and data are required' });
        }

        const updates = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
        const values = Object.values(data);
        values.push(id); // Add the ID to the values array

        const query = `UPDATE ${table} SET ${updates} WHERE id = $${values.length} RETURNING *`;
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Failed to update data' });
    }
});

// New API endpoint to get table columns
app.get('/api/getTableColumns', verificarToken, verificarRol(['administrador']), async (req, res) => {
    try {
        const { table } = req.query;
        if (!table) {
            return res.status(400).json({ error: 'El nombre de la tabla es obligatorio' });
        }

        const query = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
        `;
        const result = await db.query(query, [table]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron columnas para la tabla especificada' });
        }

        const columns = result.rows.map(row => row.column_name);
        res.json(columns);
    } catch (error) {
        console.error('Error al obtener las columnas de la tabla:', error);
        res.status(500).json({ error: 'Error al obtener las columnas de la tabla' });
    }
});

/**
 * Verificar si un correo existe en la base de datos
 */
app.get('/api/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'El correo es obligatorio' });
    }

    const result = await db.query('SELECT COUNT(*) AS total FROM usuarios WHERE email = $1', [email]);
    const exists = parseInt(result.rows[0].total, 10) > 0;
    res.json({ exists });
  } catch (error) {
    console.error('Error al verificar el correo:', error);
    res.status(500).json({ error: 'Error al verificar el correo' });
  }
});

/**
 * Registrar un nuevo usuario
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre, rol = 'estudiante' } = req.body;

    console.log("Datos recibidos en el backend:", { email, password, nombre, rol });

    // Validar que el correo, la contraseña y el nombre estén presentes
    if (!email || !password || !nombre) {
      console.error("Error de validación: Faltan datos obligatorios.");
      return res.status(400).json({ error: 'El correo, la contraseña y el nombre son obligatorios.' });
    }

    // Validar el formato del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Error de validación: Formato de correo inválido.");
      return res.status(400).json({ error: 'El formato del correo es inválido.' });
    }

    // Validar el rol si viene
    if (rol !== 'estudiante' && rol !== 'administrador') {
      console.error("Error de validación: Rol inválido.");
      return res.status(400).json({ error: 'El rol debe ser estudiante o administrador.' });
    }

    // Verificar si el correo ya está registrado
    const existingUser = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.error("Error de validación: El correo ya está registrado.");
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }

    // Cifrar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
    const query = `
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const values = [nombre, email, hashedPassword, rol];

    try {
      const result = await db.query(query, values);
      console.log("Usuario creado exitosamente:", result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (dbError) {
      console.error("Error al insertar en la base de datos:", dbError);
      if (dbError.code === '23505') {
        return res.status(409).json({ error: 'El correo ya está registrado.' });
      }
      if (dbError.code === '23502') {
        return res.status(400).json({ error: 'Faltan datos obligatorios en la base de datos.' });
      }
      console.error("Código del error:", dbError.code);
      return res.status(500).json({ error: 'Error al registrar el usuario. Detalle: ' + dbError.message });
    }
  } catch (error) {
    console.error('Error inesperado al registrar el usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario. Detalle: ' + error.message });
  }
});


/**
 * Crear el primer usuario sin autenticación
 */
app.post('/api/usuarios/primer-usuario', async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Validar los datos
        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({ error: 'Nombre, email, password y rol son obligatorios' });
        }

        // Verificar si ya existen usuarios
        const result = await db.query('SELECT COUNT(*) AS total FROM usuarios');
        const existenUsuarios = parseInt(result.rows[0].total, 10) > 0;

        if (existenUsuarios) {
            return res.status(403).json({ error: 'Ya existen usuarios registrados. No se puede crear un usuario sin autenticación.' });
        }

        // Cifrar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario
        const nuevoUsuario = await db.query(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, email, hashedPassword, rol]
        );

        res.status(201).json(nuevoUsuario.rows[0]);
    } catch (error) {
        console.error('Error al crear el primer usuario:', error);
        res.status(500).json({ error: 'Error al crear el primer usuario' });
    }
});

// ======================================
// 🔹 Endpoints para "Articulos"
// ======================================

/**
 * Obtener todos los artículos
 */
app.get('/api/articulos', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM articulos ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los articulos:', error);
    res.status(500).json({ error: 'Error al obtener los articulos' });
  }
});

/**
 * Crear un nuevo artículo
 */
app.post('/api/articulos', protegerRutasAdmin, async (req, res) => {
  try {
    const { titulo, contenido, grado_id, area_id, tema_id, usuario_id } = req.body;
    // [Nuevo] Insertar contenido como JSON sin conversión a string
    const result = await db.query(
      `INSERT INTO articulos (titulo, contenido, grado_id, area_id, tema_id, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [titulo, contenido, grado_id, area_id, tema_id, usuario_id || 1]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear el articulo:', error);
    res.status(500).json({ error: 'Error al crear el articulo' });
  }
});

/**
 * Obtener un artículo por ID
 */
app.get('/api/articulos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM articulos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Artículo no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el articulo:', error);
    res.status(500).json({ error: 'Error al obtener el articulo' });
  }
});

/**
 * Editar un artículo
 */
app.put('/api/articulos/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, grado_id, area_id, tema_id, usuario_id } = req.body;

    // Validación más permisiva
    if (!titulo) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    // Permitir contenido vacío o nulo
    const contenidoToSave = contenido || '';

    const result = await db.query(
      `UPDATE articulos SET 
          titulo = $1, 
          contenido = $2, 
          grado_id = $3,
          area_id = $4, 
          tema_id = $5, 
          usuario_id = COALESCE($6, usuario_id), 
          updated_at = now()
       WHERE id = $7 
       RETURNING *`,
      [
        titulo,
        contenidoToSave,
        grado_id,
        area_id,
        tema_id,
        usuario_id,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Artículo no encontrado" });
    }
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error al actualizar el artículo:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el artículo',
      detalle: error.message
    });
  }
});

/**
 * Eliminar un artículo
 */
app.delete('/api/articulos/:id', protegerRutasAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM articulos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Artículo no encontrado" });
    }
    res.json({ mensaje: 'Artículo eliminado', articulo: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar el articulo:', error);
    res.status(500).json({ error: 'Error al eliminar el articulo' });
  }
});

/**
 * Verificar si existen usuarios en la base de datos
 */
app.get('/api/usuarios/existen', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) AS total FROM usuarios');
        const existenUsuarios = parseInt(result.rows[0].total, 10) > 0;
        res.json({ existenUsuarios });
    } catch (error) {
        console.error('Error al verificar si existen usuarios:', error);
        res.status(500).json({ error: 'Error al verificar si existen usuarios' });
    }
});

/**
 * Crear el primer usuario sin autenticación
 */
app.post('/api/usuarios/primer-usuario', async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Validar los datos
        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({ error: 'Nombre, email, password y rol son obligatorios' });
        }

        // Verificar si ya existen usuarios
        const result = await db.query('SELECT COUNT(*) AS total FROM usuarios');
        const existenUsuarios = parseInt(result.rows[0].total, 10) > 0;

        if (existenUsuarios) {
            return res.status(403).json({ error: 'Ya existen usuarios registrados. No se puede crear un usuario sin autenticación.' });
        }

        // Cifrar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario
        const nuevoUsuario = await db.query(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, email, hashedPassword, rol]
        );

        res.status(201).json(nuevoUsuario.rows[0]);
    } catch (error) {
        console.error('Error al crear el primer usuario:', error);
        res.status(500).json({ error: 'Error al crear el primer usuario' });
    }
});

// ======================================
// 🔹 CONFIGURACIÓN FINAL DEL SERVIDOR
// ======================================

/**
 * Manejar favicon.ico para evitar errores 404
 */
app.get('/favicon.ico', (req, res) => res.status(204));

/**
 * Iniciar el servidor
 */
app.listen(port, () => {
  console.log(`Backend API escuchando en http://localhost:${port}`);
});
