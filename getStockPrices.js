var fs = require('fs');
var Promise = require('bluebird');
var request = require('request');

var api = 'https://query.yahooapis.com/v1/public/yql';
var query = '?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in("yhoo")&format=json&diagnostics=true&env=store://datatables.org/alltableswithkeys&callback=';


var INPUT = './output/stocklist.json';
var OUTPUT = './output/stocklistPrices.json';

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

function getPrices(stocks) {
  var deferred = Promise.pending();

  var symbols = stocks.map(function (stock) {
    return stock.Symbol;
  }).join(',%20');

  var call = api +
    '?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in("' +
    symbols +
    '")&format=json&diagnostics=true&env=store://datatables.org/alltableswithkeys&callback=';

  request(call, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      deferred.resolve(JSON.parse(body).query.results.quote);
    } else {
      deferred.reject(error);
    }
  });

  return deferred.promise;
}

function queueStocks(stocks) {
  var LIMIT = 100;
  var prices = [];
  for (var i = 0; i < stocks.length; i += LIMIT) {
    stocklist = stocks.slice(i, i + LIMIT);
    prices.push(getPrices(stocklist));
  }
  return Promise.all(prices);
}

readFile(INPUT)
  .then(function (json) {
    return JSON.parse(json);
  })
  .then(function (stocks) {
    return queueStocks(stocks);
  })
  .then(function (prices) {
    var stockData = [].concat.apply([], prices)
      .map(function (stock) {
        return {
          symbol: stock.symbol,
          Bid: stock.Bid,
          Ask: stock.Ask
        };
      });
    stockData = JSON.stringify(stockData, null, 4);
    return writeFile(OUTPUT, stockData);
  })
  .catch(function (err) {
    console.log(err);
  });
