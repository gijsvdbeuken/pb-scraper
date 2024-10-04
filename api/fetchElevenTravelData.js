const fetch = require('node-fetch');
const cheerio = require('cheerio');

const url = 'https://eleventravel.nl/wp-admin/admin-ajax.php';

const payload = {
  action: 'fetch_boarding_locations',
  all: true,
  event_slug: 'qlimax',
};

async function fetchBoardingLocations() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const htmlString = data.html;
    const $ = cheerio.load(htmlString);

    const etCities = [];
    $('span.city').each((index, element) => {
      etCities.push($(element).text());
    });

    const etLocations = [];
    $('span.detail').each((index, element) => {
      etLocations.push($(element).text());
    });

    const picesDouble = [];
    $('span.new_price').each((index, element) => {
      picesDouble.push($(element).text());
    });
    const etPrices = picesDouble.filter((_, index) => index % 2 === 0);

    if (etCities.length !== etLocations.length || etCities.length !== etPrices.length) {
      console.error('Amount of records retrieved from eleven travel do not match: ' + 'Cities: ' + etCities.length + ', Locations: ' + etLocations.length + ', Prices: ' + etPrices.length);
      return { cities: [], locations: [], prices: [] };
    }

    return { etCities, etLocations, etPrices };
  } catch (error) {
    console.error('Error:', error);
    return { etCities: [], etLocations: [], etPrices: [] };
  }
}

module.exports = fetchBoardingLocations;
