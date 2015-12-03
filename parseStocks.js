var fs = require('fs');
var csvParse = require('csv-parse');
var Promise = require('bluebird');


var parser = Promise.promisify(csvParse);
var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

var INPUT = './data/stock_list.csv';
var OUTPUT = './output/stocklist.json';

function stocksToObjects(stocks) {
  return stocks.map(function (stock) {
    return {
      Symbol: stock[0],
      Name: stock[1],
      Sector: stock[5],
      Industry: stock[6],
      Exchange: stock[8],
    };
  });
}

readFile(INPUT)
  .then(function (csvBuffer) {
    return parser(csvBuffer);
  })
  .then(function (stocks) {
    console.log('INPUT LENGTH:', stocks.length);
    return stocksToObjects(stocks);
  })
  .then(function (stocks) {
    stocks = JSON.stringify(stocks, null, 4);
    writeFile(OUTPUT, stocks);
  })
  .then(function () {
    return readFile(OUTPUT, 'utf8');
  })
  .then(function (file) {
    var stocks = JSON.parse(file);
    console.log('OUTPUT LENGTH:', stocks.length);
  })
  .catch(function (err) {
    console.log(err);
  });
