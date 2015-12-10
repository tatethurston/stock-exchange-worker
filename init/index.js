var stocks = require('./Schema/stockSchema');
var stockprices = require('./Schema/stockPriceSchema');
var stockpricesArchive = require('./Schema/stockPriceArchiveSchema');
var knex = require('../db/index');
var fillStockTable = require('./fillStockTable');

Promise.all([
    stocks(knex),
    stockprices(knex),
    stockpricesArchive(knex)
  ])
  .then(function () {
    return fillStockTable(knex);
  })
  .then(function () {
    console.log(new Date(), 'DATABASES UP');
    knex.destroy(knex);
  })
  .catch(function (err) {
    console.log(err);
    knex.destroy(knex);
  });
