const puppeteer = require('puppeteer');
const xlsx = require('xlsx');

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const website_pb = 'https://www.partybussen.nl/festivals/qlimax';
  const website_et = 'https://eleventravel.nl/evenementen/qlimax/';
  const pageData = {};

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

  let allProvinces = [];
  let allCities = [];
  let allLocations = [];
  let allPrices = [];

  // GET ET DATA
  try {

    // Rrequest URL: https://eleventravel.nl/wp-admin/admin-ajax.php
    await page.goto(website_et);
    await page.waitForSelector('.seperate_boarding_locations');
    await page.waitForSelector('.CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');

    const cookieButton = await page.waitForSelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll .CybotCookiebotDialogBodyButton', { visible: true });

    if (cookieButton) {
      console.log('Cookie button found!');
      await cookieButton.click();
      await page.waitForTimeout(5000);
    }

    /*
    const showAllButton = await page.waitForSelector('#show_all .btn.btn-primary', { visible: true });

    if (showAllButton) {
      console.log('Show all button does exist!');
      await showAllButton.click();
      await page.waitForTimeout(10000);

      await page.waitForFunction(
        () => {
          return document.querySelectorAll('.city').length > 10;
        },
        { timeout: 10000 }
      );

      const targetLocation = await page.evaluate(() => {
        const elements = document.querySelectorAll('.tickets_table__row__col.name');
        return Array.from(elements).map((element) => element.textContent.trim());
      });

      console.log('TEST: ' + targetLocation);
      
    }
    */
  } catch (error) {
    console.log('Error: ' + error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // GET PB DATA
  try {
    await page.goto(website_pb);
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

    for (const province of provinces) {
      // RETRIEVING CITY DATA
      const targetCity = await page.evaluate((selector) => {
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

      // RETRIEVING LOCATION DATA
      const targetLocation = await page.evaluate((selector) => {
        const elements = document.querySelectorAll(`${selector} .loc-naam`);
        return Array.from(elements).map((element) => element.textContent.trim());
      }, province.selector);

      // RETRIEVING PRICE DATA
      const targetPrice = await page.evaluate((selector) => {
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

      // Add the province name for each city/location/price
      const provinceCount = targetCity.length;
      allProvinces.push(...Array(provinceCount).fill(province.name));
      allCities.push(...targetCity);
      allLocations.push(...targetLocation);
      allPrices.push(...targetPrice);
    }

    // CREATE EXCEL FILE
    if (allCities.length === allLocations.length && allLocations.length === allPrices.length) {
      const workBook = xlsx.utils.book_new();
      const data = [['provincies', 'stad', 'locatie', 'prijs_pb', 'prijs_et', 'scrape_datum']];
      const formattedDate = getScrapeDate();

      for (let i = 0; i < allCities.length; i++) {
        data.push([allProvinces[i], allCities[i], allLocations[i], allPrices[i], allPrices[i], formattedDate]);
      }

      const workSheet = xlsx.utils.aoa_to_sheet(data);

      xlsx.utils.book_append_sheet(workBook, workSheet, 'Qlimax Data');

      const filePath = './data.xlsx';
      xlsx.writeFile(workBook, filePath);
      console.log('Excel file created successfully.');
      console.log('Full obj: ' + allProvinces);
      console.log('Indexed: ' + allProvinces[3]);
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
