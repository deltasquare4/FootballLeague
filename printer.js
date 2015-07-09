var Table = require('cli-table');

// Constants
var HDELIMITER = '\t\t\t';
var DELIMITER = '\t\t';

exports.games = function (games) {
  if (games.length > 0) {
    var table = new Table({
      head: ['Date', 'Home Team', 'Away Team', 'Final Score'],
      colWidths: [20, 20, 20, 20],
    });

    games.forEach(function (game) {
      table.push([game.date.toDateString(), game.homeTeam, game.awayTeam,
        game.score.fullTime.home + ' - ' + game.score.fullTime.away]);
    });

    console.log(table.toString());
  } else {
    console.log('--------------------');
    console.log('No games match the criteria');
    console.log('--------------------');
  }
};

exports.leagueTable = function (teams, date) {
  console.log('League table as on ', date);

  var table = new Table({
    head: ['Position', 'Team', 'Played', 'Won', 'Drawn', 'Lost', 'G Scored', 'G Conceded', 'G Diff', 'Points'],
    colWidths: [10, 20, 10, 10, 10, 10, 10, 10, 10, 10],
  });

  var count = 0;
  teams.forEach(function (team) {
    table.push([
      count += 1,
      team.name,
      team.games.played,
      team.games.won,
      team.games.drawn,
      team.games.lost,
      team.goals.scored,
      team.goals.conceded,
      team.goals.diff,
      team.games.points
    ]);
  });

  console.log(table.toString());
};
