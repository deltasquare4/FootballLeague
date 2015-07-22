// Choose output mode
// 0 - Import specified data file
// 1 - List biggest win, biggest home win and biggest away win for a team
// 2 - List all teams and number of seasons they have played
// 3 - Show the teams with biggest comeback in terms of table position in a single season since end of the calendar year

var assert = require('assert');
var path = require('path');

var parseMatches = require('./parser');
var Import = require('./importer');
var print = require('./printer');
var query = require('./query');

// Main program
assert.ok(process.argv.length > 2, 'Choose output by command line (0/1/2/3)');

if (process.argv[2] === '0') {
  // Import
  assert.ok(process.argv.length > 3, 'Please specify one or more input files');
  Import.leagues(Array.prototype.slice.call(process.argv, 3), function (error) {
    if (error) { throw error; }

    console.log('Imported all files successfully');
    process.exit();
  });
} else if (process.argv[2] === '1') {
  // Biggest win, home win and away win for a team
  assert.ok(process.argv.length === 4, 'Please specify team name');
  query.biggestWins(process.argv[3], function (error, homeWin, awayWin, win) {
    if (error) { throw error; }

    var overallOpponent = win.homeTeam === process.argv[3] ? win.awayTeam : win.homeTeam;
    console.log('Biggest Home Win: vs %s, %d - %d on %s', homeWin.awayTeam, homeWin.score.fullTime.home, homeWin.score.fullTime.away, homeWin.date.toDateString());
    console.log('Biggest Away Win: vs %s, %d - %d on %s', awayWin.homeTeam, awayWin.score.fullTime.home, awayWin.score.fullTime.away, homeWin.date.toDateString());
    console.log('Biggest Home Win: vs %s, %d - %d on %s', overallOpponent, win.score.fullTime.home, win.score.fullTime.away, homeWin.date.toDateString());
    process.exit();
  });
} else if (process.argv[2] === '2') {
  // All the teams with number of seasons played in the league
  query.numberOfSeasons(function (error, teams) {
    if (error) { throw error; }

    print.teams(teams);
    process.exit();
  });
} else if (process.argv[2] === '3') {
  // Biggest comeback in terms of table position at the end of the season from 31 Dec
  query.biggestComeback(function (error, team) {
    if (error) { throw error; }

    console.log('%s was at %d in mid-season of %s, and improved %d positions to reach %d position at the end', team.team, team.midPosition, team.season, team.improvement, team.endPosition)
    process.exit();
  });
} else {
  console.log('Invalid output');
}
