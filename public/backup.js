document.getElementById('backupButton').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/backup');
        if (!response.ok) {
            throw new Error('Error al generar el respaldo');
        }

        const backupData = await response.json(); // Obtener los datos del respaldo
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const formattedTime = `${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;
        const fileName = `coLibri_${formattedDate}_${formattedTime}.json`;

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
    } catch (error) {
        console.error('Error al descargar el respaldo:', error);
        alert('No se pudo generar el respaldo. Inténtalo de nuevo.');
    }
});
