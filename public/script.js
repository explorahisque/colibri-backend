document.addEventListener('DOMContentLoaded', function() {
    const tableSelect = document.getElementById('tableSelect');
    const tableContainer = document.getElementById('tableContainer');
    const modalsContainer = document.getElementById('modalsContainer');

    let currentTable = '';

    tableSelect.addEventListener('change', async function() {
        const selectedTable = tableSelect.value;
        if (selectedTable) {
            await loadTableData(selectedTable);
        } else {
            tableContainer.innerHTML = ''; // Limpiar la tabla si no hay selección
        }
    });

    async function loadTableData(tableName) {
        try {
            const token = localStorage.getItem('token'); // Obtener el token del localStorage
            const response = await fetch(`http://localhost:3000/api/${tableName}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Incluir el token en el encabezado
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    tableContainer.innerHTML = '<p class="text-red-500">Error: No autorizado. Por favor, inicia sesión como administrador.</p>';
                    return;
                } else {
                    throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
                }
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                tableContainer.innerHTML = '<p class="text-red-500">Error: Los datos recibidos no son un array.</p>';
                console.error('Data received:', data);
                return;
            }

            renderTable(tableName, data);
        } catch (error) {
            console.error('Error fetching data:', error);
            tableContainer.innerHTML = `<p class="text-red-500">Error fetching data: ${error.message}</p>`;
        }
    }

    function renderTable(tableName, data) {
        let html = `<table class="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">`;
        
        // Renderizar encabezados
        html += `<thead><tr>`;
        const columns = Object.keys(data[0] || {});
        columns.forEach(column => {
            html += `<th class="py-2 px-4 border-b font-semibold text-gray-700">${column}</th>`;
        });
        html += `<th class="py-2 px-4 border-b font-semibold text-gray-700">Acciones</th>`; // Columna de acciones
        html += `</tr></thead>`;
    
        // Renderizar filas
        html += `<tbody>`;
        data.forEach(row => {
            html += `<tr>`;
            columns.forEach(column => {
                let cellValue = row[column];
                if (tableName === 'articulos' && column === 'contenido') {
                    cellValue = row[column]; // Mostrar como está (puede ser [object Object])
                }
                html += `<td class="py-2 px-4 border-b text-gray-700">${cellValue}</td>`;
            });
            html += `<td class="py-2 px-4 border-b text-gray-700">
                        <button class="edit-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2" data-id="${row.id}">Editar</button>
                        <button class="delete-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" data-id="${row.id}">Eliminar</button>
                        <button class="duplicate-btn bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2" data-id="${row.id}">Duplicar</button>
                    </td>`;
            html += `</tr>`;
        });
        html += `</tbody>`;
    
        html += `</table>`;
        tableContainer.innerHTML = html;
    
        // Agregar botón de "Agregar Nuevo"
        tableContainer.innerHTML += `<button id="addBtn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4">Agregar Nuevo</button>`;
    
        // Event listeners para los botones
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => openEditModal(tableName, button.dataset.id, data.find(item => item.id == button.dataset.id)));
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => openDeleteModal(tableName, button.dataset.id));
        });
        document.querySelectorAll('.duplicate-btn').forEach(button => {
            button.addEventListener('click', () => openDuplicateModal(tableName, button.dataset.id));
        });
        document.getElementById('addBtn').addEventListener('click', () => openAddModal(tableName));
    }
    

    async function openAddModal(tableName) {
        let modalHtml = `
            <div id="addModal" class="fixed z-10 inset-0 overflow-y-auto bg-gray-500 bg-opacity-75">
                <div class="flex items-center justify-center min-h-screen">
                    <div class="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 class="text-2xl font-bold mb-4">Agregar Nuevo ${tableName}</h2>
                        <form id="addForm">
        `;

        // Define the form fields directly
        let columns;
        if (tableName === 'usuarios') {
            columns = ['nombre', 'email', 'password', 'rol'];
        } else if (tableName === 'roles') {
            columns = ['nombre'];
        } else if (tableName === 'grados') {
            columns = ['nombre'];
        } else if (tableName === 'areas') {
            columns = ['nombre', 'grado_id'];
        } else if (tableName === 'temas') {
            columns = ['nombre', 'area_id'];
        } else if (tableName === 'articulos') {
            columns = ['nombre', 'tema_id', 'contenido'];
        } else {
            // Handle other tables or show an error
            alert('Tabla no soportada para agregar nuevos elementos.');
            return;
        }

        columns.forEach(column => {
            let inputField;
            if (tableName === 'articulos' && column === 'contenido') {
                inputField = `<textarea id="${column}" name="${column}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" rows="5"></textarea>`;
            } else {
                inputField = `<input type="text" id="${column}" name="${column}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">`;
            }
            modalHtml += `
                <div class="mb-4">
                    <label for="${column}" class="block text-gray-700 text-sm font-bold mb-2">${column}</label>
                    ${inputField}
                </div>
            `;
        });

        modalHtml += `
                        <div class="flex justify-end">
                            <button type="button" id="cancelAddBtn" class="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">Cancelar</button>
                            <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modalsContainer.innerHTML = modalHtml;

        const addModal = document.getElementById('addModal');
        addModal.style.display = 'block';

        document.getElementById('cancelAddBtn').addEventListener('click', () => {
            addModal.style.display = 'none';
        });

        document.getElementById('addForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/${tableName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    addModal.style.display = 'none';
                    await loadTableData(tableName);
                } else {
                    console.error('Error adding data:', response.status);
                    alert('Error al agregar los datos.');
                }
            } catch (error) {
                console.error('Error adding data:', error);
                alert('Error al agregar los datos.');
            }
        });
    }
    

    async function openEditModal(tableName, id, rowData) {
        let modalHtml = `
            <div id="editModal" class="fixed z-10 inset-0 overflow-y-auto bg-gray-500 bg-opacity-75">
                <div class="flex items-center justify-center min-h-screen">
                    <div class="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 class="text-2xl font-bold mb-4">Editar ${tableName}</h2>
                        <form id="editForm">
        `;

        const columns = Object.keys(rowData || {});

        columns.forEach(column => {
            let inputField;
            let value = rowData[column];
            if (tableName === 'articulos' && column === 'contenido') {
                // Ya no intentamos formatear como JSON
                inputField = `<textarea id="${column}" name="${column}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" rows="5">${value || ''}</textarea>`;
            } else {
                inputField = `<input type="text" id="${column}" name="${column}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="${value || ''}">`;
            }

            modalHtml += `
                <div class="mb-4">
                    <label for="${column}" class="block text-gray-700 text-sm font-bold mb-2">${column}</label>
                    ${inputField}
                </div>
            `;
        });

        modalHtml += `
                        <div class="flex justify-end">
                            <button type="button" id="cancelEditBtn" class="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">Cancelar</button>
                            <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        `;

        modalsContainer.innerHTML = modalHtml;

        const editModal = document.getElementById('editModal');
        editModal.style.display = 'block';

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            editModal.style.display = 'none';
        });

        document.getElementById('editForm').addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(event.target);
            const data = {};
            formData.forEach((value, key) => {
                // Ya no intentamos parsear JSON para el contenido
                data[key] = value;
            });

            try {
                const token = localStorage.getItem('token'); // Obtener el token del localStorage
                const response = await fetch(`/api/${tableName}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Incluir el token en la cabecera
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    editModal.style.display = 'none';
                    await loadTableData(tableName);
                } else {
                    const errorData = await response.json();
                    console.error('Error updating data:', response.status);
                    alert(errorData.error || 'Error al actualizar los datos.');
                }
            } catch (error) {
                console.error('Error updating data:', error);
                alert('Error al actualizar los datos.');
            }
        });
    }
    

    async function openDeleteModal(tableName, id) {
        let modalHtml = `
            <div id="deleteModal" class="fixed z-10 inset-0 overflow-y-auto bg-gray-500 bg-opacity-75">
                <div class="flex items-center justify-center min-h-screen">
                    <div class="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 class="text-2xl font-bold mb-4">Eliminar ${tableName}</h2>
                        <p>¿Estás seguro de que quieres eliminar este elemento?</p>
                        <div class="flex justify-end mt-4">
                            <button type="button" id="cancelDeleteBtn" class="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">Cancelar</button>
                            <button type="button" id="confirmDeleteBtn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Eliminar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modalsContainer.innerHTML = modalHtml;

        const deleteModal = document.getElementById('deleteModal');
        deleteModal.style.display = 'block';

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });

        document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
            try {
                const token = localStorage.getItem('token'); // Obtener el token del localStorage
                const response = await fetch(`/api/${tableName}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Incluir el token en la cabecera
                    }
                });
    
                if (response.ok) {
                    deleteModal.style.display = 'none';
                    await loadTableData(tableName);
                } else {
                    console.error('Error deleting data:', response.status);
                    alert('Error al eliminar los datos.');
                }
            } catch (error) {
                console.error('Error deleting data:', error);
                alert('Error al eliminar los datos.');
            }
        });
    }

    async function openDuplicateModal(tableName, id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/${tableName}/duplicar/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (response.ok) {
                await loadTableData(tableName);
            } else {
                console.error('Error duplicating data:', response.status);
                alert('Error al duplicar los datos.');
            }
        } catch (error) {
            console.error('Error duplicating data:', error);
            alert('Error al duplicar los datos.');
        }
    }

    async function cargarDatos() {
        try {
            const [grados, areas, temas, articulos] = await Promise.all([
                fetch('/api/grados').then(res => res.json()),
                fetch('/api/areas').then(res => res.json()),
                fetch('/api/temas').then(res => res.json()),
                fetch('/api/articulos').then(res => res.json())
            ]);
        
            const contenedor = document.getElementById('contenidos');
            contenedor.innerHTML = '';
        
            grados.forEach(grado => {
                const divGrado = document.createElement('div');
                divGrado.innerHTML = `
                    <h2 class="text-2xl font-bold">${grado.nombre}</h2>
                    <button onclick="editarGrado(${grado.id})" class="px-3 py-1 bg-yellow-500 text-white rounded">✏️ Editar</button>
                    <button onclick="eliminarGrado(${grado.id})" class="px-3 py-1 bg-red-500 text-white rounded">🗑️ Eliminar</button>
                `;
        
                const areasDelGrado = areas.filter(area => area.grado_id === grado.id);
                areasDelGrado.forEach(area => {
                    const divArea = document.createElement('div');
                    divArea.innerHTML = `
                        <h3 class="text-xl font-semibold ml-4">${area.nombre}</h3>
                        <button onclick="editarArea(${area.id})" class="px-3 py-1 bg-yellow-500 text-white rounded">✏️ Editar</button>
                        <button onclick="eliminarArea(${area.id})" class="px-3 py-1 bg-red-500 text-white rounded">🗑️ Eliminar</button>
                    `;
        
                    const temasDelArea = temas.filter(tema => tema.area_id === area.id);
                    temasDelArea.forEach(tema => {
                        const divTema = document.createElement('div');
                        divTema.innerHTML = `
                            <h4 class="text-lg font-medium ml-8">${tema.nombre}</h4>
                            <button onclick="editarTema(${tema.id})" class="px-3 py-1 bg-yellow-500 text-white rounded">✏️ Editar</button>
                            <button onclick="eliminarTema(${tema.id})" class="px-3 py-1 bg-red-500 text-white rounded">🗑️ Eliminar</button>
                        `;
        
                        // Mostramos artículos asociados al tema
                        const articulosDelTema = articulos.filter(art => art.tema_id === tema.id);
                        articulosDelTema.forEach(art => {
                            const divArt = document.createElement('div');
                            divArt.classList.add("bg-white", "shadow", "p-4", "rounded-lg", "w-4/5", "ml-12", "mb-4");
                            divArt.innerHTML = `
                                <p class="font-semibold">${art.titulo}</p>
                                <button onclick="editarArticulo(${art.id})" class="px-3 py-1 bg-yellow-500 text-white rounded">✏️ Editar</button>
                                <button onclick="viewArticulo(${art.id}, '${art.titulo}')" class="px-3 py-1 bg-blue-500 text-white rounded">📝 Ver Contenido</button>
                                <button onclick="duplicarArticulo(${art.id})" class="px-3 py-1 bg-blue-500 text-white rounded">📑 Duplicar</button>
                                <button onclick="confirmarEliminar(${art.id})" class="px-3 py-1 bg-red-500 text-white rounded">🗑️ Eliminar</button>
                            `;
                            divTema.appendChild(divArt);
                        });
                        divArea.appendChild(divTema);
                    });
        
                    divGrado.appendChild(divArea);
                });
                contenedor.appendChild(divGrado);
            });
        } catch (error) {
            console.error('Error al cargar los datos:', error);
        }
    }

    async function updateData(table, id, data) {
        try {
            const token = localStorage.getItem('token');
            const url = `/api/updateData?table=${table}&id=${id}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ data: data })
            });

            if (!response.ok) {
                console.error('Error updating data:', response.status);
                throw new Error(`${response.status}`);
            }

            const responseData = await response.json();
            console.log('Data updated successfully:', responseData);
            displayMessage(`Registro actualizado correctamente.`);
            loadTableData(table); // Recargar la tabla después de la actualización
        } catch (error) {
            console.error('Error updating data:', error);
            displayMessage(`Error al actualizar el registro: ${error}`, 'error');
        }
    }
});
