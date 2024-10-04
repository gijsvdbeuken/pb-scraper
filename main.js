const puppeteer = require('puppeteer');
const fetchBoardingLocations = require('./api/fetchElevenTravelData');
const xlsxFileWriter = require('./utilities/xlsxFileWriter');
const locationMatcher = require('./utilities/locationMatcher');

async function run() {
  const browser = await puppeteer.launch();
  const pbPage = await browser.newPage();
  const pbWebsite = 'https://www.partybussen.nl/festivals/qlimax';
  const pbPageData = {};

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

  let pbProvinces = [];
  let pbCities = [];
  let pbLocations = [];
  let pbPrices = [];

  try {
    await pbPage.goto(pbWebsite);
    await pbPage.waitForSelector('.columns.small-12.medium-8');

    pbPageData.pageTitle = await pbPage.evaluate(() => document.title);

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
              text = text.replace(/[^0-9,]/g, '');
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
      let { etCities, etLocations, etPrices } = await fetchBoardingLocations();

      const matchedData = locationMatcher(pbProvinces, pbCities, pbLocations, pbPrices, etCities, etLocations, etPrices);
      const finalData = [['provincies', 'stad', 'locatie_pb', 'locatie_et', 'locatie_match', 'prijs_pb', 'prijs_et', 'prijs_verschil'], ...matchedData];

      xlsxFileWriter(finalData);
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
