(function() {
  var CookieAccess, Reddit, events, superagent, url, util;

  CookieAccess = require('superagent/node_modules/cookiejar').CookieAccessInfo;

  events = require('events');

  superagent = require('superagent');

  url = require('url');

  util = require('util');

  module.exports = Reddit = (function() {

    function Reddit(_userAgent) {
      this._userAgent = _userAgent;
      if (this._userAgent == null) {
        throw new Error("You must specify a User Agent. See https://github.com/reddit/reddit/wiki/API for official API guidelines.");
      }
      events.EventEmitter.call(this);
      this._agent = superagent.agent();
      this._agent.attachCookies = function(req) {
        return req.cookies = this.jar.getCookies(CookieAccess('reddit.com', '/', true)).toValueString();
      };
      this._dispatchMode = 'immediate';
      this._queue = [];
      this._queueCount = 0;
      this._limiterFrequency = 2100;
      this._limiterInterval = null;
      this._logging = false;
    }

    util.inherits(Reddit, events.EventEmitter);

    Reddit.prototype.setDispatchMode = function(dispatchMode) {
      this._dispatchMode = (function() {
        switch (dispatchMode) {
          case 'limited':
            this._startDispatching();
            return 'limited';
          case 'deferred':
            this._stopDispatching();
            return 'deferred';
          default:
            this._stopDispatching();
            return 'immediate';
        }
      }).call(this);
      if (this.isLogging()) {
        return console.log("Set dispatch mode to " + this._dispatchMode);
      }
    };

    Reddit.prototype.dispatchMode = function() {
      return this._dispatchMode;
    };

    Reddit.prototype.burst = function() {
      var _results;
      _results = [];
      while (this._queue.length > 0) {
        _results.push(this._dispatch());
      }
      return _results;
    };

    Reddit.prototype._dispatch = function() {
      var dispatching,
        _this = this;
      if (this._queue.length === 0) {
        return;
      }
      dispatching = this._queue.shift();
      if (this.isLogging()) {
        console.log('Dispatching:', dispatching);
      }
      return dispatching.callback(function() {
        _this._queueCount -= 1;
        if (_this._queueCount === 0) {
          return _this.emit('drain');
        }
      });
    };

    Reddit.prototype._enqueue = function(details, callback) {
      switch (this.dispatchMode()) {
        case 'immediate':
          if (this.isLogging()) {
            console.log('Dispatching:', details);
          }
          return callback(function() {});
        case 'deferred':
        case 'limited':
          if (this.isLogging()) {
            console.log('Enqueueing:', details);
          }
          this._queue.push({
            details: details,
            callback: callback
          });
          return this._queueCount += 1;
      }
    };

    Reddit.prototype._startDispatching = function() {
      if (this._limiterInterval != null) {
        return;
      }
      if (this.isLogging()) {
        console.log("Dispatching started");
      }
      return this._limiterInterval = setInterval(this._dispatch.bind(this), this._limiterFrequency);
    };

    Reddit.prototype._stopDispatching = function() {
      if (this._limiterInterval == null) {
        return;
      }
      if (this.isLogging()) {
        console.log("Dispatching stopped");
      }
      clearInterval(this._limiterInterval);
      return this._limiterInterval = null;
    };

    Reddit.prototype.setLimiterFrequency = function(_limiterFrequency) {
      this._limiterFrequency = _limiterFrequency;
    };

    Reddit.prototype.limiterFrequency = function() {
      return this._limiterFrequency;
    };

    Reddit.prototype.setIsLogging = function(_logging) {
      this._logging = _logging;
      return console.log("Logging turned " + (this._logging ? 'on' : 'off'));
    };

    Reddit.prototype.isLogging = function() {
      return this._logging;
    };

    Reddit.prototype._post = function(pathname, options, params, callback) {
      var details, error,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      if (typeof options === 'function') {
        callback = options;
        params = [];
        options = {};
      }
      if ((error = this._checkParams(options, params)) != null) {
        return callback(error);
      }
      details = {
        name: "POST " + pathname,
        options: options
      };
      return this._enqueue(details, function(finished) {
        return _this._agent.post(url.format({
          protocol: 'https',
          host: 'ssl.reddit.com',
          pathname: pathname
        })).set('Content-Type', 'application/x-www-form-urlencoded').set('User-Agent', _this._userAgent).send(options).end(function(res) {
          console.log(res);
          if (res.status === 200) {
            callback(null, res);
          } else {
            callback(new Error(JSON.stringify(details)));
          }
          return finished();
        });
      });
    };

    Reddit.prototype._get = function(pathname, options, params, callback) {
      var details, error,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      if (typeof options === 'function') {
        callback = options;
        params = [];
        options = {};
      }
      if ((error = this._checkParams(options, params)) != null) {
        return callback(error);
      }
      details = {
        name: "GET " + pathname,
        options: options
      };
      return this._enqueue(details, function(finished) {
        return _this._agent.get(url.format({
          protocol: 'https',
          host: 'ssl.reddit.com',
          pathname: pathname,
          query: options
        })).set('User-Agent', _this._userAgent).end(function(res) {
          if (res.status === 200) {
            callback(null, res);
          } else {
            callback(new Error(JSON.stringify(details)));
          }
          return finished();
        });
      });
    };

    Reddit.prototype._checkParams = function(options, params) {
      var missing, param, _i, _len;
      missing = [];
      for (_i = 0, _len = params.length; _i < _len; _i++) {
        param = params[_i];
        if (options[param] == null) {
          missing.push(param);
        }
      }
      missing = missing.join(', ');
      if (missing !== '') {
        return new Error("Missing parameters: " + missing);
      }
    };

    /*
    	 # Account
    */


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

    Reddit.prototype.update = function(password, email, newPassword, modhash, callback) {
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

    /*
    	 # Apps
    */


    /*
    	 # Flair
    */


    /*
    	 # Links & Comments
    */


    /*
    	 # Listings
    */


    /*
    	 # Private Messages
    */


    Reddit.prototype.block = function(thingId, modhash, callback) {
      var options, params;
      options = {
        id: thingId,
        uh: modhash
      };
      params = Object.keys(options);
      return this._post('/api/block', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback();
      });
    };

    Reddit.prototype.compose = function(captchaResponse, captchaId, subject, message, to, modhash, callback) {
      var options, params;
      options = {
        captcha: captchaResponse,
        iden: captchaId,
        subject: subject,
        text: message,
        to: to,
        uh: modhash
      };
      params = Object.keys(options);
      return this._post('/api/block', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback();
      });
    };

    Reddit.prototype.readMessage = function(thingId, modhash) {
      var options, params;
      options = {
        id: thingId,
        uh: modhash
      };
      params = Object.keys(options);
      return this._post('/api/read_message', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback();
      });
    };

    Reddit.prototype.unreadMessage = function(thingId, modhash) {
      var options, params;
      options = {
        id: thingId,
        uh: modhash
      };
      params = Object.keys(options);
      return this._post('/api/unread_message', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback();
      });
    };

    Reddit.prototype.messages = function(type, options, callback) {
      if (typeof type === 'function') {
        callback = type;
        options = {};
        type = 'inbox';
      }
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      return this._get("/message/" + type + ".json", options, function(error, res) {
        var _ref;
        if (error != null) {
          return callback(error);
        }
        return callback(null, (_ref = res.body.data) != null ? _ref.children : void 0);
      });
    };

    /*
    	 # Misc.
    */


    /*
    	 # Moderation
    */


    /*
    	 # Search
    */


    /*
    	 # Subreddits
    */


    /*
    	 # Users
    */


    /*
    	 # Wiki
    */


    return Reddit;

  })();

}).call(this);
