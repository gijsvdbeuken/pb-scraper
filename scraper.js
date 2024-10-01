const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
//const fs = require("fs");

async function run() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const website = 'https://www.partybussen.nl/festivals/qlimax';
  const pageData = {};

  try {
    await page.goto(website);
    await page.waitForSelector('.columns.small-12.medium-8');

    pageData.page_title = await page.evaluate(() => document.title);

    const getScrapeDate = () => {
      const currentDate = new Date();
      const day = currentDate.getDate();
      const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
      const monthIndex = currentDate.getMonth();
      const month = monthNames[monthIndex];
      const formattedDate = `${day} ${month}`;
      return formattedDate;
    };

    const selectorGrongingen = `[name="province-1"]`;
    const selectorFriesland = `[name="province-2"]`;
    const selectorDrenthe = `[name="province-3"]`;
    const selectorOverijssel = `[name="province-4"]`;
    const selectorFlevoland = `[name="province-5"]`;
    const selectorGelderland = `[name="province-6"]`;
    const selectorUtrecht = `[name="province-7"]`;
    const selectorNoordHolland = `[name="province-8"]`;
    const selectorZuidHolland = `[name="province-9"]`;
    const selectorNoordBrabant = `[name="province-10"]`;
    const selectorZeeland = `[name="province-11"]`;
    const selectorLimburg = `[name="province-12"]`;

    const selectorsProvinces = [selectorGrongingen, selectorFriesland, selectorDrenthe, selectorOverijssel, selectorFlevoland, selectorGelderland, selectorUtrecht, selectorNoordHolland, selectorZuidHolland, selectorNoordBrabant, selectorZeeland, selectorLimburg];

    for (const province of selectorsProvinces) {
      // RETRIEVING CITY DATA
      const targetCity = await page.evaluate((province) => {
        const elements = document.querySelectorAll(`${province} .locatie`);
        return Array.from(elements).map((element) => {
          function findFirstTextNode(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              return node.textContent.trim();
            }
            for (let child of node.childNodes) {
              const foundText = findFirstTextNode(child);
              if (foundText) {
                return foundText;
              }
            }
            return null;
          }
          return findFirstTextNode(element);
        });
      }, province);

      // RETRIEVING LOCATION DATA
      const targetLocation = await page.evaluate((province) => {
        const elements = document.querySelectorAll(`${province} .loc-naam`);
        return Array.from(elements).map((element) => element.textContent.trim());
      }, province);

      // RETRIEVING PRICE DATA
      const targetPrice = await page.evaluate((province) => {
        const elements = document.querySelectorAll(`${province} .prijs`);
        return Array.from(elements).map((element) => {
          let text = '';
          element.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              text += node.textContent.trim();
            }
          });
          return text;
        });
      }, province);

      // CREATE EXCEL FILE
      if (targetCity.length === targetLocation.length && targetLocation.length === targetPrice.length) {
        const workBook = xlsx.utils.book_new();
        const data = [['stad', 'locatie', 'prijs', 'scrapedatum']];
        const formattedDate = getScrapeDate();

        for (let i = 0; i < targetCity.length; i++) {
          data.push([targetCity[i], targetLocation[i], targetPrice[i], formattedDate]);
        }

        const workSheet = xlsx.utils.aoa_to_sheet(data);

        xlsx.utils.book_append_sheet(workBook, workSheet, 'Qlimax Data');

        const filePath = './data.xlsx';
        xlsx.writeFile(workBook, filePath);
        console.log('Excel file created successfully.');
      } else {
        console.log('Data length mismatch, cannot write to Excel.');
      }

      // You can process targetCity, targetLocation, and targetPrice here if needed
    }
  } catch (error) {
    console.log('Error accessing website: ' + error);
  } finally {
    await browser.close();
  }
}

run();
