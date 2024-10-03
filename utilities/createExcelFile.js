const xlsx = require('xlsx');

function createExcelFile(data) {
  const workBook = xlsx.utils.book_new();
  const workSheet = xlsx.utils.aoa_to_sheet(data);
  const filePath = './output/data.xlsx';

  xlsx.utils.book_append_sheet(workBook, workSheet, 'Qlimax Data');
  xlsx.writeFile(workBook, filePath, { cellStyles: true });

  console.log('Excel file created successfully.');
}

module.exports = createExcelFile;
