var assert = require('assert');

var db = require('./db');

exports.biggestWins = function (team, callback) {
  assert.ok(team, 'team is required');
  assert.ok(typeof(callback) === 'function', 'callback should be a function');
  var biggestHomeWin;
  var biggestAwayWin;
  var biggestWin;

  var conn = db.connect(function (error) {
    if (error) { return callback(error); }

    var gamesCollection = conn.db.collection('games');

    gamesCollection.find({
      homeTeam: team,
    }).sort({
      'score.fullTime.diff': -1,
      'score.fullTime.away': 1,
      'date': -1,
    }).limit(1).toArray(function (error, games) {
      if (error) { return callback(error); }
      var game = games[0];

      biggestHomeWin = game;

      gamesCollection.find({
        awayTeam: team,
      }).sort({
        'score.fullTime.diff': 1,
        'score.fullTime.home': 1,
        'date': -1,
      }).limit(1).toArray(function (error, games) {
        if (error) { return callback(error); }
        var game = games[0];

        biggestAwayWin = game;

        if (biggestAwayWin.score.fullTime.diff >= biggestHomeWin.score.fullTime.diff) {
          biggestWin = biggestAwayWin;
        } else {
          biggestWin = biggestHomeWin;
        }

        callback(null, biggestHomeWin, biggestAwayWin, biggestWin);
      });
    });
  });
};

exports.numberOfSeasons = function (callback) {
  assert.ok(typeof(callback) === 'function', 'callback should be a function');

  var conn = db.connect(function (error) {
    if (error) { return callback(error); }

    var tablesCollection = conn.db.collection('tables');

    tablesCollection.aggregate([
      { $group: { _id: '$name', count: { $sum: 0.5 }}}
    ]).sort({ count: -1 }).toArray(function (error, result) {
      callback(error, result);
    });
  });
};

exports.biggestComeback = function (callback) {
  assert.ok(typeof(callback) === 'function', 'callback should be a function');

  var conn = db.connect(function (error) {
    if (error) { return callback(error); }

    var tablesCollection = conn.db.collection('tables');

    var map = function () {
      emit(this.season + '_' + this.name, {
        season: this.season,
        team: this.name,
        position: this.position,
        gamesPlayed: this.games.played,
        midPosition: 0,
        endPosition: 0,
        improvement: 0,
      });
    };

    var reduce = function (key, values) {
      var result = {
        season: values[0].season,
        team: values[0].team,
        position: 0,
        gamesPlayed: 0,
        midPosition: 0,
        endPosition: 0,
        improvement: 0,
      };

      // We assume there is going to be only two values per season-team
      if (values[0].gamesPlayed > values[1].gamesPlayed) {
        result.midPosition = values[1].position;
        result.endPosition = values[0].position;
      } else {
        result.midPosition = values[0].position;
        result.endPosition = values[1].position;
      }

      result.improvement = result.midPosition - result.endPosition;

      return result;
    };

    tablesCollection.mapReduce(map, reduce, {
      out: { inline: 1 }
    }, function (error, result) {
      if (error) { return callback(error); }

      result = result.map(function (res) {
        return res.value;
      });

      result.sort(function (t1, t2) {
        if (t2.improvement > t1.improvement) {
          return 1;
        } else if (t2.improvement < t1.improvement) {
          return -1
        } else {
          return 0;
        }
      });

      callback(null, result[0]);
    });
  });
};
