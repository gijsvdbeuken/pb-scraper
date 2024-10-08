function convertStringToFloat(str) {
  return parseFloat(str.replace(',', ''), 10);
}

function matchLocations(pbProvinces, pbCities, pbLocations, pbPrices, etCities, etLocations, etPrices) {
  const data = [];

  // Voor elke stad op Party Bussen
  for (let pbIndex = 0; pbIndex < pbCities.length; pbIndex++) {
    let etPrice = 'N/A';
    let pbPrice = 'N/A';
    let etLocation = 'N/A';
    let match = 'N/A';
    let priceDifference = 'N/A';

    // Voor elke stad op Eleven Travel
    for (let etIndex = 0; etIndex < etCities.length; etIndex++) {
      const wordsInPbCities = pbCities[pbIndex].toLowerCase().split(' ');
      const wordsInEtCities = etCities[etIndex].toLowerCase().split(' ');
      const wordsInPbLocations = pbLocations[pbIndex].toLowerCase().split(' ');
      const wordsInEtLocations = etLocations[etIndex].toLowerCase().split(' ');

      const cityMatch = wordsInPbCities.some((wordI) => wordsInEtCities.includes(wordI));
      const filteredPbLocations = wordsInPbLocations.filter((word) => word !== 'Bushalte' && word !== 'bushalte');
      const filteredEtLocations = wordsInEtLocations.filter((word) => word !== 'Bushalte' && word !== 'bushalte');
      const locationMatch = filteredPbLocations.some((wordI) => filteredEtLocations.includes(wordI));

      // Wanneer stad en locatie matchen bij Party Bussen en Eleven Travel
      if (cityMatch && locationMatch) {
        etLocation = etLocations[etIndex];
        etPrice = etPrices[etIndex].replace(/[^\d,.-]/g, '').replace(',', '.');
        pbPrice = pbPrices[pbIndex].replace(/[^\d,.-]/g, '').replace(',', '.');

        const prijsEtInteger = convertStringToFloat(etPrice);
        const prijsPbInteger = convertStringToFloat(pbPrice);
        priceDifference = prijsEtInteger - prijsPbInteger;

        match = 'Sterker';
        break;
      } else if (cityMatch) {
        etLocation = etLocations[etIndex];
        etPrice = etPrices[etIndex].replace(/[^\d,.-]/g, '').replace(',', '.');
        pbPrice = pbPrices[pbIndex].replace(/[^\d,.-]/g, '').replace(',', '.');

        const prijsEtInteger = convertStringToFloat(etPrice);
        const prijsPbInteger = convertStringToFloat(pbPrice);
        priceDifference = prijsEtInteger - prijsPbInteger;

        match = 'Zwakker';
      }
    }

    data.push([pbProvinces[pbIndex], pbCities[pbIndex], pbLocations[pbIndex], etLocation, match, pbPrices[pbIndex], etPrice, priceDifference]);
  }

  return data;
}

module.exports = matchLocations;
