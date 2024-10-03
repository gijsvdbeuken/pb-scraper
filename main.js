const puppeteer = require('puppeteer');
const fetchBoardingLocations = require('./fetchElevenTravelData');
const createExcelFile = require('./utilities/createExcelFile');

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

    if (pbCities.length === pbLocations.length && pbLocations.length === pbPrices.length) {
      let { cities, locations, prices } = await fetchBoardingLocations();

      const formattedDate = scrapeDate();

      function convertStringToFloat(str) {
        return parseFloat(str.replace(',', ''), 10);
      }

      function getCellStyle(prijs_verschil) {
        if (prijs_verschil > 0) {
          return { fill: { fgColor: { rgb: '00FF00' } } };
        } else {
          return {};
        }
      }

      for (let i = 0; i < pbCities.length; i++) {
        let price_et = 'N/A';
        let locatie_et = 'N/A';
        let match = 'Normaal';
        let prijs_verschil = 'N/A';
        for (let j = 0; j < cities.length; j++) {
          const cityWordsI = pbCities[i].toLowerCase().split(' ');
          const cityWordsJ = cities[j].toLowerCase().split(' ');
          const locationWordsI = pbLocations[i].toLowerCase().split(' ');
          const locationWordsJ = locations[j].toLowerCase().split(' ');

          const cityMatch = cityWordsI.some((wordI) => cityWordsJ.includes(wordI));
          const locationMatch = locationWordsI.some((wordI) => locationWordsJ.includes(wordI));

          if (cityMatch && locationMatch) {
            locatie_et = locations[j];
            price_et = prices[j];
            price_et = price_et.replace(/[^\d,.-]/g, '').replace(',', '.');
            const x = pbPrices[i].replace(/[^\d,.-]/g, '').replace(',', '.');
            prijs_et_integer = convertStringToFloat(price_et);
            prijs_pb_integer = convertStringToFloat(x);
            prijs_verschil = prijs_et_integer - prijs_pb_integer;

            match = 'Hoog';
          }
        }
        data.push([pbProvinces[i], pbCities[i], pbLocations[i], locatie_et, match, pbPrices[i], price_et, prijs_verschil, formattedDate]);
      }

      createExcelFile(data);
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
