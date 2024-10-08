const ExcelJS = require('exceljs');

async function createLocationsExcelFile(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Qlimax Data');
  const headerRow = worksheet.addRow(data[0]);

  let prijsVerschilColumnIndex;
  headerRow.eachCell((cell, colNumber) => {
    if (cell.value === 'prijs_verschil') {
      prijsVerschilColumnIndex = colNumber;
    }
  });

  let locatieMatchColumnIndex;
  headerRow.eachCell((cell, colNumber) => {
    if (cell.value === 'locatie_match') {
      locatieMatchColumnIndex = colNumber;
    }
  });

  for (let i = 1; i < data.length; i++) {
    const row = worksheet.addRow(data[i]);

    row.eachCell((cell, colNumber) => {
      if (cell.value === 'N/A') {
        cell.font = { color: { argb: 'FFC4C4C4' } };
      }
    });

    if (locatieMatchColumnIndex) {
      const cell = row.getCell(locatieMatchColumnIndex);
      const cellValue = cell.value;

      if (typeof cellValue === 'string') {
        if (cellValue == 'Sterker') {
          cell.font = { color: { argb: 'FF00CC00' } }; // Green
        } else if (cellValue == 'Zwakker') {
          cell.font = { color: { argb: 'FFF0B000' } }; // Yellow
        }
      }
    }

    if (prijsVerschilColumnIndex) {
      const cell = row.getCell(prijsVerschilColumnIndex);
      const cellValue = cell.value;

      if (typeof cellValue === 'number') {
        if (cellValue < 0) {
          cell.font = { color: { argb: 'FF00CC00' } }; // Green
        } else if (cellValue == 0) {
          cell.font = { color: { argb: 'FFF0B000' } }; // Yellow
        } else {
          cell.font = { color: { argb: 'FFFF0000' } }; // Red
        }
      }
    }

    worksheet.columns.forEach((column) => {
      const maxLength = column.values.reduce((max, value) => {
        return Math.max(max, value ? value.toString().length : 0);
      }, 0);
      column.width = maxLength + 2;
    });
  }

  const today = new Date();

  let day = String(today.getDate()).padStart(2, '0');
  let month = String(today.getMonth() + 1).padStart(2, '0');
  let year = String(today.getFullYear()).slice(-2);

  const currentDate = `${day}-${month}-${year}`;

  const filePath = `./output/data_locations_${currentDate}.xlsx`;
  await workbook.xlsx.writeFile(filePath);
  console.log(`Excel file with location-based data created successfully at ${currentDate}.`);

  //
}

module.exports = createLocationsExcelFile;
