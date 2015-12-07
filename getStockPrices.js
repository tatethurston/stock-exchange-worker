#!/usr/local/bin/node

var fs = require('fs');
var Promise = require('bluebird');
var request = require('request');

var api = 'https://query.yahooapis.com/v1/public/yql';
var queryLeft = '?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in("';
var queryRight = '")&format=json&diagnostics=true&env=store://datatables.org/alltableswithkeys&callback=';


var INPUT = __dirname + '/output/stocklist.json';
var OUTPUT = __dirname + '/output/stocklistPrices.json';

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

readFile(INPUT)
  .then(function (json) {
    return JSON.parse(json);
  })
  .then(function (stocks) {
    console.log(new Date(), 'retrieving');
    return queueStocks(stocks);
  })
  .then(function (prices) {
    console.log(new Date(), 'parse start');
    var stockData = parseStockData(prices);
    var dateStamp = '/*\n Timestamp: ' + new Date() + '\n*/\n';
    stockData = dateStamp + JSON.stringify(stockData, null, 4);
    return writeFile(OUTPUT, stockData);
  })
  .catch(function (err) {
    console.log('ERROR: ', err);
  });

function getPrices(stocks) {
  return new Promise(function (resolve, reject) {

    var symbols = stocks.map(function (stock) {
      return stock.Symbol;
    }).join(',%20');

    var query = api + queryLeft + symbols + queryRight;

    request(query, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(JSON.parse(body).query.results.quote);
      } else {
        reject(error);
      }
    });

  });
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

function parseStockData(prices) {
  return [].concat.apply([], prices)
    .map(function (stock) {
      return {
        Symbol: stock.symbol,
        Bid: stock.Bid,
        Ask: stock.Ask,
        Change: stock.Change,
        DaysLow: stock.DaysLow,
        DaysHigh: stock.DaysHigh,
        YearLow: stock.YearLow,
        YearHigh: stock.YearHigh,
        EarningsShare: stock.EarningsShare,
        EPSEstimateCurrentYear: stock.EPSEstimateCurrentYear,
        EPSEstimateNextYear: stock.EPSEstimateNextYear,
        MarketCapitalization: stock.MarketCapitalization,
        EBITDA: stock.EBITDA,
        DaysRange: stock.DaysRange,
        Open: stock.open,
        PreviousClose: stock.PreviousClose,
        PERatio: stock.PERatio,
        PEGRatio: stock.PEGRatio,
        Volume: stock.PEGRatio,
        PercentChange: stock.PercentChange
      };
    });
}
