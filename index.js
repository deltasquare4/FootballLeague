// Choose output mode
// 1 - List all games lost at home
// 2 - Accept a date as an argument and list the league table at the end of that day

var assert = require('assert');
var path = require('path');

var parseMatches = require('./parser');
var print = require('./printer');

// Constants
var DATA_PATH = path.join(__dirname, 'data', '1-premierleague.csv');
var POINTS_WIN = 3;
var POINTS_DRAW = 1;
var POINTS_LOSS = 0;


// Lists lost home games
var lostHomeMatches = function (callback) {
  // Get the data
  parseMatches(DATA_PATH, function (error, games) {
    if (error) {
      console.error(error.stack);
      throw error;
      // return callback(error);
    }

    // Get lost home games
    var lostMatches = games.filter(function (match) {
      return (match.score.fullTime.home < match.score.fullTime.away);
    });

    // Print them
    print.games(lostMatches);
  });
};

// Calculate league table
var generateLeagueTable = function (currentDate) {
  currentDate = currentDate || new Date();

  if (typeof(currentDate) === 'string') {
    currentDate = new Date(currentDate);
  }

  parseMatches(DATA_PATH, function (error, games) {
    if (error) {
      console.error(error.stack);
      throw error;
    }

    var teams = {};
    games.forEach(function (game) {
      // Initialize teams if they don't exist
      [ game.homeTeam, game.awayTeam ].forEach(function (team) {
        if (!teams[team]) {
          teams[team] = {
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

      // Process games only if they've been played on or before specified date
      if (new Date(game.date) <= currentDate) {
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
      }
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

    // Print table
    print.leagueTable(table, currentDate);
  });
};



// Main program
assert.ok(process.argv.length > 2, 'Choose output by command line (1/2)');

if (process.argv[2] === '1') {
  lostHomeMatches();
} else if (process.argv[2] === '2') {
  generateLeagueTable(process.argv[3]);
} else {
  console.log('Invalid output');
}
