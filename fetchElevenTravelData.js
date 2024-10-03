const fetch = require('node-fetch'); // Only necessary if you're using Node.js
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

    console.log('Boarding Cities:', cities);
    //console.log('Success:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchBoardingLocations();
