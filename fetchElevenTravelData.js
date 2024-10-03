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

    const cities = [];
    $('span.city').each((index, element) => {
      cities.push($(element).text());
    });

    const locations = [];
    $('span.detail').each((index, element) => {
      locations.push($(element).text());
    });

    const picesDouble = [];
    $('span.new_price').each((index, element) => {
      picesDouble.push($(element).text());
    });
    const prices = picesDouble.filter((_, index) => index % 2 === 0);

    if (cities.length !== locations.length || cities.length !== prices.length) {
      console.error('Amount of records do not match: ' + 'Cities: ' + cities.length + ', Lcations: ' + locations.length + ', Prices: ' + prices.length);
      return { cities: [], locations: [], prices: [] };
    }

    return { cities, locations, prices };
  } catch (error) {
    console.error('Error:', error);
    return { cities: [], locations: [], prices: [] };
  }
}

module.exports = fetchBoardingLocations;
