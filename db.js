var MongoClient = require('mongodb').MongoClient;

// TODO: Move it to external config
// Connection URL
var url = 'mongodb://localhost:27017/football_league';

var DB = module.exports = function (callback) {
  var self = this;

  // Use connect method to connect to the Server
  MongoClient.connect(url, function(error, db) {
    if (error) { return callback(error); }

    self.db = db;
    // console.log('Connected to database');
    callback();
  });
};

DB.connect = function (callback) {
  return new DB(callback);
};
