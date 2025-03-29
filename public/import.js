document.addEventListener('DOMContentLoaded', () => {
    // Elementos UI
    const jsonFile = document.getElementById('jsonFile');
    const jsonPropertySelect = document.getElementById('jsonPropertySelect');
    const tableSelect = document.getElementById('tableSelect');
    // Actualizamos la referencia para que coincida con el id del HTML ("columnMapping")
    const mappingContainer = document.getElementById('columnMapping');
    const importButton = document.getElementById('importButton');
    const messageArea = document.getElementById('messageArea');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    let jsonBackupData = null; // contenido completo del JSON
    let selectedJsonData = []; // arreglo de datos de la propiedad seleccionada
    let selectedTable = null;
    
    // Cargar el archivo JSON de respaldo
    jsonFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                jsonBackupData = JSON.parse(e.target.result);
                populateJsonPropertySelect(Object.keys(jsonBackupData));
                displayMessage('Archivo JSON cargado exitosamente.', 'info');
            } catch(err) {
                displayMessage('Error al parsear el archivo JSON.', 'error');
            }
        };
        reader.readAsText(file);
    });
    
    function populateJsonPropertySelect(keys) {
        jsonPropertySelect.innerHTML = '<option value="">Seleccione una propiedad</option>';
        keys.forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key;
            jsonPropertySelect.appendChild(opt);
        });
    }
    
    // Al seleccionar una propiedad del JSON
    jsonPropertySelect.addEventListener('change', () => {
        const prop = jsonPropertySelect.value;
        if (!prop || !jsonBackupData[prop] || !Array.isArray(jsonBackupData[prop])) {
            displayMessage('Seleccione una propiedad válida que contenga un arreglo de datos.', 'error');
            selectedJsonData = [];
        } else {
            selectedJsonData = jsonBackupData[prop];
            displayMessage(`Propiedad "${prop}" seleccionada con ${selectedJsonData.length} registros.`, 'info');
            // Actualizar opciones de mapeo con las claves del primer registro
            if(selectedJsonData.length > 0){
                updateMappingOptions(Object.keys(selectedJsonData[0]));
            }
        }
    });
    
    // Al elegir la tabla destino
    tableSelect.addEventListener('change', async () => {
        selectedTable = tableSelect.value;
        if (!selectedTable) {
            displayMessage('Seleccione una tabla de destino.', 'error');
            return;
        }
        try {
            const dbColumns = await getDBColumns(selectedTable);
            generateDbMappingUI(dbColumns);
        } catch(err) {
            // Error ya mostrado por getDBColumns
        }
    });
    
    async function getDBColumns(tableName) {
        const token = localStorage.getItem('token');
        const apiUrl = `/api/getTableColumns?table=${tableName}`;
        const resp = await fetch(apiUrl, {
           method: 'GET',
           headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
           }
        });
        if(!resp.ok) throw new Error(`Error: ${resp.status}`);
        const columns = await resp.json();
        if(!Array.isArray(columns) || columns.length === 0) throw new Error('No se encontraron columnas.');
        return columns;
    }
    
    // Genera los selects de mapeo para cada columna de la tabla destino
    function generateDbMappingUI(dbColumns) {
        mappingContainer.innerHTML = '';
        if(selectedJsonData.length === 0) {
            displayMessage('No hay datos JSON seleccionados para mapear.', 'error');
            return;
        }
        const jsonKeys = Object.keys(selectedJsonData[0]);
        dbColumns.forEach(col => {
            const label = document.createElement('label');
            label.textContent = col;
            const select = document.createElement('select');
            select.dataset.dbColumn = col;
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'No mapear';
            select.appendChild(defaultOption);
            jsonKeys.forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = key;
                select.appendChild(opt);
            });
            label.appendChild(select);
            mappingContainer.appendChild(label);
        });
    }
    
    // Actualiza las opciones de mapeo si cambia la estructura del JSON
    function updateMappingOptions(jsonKeys) {
        // Usa mappingContainer (ya obtenido correctamente) para actualizar los selects
        const selects = mappingContainer.querySelectorAll('select');
        selects.forEach(sel => {
            sel.innerHTML = '<option value="">No mapear</option>';
            jsonKeys.forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = key;
                sel.appendChild(opt);
            });
        });
    }
    
    // Al presionar el botón de importación
    importButton.addEventListener('click', async () => {
        if(!selectedTable) {
            displayMessage('Seleccione una tabla de destino.', 'error');
            return;
        }
        if(selectedJsonData.length === 0) {
            displayMessage('No hay datos JSON para importar.', 'error');
            return;
        }
        const mapping = {}; // mapeo: columnaDB -> claveJSON
        mappingContainer.querySelectorAll('select').forEach(sel => {
            if(sel.value) mapping[sel.dataset.dbColumn] = sel.value;
        });
        if(Object.keys(mapping).length === 0) {
            displayMessage('Realice al menos un mapeo entre JSON y la tabla.', 'error');
            return;
        }
        await startImport(selectedTable, mapping, selectedJsonData);
    });
    
    async function startImport(tableName, mapping, dataArray) {
        const token = localStorage.getItem('token');
        const existingData = await fetchExistingData(tableName, token);
        let insertedCount = 0, updatedCount = 0, skippedCount = 0;
        const importReport = [];
        
        progressBar.style.width = '0%';
        progressText.textContent = 'Progreso: 0%';
        
        for(let i = 0; i < dataArray.length; i++) {
            const record = dataArray[i];
            let mappedRecord = {};
            for(const dbCol in mapping) {
                // Ya no necesitamos el tratamiento especial para 'contenido'
                mappedRecord[dbCol] = record[mapping[dbCol]];
            }
            if(Object.keys(mappedRecord).length === 0){
                importReport.push({ record, status: 'skipped', message: 'Registro vacío tras mapear.' });
                skippedCount++;
                continue;
            }
            // Se usa "titulo" para artículos y "nombre" para otras tablas (ajustar si fuera necesario)
            let uniqueField = (tableName === 'articulos') ? 'titulo' : 'nombre';
            let existingRecord = existingData.find(r => r[uniqueField] === mappedRecord[uniqueField]);
            if(existingRecord){
                if(JSON.stringify(existingRecord) !== JSON.stringify(mappedRecord)){
                    const updateResp = await updateRecord(tableName, existingRecord.id, mappedRecord, token);
                    if(updateResp.ok){
                        updatedCount++;
                        importReport.push({ record: mappedRecord, status: 'updated', message: 'Registro actualizado.' });
                    } else {
                        importReport.push({ record: mappedRecord, status: 'error', message: 'Error al actualizar registro.' });
                    }
                } else {
                    skippedCount++;
                    importReport.push({ record: mappedRecord, status: 'skipped', message: 'Registro idéntico, omitiendo.' });
                }
            } else {
                const insertResp = await insertRecord(tableName, mappedRecord, token);
                if(insertResp.ok){
                    insertedCount++;
                    importReport.push({ record: mappedRecord, status: 'inserted', message: 'Registro insertado.' });
                } else {
                    importReport.push({ record: mappedRecord, status: 'error', message: 'Error al insertar registro.' });
                }
            }
            let progress = Math.round(((i + 1) / dataArray.length) * 100);
            progressBar.style.width = progress + '%';
            progressText.textContent = `Progreso: ${progress}%`;
        }
        displayImportReport(insertedCount, updatedCount, skippedCount, importReport);
    }
    
    async function fetchExistingData(tableName, token) {
        const resp = await fetch(`/api/getExistingData?table=${tableName}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if(!resp.ok) return [];
        return await resp.json();
    }
    
    async function insertRecord(tableName, mappedRecord, token) {
        // Se envía el registro como objeto, sin envolverlo nuevamente en JSON.stringify
        return await fetch('/api/insertData', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tableName, data: mappedRecord })
        });
    }

    async function updateRecord(tableName, recordId, mappedRecord, token) {
        // Ya no necesitamos verificar si contenido es un array
        return await fetch(`/api/updateData?table=${tableName}&id=${recordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                data: mappedRecord
            })
        });
    }
    
    function displayImportReport(inserted, updated, skipped, report) {
        let html = `<h2>Informe de Importación</h2>
                    <p>Insertados: ${inserted}</p>
                    <p>Actualizados: ${updated}</p>
                    <p>Omitidos: ${skipped}</p>
                    <ul>`;
        report.forEach(item => {
            html += `<li>[${item.status}] ${item.message} - ${JSON.stringify(item.record)}</li>`;
        });
        html += '</ul>';
        messageArea.innerHTML = html;
    }
    
    function displayMessage(msg, type) {
        messageArea.innerHTML = `<p class="${type}">${msg}</p>`;
    }
});
