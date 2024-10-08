const puppeteer = require('puppeteer');
const fetchElevenTravelData = require('./api/fetchElevenTravelData');
const createLocationMatches = require('./utilities/createLocationMatches');
const createXlsxProvincesFile = require('./utilities/createXlsxProvincesFile');
const createXlsxLocationsFile = require('./utilities/createXlsxLocationsFile');

async function run() {
  console.log('Start!');
  const browser = await puppeteer.launch();
  const pbPage = await browser.newPage();
  const pbWebsite = 'https://www.partybussen.nl/festivals/qlimax';

  const provinces = [
    { name: 'Groningen', selector: '[name="province-1"]' },
    { name: 'Friesland', selector: '[name="province-2"]' },
    { name: 'Drenthe', selector: '[name="province-3"]' },
    { name: 'Overijssel', selector: '[name="province-4"]' },
    { name: 'Flevoland', selector: '[name="province-5"]' },
    { name: 'Gelderland', selector: '[name="province-6"]' },
    { name: 'Utrecht', selector: '[name="province-7"]' },
    { name: 'Noord-Holland', selector: '[name="province-8"]' },
    { name: 'Zuid-Holland', selector: '[name="province-9"]' },
    { name: 'Noord-Brabant', selector: '[name="province-10"]' },
    { name: 'Zeeland', selector: '[name="province-11"]' },
    { name: 'Limburg', selector: '[name="province-12"]' },
  ];

  function createProvinceDataset(finalData) {
    const provinceDatasetHeaders = ['provincie', 'gem_prijs_pb', 'gem_prijs_et', 'prijs_verschil'];
    const provinceDatasetPricePb = [];
    const provinceDatasetPriceEt = [];
    const provinceDatasetPriceDifference = [];

    let index = 0;
    provinces.forEach(function (province) {
      const targetProvince = province.name;
      const filteredRows = finalData.filter((row) => row[0] === targetProvince);
      const totalPricePb = filteredRows.reduce((sum, row) => sum + parseFloat(row[5]), 0);
      const averagePricePb = totalPricePb / filteredRows.length;
      const validRows = filteredRows.filter((row) => row[6] !== 'N/A');
      const totalPriceEt = validRows.reduce((sum, row) => sum + parseFloat(row[6]), 0);
      const averagePriceEt = totalPriceEt / validRows.length;

      provinceDatasetPricePb[index] = averagePricePb.toFixed(2);
      provinceDatasetPriceEt[index] = averagePriceEt.toFixed(2);
      const priceDifference = averagePriceEt - averagePricePb;
      provinceDatasetPriceDifference[index] = priceDifference.toFixed(2);

      index++;
    });

    const provinceDataset = [];
    provinceDataset[0] = provinceDatasetHeaders;
    index = 0;
    provinces.forEach(function (province) {
      let datasetRow = [];
      datasetRow.push(province.name);
      datasetRow.push(provinceDatasetPricePb[index]);
      datasetRow.push(provinceDatasetPriceEt[index]);
      datasetRow.push(provinceDatasetPriceDifference[index]);
      provinceDataset.push(datasetRow);
      index++;
    });
    createXlsxProvincesFile(provinceDataset);
  }

  let pbProvinces = [];
  let pbCities = [];
  let pbLocations = [];
  let pbPrices = [];

  try {
    try {
      console.log('Accessing website...');
      await pbPage.goto(pbWebsite, { timeout: 60000 });
    } catch (error) {
      console.error('Error accessing website:', error);
    }
    try {
      console.log('Searching for selector...');
      await pbPage.waitForSelector('.columns.small-12.medium-8', { timeout: 30000 });
    } catch (error) {
      console.error('Error accessing selector:', error);
    }

    console.log('Done!');

    for (const province of provinces) {
      const targetCities = await pbPage.evaluate((selector) => {
        const elements = document.querySelectorAll(`${selector} .locatie`);
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
      }, province.selector);

      const targetLocations = await pbPage.evaluate((selector) => {
        const elements = document.querySelectorAll(`${selector} .loc-naam`);
        return Array.from(elements).map((element) => element.textContent.trim());
      }, province.selector);

      const targetPrices = await pbPage.evaluate((selector) => {
        const elements = document.querySelectorAll(`${selector} .prijs`);
        return Array.from(elements).map((element) => {
          let text = '';
          element.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              text += node.textContent.trim();
              text = text.replace(',', '.');
              text = text.replace(/[^0-9.]/g, '');
            }
          });
          return text;
        });
      }, province.selector);

      const provinceCount = targetCities.length;
      pbProvinces.push(...Array(provinceCount).fill(province.name));
      pbCities.push(...targetCities);
      pbLocations.push(...targetLocations);
      pbPrices.push(...targetPrices);
    }

    if (pbCities.length == pbLocations.length && pbLocations.length == pbPrices.length) {
      let { etCities, etLocations, etPrices } = await fetchElevenTravelData();
      const matchedData = createLocationMatches(pbProvinces, pbCities, pbLocations, pbPrices, etCities, etLocations, etPrices);
      const finalData = [['provincies', 'stad', 'locatie_pb', 'locatie_et', 'locatie_match', 'prijs_pb', 'prijs_et', 'prijs_verschil'], ...matchedData];
      createXlsxLocationsFile(finalData);
      createProvinceDataset(finalData);
    } else {
      console.error('Amount of records scraped from partybussen.nl do not match: ' + 'Cities: ' + pbCities.length + ', Locations: ' + pbLocations.length + ', Prices: ' + pbPrices.length);
    }
  } catch (error) {
    console.log('Error: ' + error);
  } finally {
    await browser.close();
  }
}

run();
