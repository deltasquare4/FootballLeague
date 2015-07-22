var assert = require('assert');
var fs = require('fs');

// Constants
var NEWLINE = '\r\n';
var COMMA = ',';
var DASH = '-';


// Parser
module.exports = function (filePath, callback) {
  assert.ok(filePath, 'filePath is required');
  assert.ok(callback, 'callback is required');
  assert.ok(typeof(callback) === 'function', 'callback must be a valid function');

  var parsedGames = [];

  fs.readFile(filePath, { encoding: 'utf-8' }, function (error, contents) {
    if (error) { return callback(error); }

    var games = contents.split(NEWLINE);

    // Ignore the header
    games.shift();

    // Ignore the empty line
    games.pop();

    parsedGames = games.map(function (game) {
      var cols = game.split(COMMA);

      var halfTime = cols[4].split(DASH);
      var fullTime = cols[3].split(DASH);

      var date = new Date(cols[0]);
      var season;

      if(date.getMonth() <= 5) {
        season = (date.getFullYear() - 1) + '-' + date.getFullYear();
      } else {
        season = date.getFullYear() + '-' + (date.getFullYear() + 1);
      }
      // Return parsed, formatted games
      return {
        season: season,
        date: date,
        homeTeam: cols[1],
        awayTeam: cols[2],
        score: {
          halfTime: {
            home: Number(halfTime[0]),
            away: Number(halfTime[1]),
          },
          fullTime: {
            home: Number(fullTime[0]),
            away: Number(fullTime[1]),
            diff: Number(fullTime[0]) - Number(fullTime[1]),
          },
        },
      };
    });

    callback(null, parsedGames);
  });
};
