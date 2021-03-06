(function() {
  var Account;

  Account = (function() {
    function Account(reddit) {
      this.reddit = reddit;
    }

    Account.prototype.clearSessions = function(modhash, password, url, callback) {
      var options, params;
      options = {
        curpass: password,
        dest: url,
        uh: modhash
      };
      params = Object.keys(options);
      return this.reddit._post('/api/clear_sessions', options, params, (function(_this) {
        return function(error, res) {
          if (error != null) {
            return callback(error);
          }
          return callback.apply(res);
        };
      })(this));
    };

    Account.prototype.deleteUser = function(username, password, modhash, callback) {
      var options, params;
      options = {
        confirm: true,
        passwd: password,
        uh: modhash,
        user: username
      };
      params = Object.keys(options);
      return this.reddit._post('/api/delete_user', options, params, (function(_this) {
        return function(error, res) {
          if (error != null) {
            return callback(error);
          }
          return callback.apply(res);
        };
      })(this));
    };

    Account.prototype.login = function(username, password, callback) {
      var options, params;
      params = ['user', 'passwd'];
      options = {
        api_type: 'json',
        user: username,
        passwd: password,
        rem: false
      };
      return this.reddit._post('/api/login', options, params, (function(_this) {
        return function(error, res) {
          var _ref, _ref1, _ref2, _ref3, _ref4;
          _this.reddit._agent.jar.setCookies(["reddit_session=" + ((_ref = res.body) != null ? (_ref1 = _ref.json) != null ? (_ref2 = _ref1.data) != null ? _ref2.cookie : void 0 : void 0 : void 0) + "; Domain=reddit.com; Path=/; HttpOnly"]);
          if (error != null) {
            return callback(error);
          }
          return callback.apply(res, [null, (_ref3 = res.body.json) != null ? (_ref4 = _ref3.data) != null ? _ref4.modhash : void 0 : void 0]);
        };
      })(this));
    };

    Account.prototype.oAuthAuthorize = function(clientId, clientSecret, state, code, scope, callback) {
      var details, options;
      if (scope == null) {
        scope = ['identity'];
      }
      if (typeof scope === 'function') {
        callback = scope;
        scope = ['identity'];
      }
      options = {
        state: state,
        scope: scope.join(','),
        client_id: 'tMsPeTkhps5_tg',
        redirect_uri: 'http://reddichat.com/reddit/oauth',
        code: code,
        grant_type: 'authorization_code'
      };
      details = {
        name: "reddit OAuth authorization",
        options: options
      };
      return this.reddit._enqueue(details, (function(_this) {
        return function(finished) {
          return _this.reddit._agent.post("https://" + clientId + ":" + clientSecret + "@ssl.reddit.com/api/v1/access_token").set('Content-Type', 'application/x-www-form-urlencoded').set('User-Agent', _this._userAgent).send(options).end(function(res) {
            if (res.status === 200) {
              callback.apply(res, [null, res.body]);
            } else {
              callback(new Error(JSON.stringify(details)));
            }
            return finished();
          });
        };
      })(this));
    };

    Account.prototype.oAuthMe = function(token, callback) {
      var details;
      details = {
        name: "reddit OAuth Me",
        options: {
          token: token
        }
      };
      return this.reddit._enqueue(details, (function(_this) {
        return function(finished) {
          return _this.reddit._agent.get('https://oauth.reddit.com/api/v1/me').set('Authorization', "bearer " + token).set('User-Agent', _this._userAgent).end(function(res) {
            if (res.status === 200) {
              callback.apply(res, [null, res.body]);
            } else {
              callback(new Error(JSON.stringify(details)));
            }
            return finished();
          });
        };
      })(this));
    };

    Account.prototype.me = function(callback) {
      return this.reddit._get('/api/me.json', function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback.apply(res, [null, res.body.data]);
      });
    };

    Account.prototype.update = function(password, email, newPassword, modhash, callback) {
      var options, params;
      options = {
        curpass: password,
        email: email,
        newpass: newPassword,
        uh: modhash,
        verify: true,
        verpass: newPassword
      };
      params = Object.keys(options);
      return this.reddit._post('/api/update', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback.apply(res);
      });
    };

    return Account;

  })();

  module.exports = function(reddit) {
    return reddit.account = new Account(reddit);
  };

}).call(this);
