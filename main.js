const puppeteer = require('puppeteer');
const fetchBoardingLocations = require('./fetchElevenTravelData');
const createExcelFile = require('./utilities/excelFileCreator');
const locationMatcher = require('./utilities/locationMatcher');

async function run() {
  // PREPARE SCRAPER
  const browser = await puppeteer.launch();
  const pbPage = await browser.newPage();
  const pbWebsite = 'https://www.partybussen.nl/festivals/qlimax';
  const pbPageData = {};
  const data = [['provincies', 'stad', 'locatie_pb', 'locatie_et', 'locatie_match', 'prijs_pb', 'prijs_et', 'prijs_verschil', 'scrape_datum']];

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

  // DATE FUNCTION
  const scrapeDate = () => {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    const monthIndex = currentDate.getMonth();
    const month = months[monthIndex];
    const formattedDate = `${day} ${month}`;
    return formattedDate;
  };

  // OBTAIN DATA
  try {
    await pbPage.goto(pbWebsite);
    await pbPage.waitForSelector('.columns.small-12.medium-8');

    pbPageData.pageTitle = await pbPage.evaluate(() => document.title);

    for (const province of provinces) {
      const targetCity = await pbPage.evaluate((selector) => {
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

      const targetLocation = await pbPage.evaluate((selector) => {
        const elements = document.querySelectorAll(`${selector} .loc-naam`);
        return Array.from(elements).map((element) => element.textContent.trim());
      }, province.selector);

      const targetPrice = await pbPage.evaluate((selector) => {
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

      const provinceCount = targetCity.length;
      pbProvinces.push(...Array(provinceCount).fill(province.name));
      pbCities.push(...targetCity);
      pbLocations.push(...targetLocation);
      pbPrices.push(...targetPrice);
    }

    console.log('AAA');
    if (pbCities.length === pbLocations.length && pbLocations.length === pbPrices.length) {
      let { etCities, etLocations, etPrices } = await fetchBoardingLocations();
      const formattedDate = scrapeDate();

      const matchedData = locationMatcher(pbProvinces, pbCities, pbLocations, pbPrices, etCities, etLocations, etPrices, formattedDate);

      const finalData = [['provincies', 'stad', 'locatie_pb', 'locatie_et', 'locatie_match', 'prijs_pb', 'prijs_et', 'prijs_verschil', 'scrape_datum'], ...matchedData];

      createExcelFile(finalData);
    } else {
      console.log('Data length mismatch, cannot write to Excel.');
    }
  } catch (error) {
    console.log('Error: ' + error);
  } finally {
    await browser.close();
  }
}

run();
