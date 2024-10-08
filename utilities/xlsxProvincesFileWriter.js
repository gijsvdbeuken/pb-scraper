const ExcelJS = require('exceljs');

async function createProvincesExcelFile(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Qlimax Data');
  const headerRow = worksheet.addRow(data[0]);

  let prijsVerschilColumnIndex;
  headerRow.eachCell((cell, colNumber) => {
    if (cell.value === 'prijs_verschil') {
      prijsVerschilColumnIndex = colNumber;
    }
  });

  for (let i = 1; i < data.length; i++) {
    const row = worksheet.addRow(data[i]);

    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        return;
      }
      if (typeof cell.value !== 'string' || isNaN(parseFloat(cell.value))) {
        cell.value = 'N/A';
      }
      if (cell.value === 'N/A') {
        cell.font = { color: { argb: 'FFC4C4C4' } };
      }
    });

    if (prijsVerschilColumnIndex) {
      const cell = row.getCell(prijsVerschilColumnIndex);
      const cellValue = cell.value;

      if (typeof cellValue === 'string') {
        if (cellValue < 0) {
          cell.font = { color: { argb: 'FF00CC00' } }; // Green
        } else if (cellValue == 0) {
          cell.font = { color: { argb: 'FFF0B000' } }; // Yellow
        } else {
          cell.font = { color: { argb: 'FFFF0000' } }; // Red
        }
      }
    }

    row.eachCell((cell, colNumber) => {
      if (cell.value === 'N/A') {
        cell.font = { color: { argb: 'FFC4C4C4' } };
      }
    });
  }

  const today = new Date();

  let day = String(today.getDate()).padStart(2, '0');
  let month = String(today.getMonth() + 1).padStart(2, '0');
  let year = String(today.getFullYear()).slice(-2);

  const currentDate = `${day}-${month}-${year}`;

  const filePath = `./output/data_provinces_${currentDate}.xlsx`;
  await workbook.xlsx.writeFile(filePath);
  console.log(`Excel file with province-based data created successfully at ${currentDate}.`);
}

module.exports = createProvincesExcelFile;
