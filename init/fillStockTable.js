var fs = require('fs');
var csvParse = require('csv-parse');
var Promise = require('bluebird');

var parser = Promise.promisify(csvParse);
var readFile = Promise.promisify(fs.readFile);

var INPUT = __dirname + '/data/stock_list.csv';

function stocksToObjects(stocks) {
  return stocks.map(function (stock) {
    return {
      symbol: stock[0],
      name: stock[1],
      sector: stock[5],
      industry: stock[6],
      exchange: stock[8],
    };
  });
}

module.exports = function (knex) {
  return readFile(INPUT)
    .then(function (csvBuffer) {
      return parser(csvBuffer);
    })
    .then(function (stocks) {
      return stocksToObjects(stocks);
    })
    .then(function (stocks) {
      return Promise.map(stocks, function (stock) {
        return Promise.all([
          knex('stocks').insert(stock),
          knex('stock_prices').insert({
            symbol: stock.symbol
          })
        ]);
      });
    });
};
