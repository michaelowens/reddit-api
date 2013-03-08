(function() {

  module.exports = function(Reddit) {
    Reddit.prototype.clearSessions = function(modhash, password, url, callback) {
      var options, params,
        _this = this;
      options = {
        curpass: password,
        dest: url,
        uh: modhash
      };
      params = Object.keys(options);
      return this._post('/api/clear_sessions', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback();
      });
    };
    Reddit.prototype.deleteUser = function(username, password, modhash, callback) {
      var options, params,
        _this = this;
      options = {
        confirm: true,
        passwd: password,
        uh: modhash,
        user: username
      };
      params = Object.keys(options);
      return this._post('/api/delete_user', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback();
      });
    };
    Reddit.prototype.login = function(username, password, callback) {
      var options, params,
        _this = this;
      params = ['user', 'passwd'];
      options = {
        api_type: 'json',
        user: username,
        passwd: password,
        rem: false
      };
      return this._post('/api/login', options, params, function(error, res) {
        var _ref, _ref1, _ref2, _ref3, _ref4;
        _this._agent.jar.setCookies(["reddit_session=" + ((_ref = res.body) != null ? (_ref1 = _ref.json) != null ? (_ref2 = _ref1.data) != null ? _ref2.cookie : void 0 : void 0 : void 0) + "; Domain=reddit.com; Path=/; HttpOnly"]);
        if (error != null) {
          return callback(error);
        }
        return callback(null, (_ref3 = res.body.json) != null ? (_ref4 = _ref3.data) != null ? _ref4.modhash : void 0 : void 0);
      });
    };
    Reddit.prototype.me = function(callback) {
      return this._get('/api/me.json', function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback(null, res.body.data);
      });
    };
    return Reddit.prototype.update = function(password, email, newPassword, modhash, callback) {
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
      return this._post('/api/update', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback();
      });
    };
  };

}).call(this);
