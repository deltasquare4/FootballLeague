var assert = require('assert');

var async = require('async');
var db = require('./db');
var parseMatches = require('./parser');

// Constants
var POINTS_WIN = 3;
var POINTS_DRAW = 1;
var POINTS_LOSS = 0;

exports.leagues = function (files, callback) {
  var self = this;

  assert.ok(Array.isArray(files), 'files should be an array');
  assert.ok(typeof(callback) === 'function', 'callback should be a function');

  var conn = db.connect(function (error) {
    if (error) { return callback(error); }

    async.each(files, function (file, callback) {
      parseMatches(file, function (error, games) {
        if (error) { return callback(error); }

        var season = games[0].season;
        var gamesCollection = conn.db.collection('games');

        gamesCollection.insert(games, function (error) {
          if (error) { return callback(error); }

          self.tables(season, function (error) {
            callback(error);
          });
        });
      });
    }, function (error) {
      callback(error);
    });
  });
};

exports.tables = function (season, callback) {
  assert.ok(season, 'season is required');
  assert.ok(typeof(callback) === 'function', 'callback should be a function');

  var splitSeason = season.split('-');
  var startYear = splitSeason[0];
  var endYear = splitSeason[1];
  var startOfSeason = new Date(startYear + '-07-01');
  var midOfSeason = new Date(startYear + '-12-31');
  var endOfSeason = new Date(endYear + '-06-30');

  var conn = db.connect(function (error) {
    if (error) { return callback(error); }

    var gamesCollection = conn.db.collection('games');
    var tablesCollection = conn.db.collection('tables');
    // Save mid-season snapshot of the table
    saveTable(gamesCollection, tablesCollection, startOfSeason, midOfSeason, function (error) {
      if (error) { return callback(error); }

      // Save end-of-season snapshot of the table
      saveTable(gamesCollection, tablesCollection, startOfSeason, endOfSeason, function (error) {
        callback(error);
      });
    });
  });
};

var saveTable = function (gamesCollection, tablesCollection, start, end, callback) {
  gamesCollection.find({
    date: { $gt: start, $lte: end },
  }).toArray(function (error, games) {
    if (error) { return callback(error); }

    var table = generateLeagueTable(games);

    tablesCollection.insert(table, function (error) {
      callback(error);
    });
  });
};

// Calculate league table
var generateLeagueTable = function (games) {
  var teams = {};
  games.forEach(function (game) {
    // Initialize teams if they don't exist
    [ game.homeTeam, game.awayTeam ].forEach(function (team) {
      if (!teams[team]) {
        teams[team] = {
          season: game.season,
          name: team,
          games: {
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            points: 0,
          },
          goals: {
            scored: 0,
            conceded: 0,
            diff: 0,
          },
        };
      }
    });

    var homeWon = game.score.fullTime.home > game.score.fullTime.away;
    var draw = game.score.fullTime.home === game.score.fullTime.away;

    // Increment both teams' play count
    teams[game.homeTeam].games.played += 1;
    teams[game.awayTeam].games.played += 1;

    // Set game result
    if (homeWon) {
      teams[game.homeTeam].games.won += 1;
      teams[game.homeTeam].games.points += POINTS_WIN;

      teams[game.awayTeam].games.lost += 1;
      teams[game.awayTeam].games.points += POINTS_LOSS;
    } else if (draw) {
      teams[game.homeTeam].games.drawn += 1;
      teams[game.homeTeam].games.points += POINTS_DRAW;

      teams[game.awayTeam].games.drawn += 1;
      teams[game.awayTeam].games.points += POINTS_DRAW;
    } else {
      teams[game.homeTeam].games.lost += 1;
      teams[game.homeTeam].games.points += POINTS_LOSS;

      teams[game.awayTeam].games.won += 1;
      teams[game.awayTeam].games.points += POINTS_WIN;
    }

    // Set Goal Stats
    teams[game.homeTeam].goals.scored += game.score.fullTime.home;
    teams[game.homeTeam].goals.conceded += game.score.fullTime.away;
    teams[game.homeTeam].goals.diff = teams[game.homeTeam].goals.scored - teams[game.homeTeam].goals.conceded;

    teams[game.awayTeam].goals.scored += game.score.fullTime.away;
    teams[game.awayTeam].goals.conceded += game.score.fullTime.home;
    teams[game.awayTeam].goals.diff = teams[game.awayTeam].goals.scored - teams[game.awayTeam].goals.conceded;
  });

  // Sort teams in desired order
  var table = Object.keys(teams).map(function(k) { return teams[k] });

  // Teritary sort by alphabetical order of team name
  table.sort(function (t1, t2) {
    if (t2.name > t1.name) {
      return -1;
    } else if (t2.name < t1.name) {
      return 1
    } else {
      return 0;
    }
  });

  // Secondary sort by goal diff
  table.sort(function (t1, t2) {
    return t1.goals.diff - t2.goals.diff;
  });

  // Primary sort by points
  table.sort(function (t1, t2) {
    return t2.games.points - t1.games.points;
  });

  table = table.map(function (row, index) {
    row.position = index + 1;
    return row;
  });

  return table;
};
