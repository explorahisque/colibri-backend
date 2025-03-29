const fs = require('fs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

function correctData(filePath) {
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    let correctedData = [];

    for (const grado in data) {
      if (data.hasOwnProperty(grado)) {
        for (const area in data[grado]) {
          if (data[grado].hasOwnProperty(area)) {
            for (const tema in data[grado][area]) {
              if (data[grado][area].hasOwnProperty(tema)) {
                for (const subtema in data[grado][area][tema]) {
                  if (data[grado][area][tema].hasOwnProperty(subtema)) {
                    const contenido = data[grado][area][tema][subtema];

                    let correctedSubtema = {
                      grado: grado,
                      area: area,
                      tema: tema,
                      subtema: subtema,
                      contenido: contenido // Keep the original content structure
                    };

                    correctedData.push(correctedSubtema);
                  }
                }
              }
            }
          }
        }
      }
    }

    return correctedData;
  } catch (error) {
    console.error("Error processing file:", error);
    return null;
  }
}

readline.question("Please enter the path to the JSON file you want to correct: ", filePath => {
  if (!filePath) {
    console.error("No file path provided.");
    readline.close();
    process.exit(1);
  }

  const corrected = correctData(filePath);

  if (corrected) {
    const fileName = filePath.split('\\').pop().split('/').pop().split('.')[0];
    const correctedFileName = `${fileName}_corregido.json`;
    const correctedFilePath = filePath.substring(0, filePath.lastIndexOf('\\') + 1) + correctedFileName;

    fs.writeFile(correctedFilePath, JSON.stringify(corrected, null, 2), (err) => {
      if (err) {
        console.error("Error writing corrected data to file:", err);
      } else {
        console.log(`Corrected data written to ${correctedFileName}`);
      }
    });
  }

  readline.close();
});

