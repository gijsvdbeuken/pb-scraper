// locationMatcher.js
function convertStringToFloat(str) {
  return parseFloat(str.replace(',', ''), 10);
}

function matchLocations(pbProvinces, pbCities, pbLocations, pbPrices, etCities, etLocations, etPrices, formattedDate) {
  const data = [];
  for (let pbIndex = 0; pbIndex < pbCities.length; pbIndex++) {
    let etPrice = 'N/A';
    let pbPrice = 'N/A';
    let etLocation = 'N/A';
    let match = 'Normaal';
    let priceDifference = 'N/A';

    for (let etIndex = 0; etIndex < etCities.length; etIndex++) {
      const wordsInPbCities = pbCities[pbIndex].toLowerCase().split(' ');
      const wordsInEtCities = etCities[etIndex].toLowerCase().split(' ');
      const wordsInPbLocations = pbLocations[pbIndex].toLowerCase().split(' ');
      const wordsInEtLocations = etLocations[etIndex].toLowerCase().split(' ');

      const cityMatch = wordsInPbCities.some((wordI) => wordsInEtCities.includes(wordI));
      const locationMatch = wordsInPbLocations.some((wordI) => wordsInEtLocations.includes(wordI));

      if (cityMatch && locationMatch) {
        etLocation = etLocations[etIndex];
        etPrice = etPrices[etIndex].replace(/[^\d,.-]/g, '').replace(',', '.');
        pbPrice = pbPrices[pbIndex].replace(/[^\d,.-]/g, '').replace(',', '.');

        const prijsEtInteger = convertStringToFloat(etPrice);
        const prijsPbInteger = convertStringToFloat(pbPrice);
        priceDifference = prijsEtInteger - prijsPbInteger;

        match = 'Hoog';
      }
    }

    data.push([pbProvinces[pbIndex], pbCities[pbIndex], pbLocations[pbIndex], etLocation, match, pbPrices[pbIndex], etPrice, priceDifference, formattedDate]);
  }

  return data;
}

module.exports = matchLocations;
