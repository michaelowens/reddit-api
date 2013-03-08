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

    Reddit.prototype._postAgent = function(pathname, options) {
      if (options == null) {
        options = {};
      }
      return this._agent.post(url.format({
        protocol: 'https',
        host: 'ssl.reddit.com',
        pathname: pathname
      })).set('Content-Type', 'application/x-www-form-urlencoded').set('User-Agent', this._userAgent).send(options);
    };

    Reddit.prototype.login = function(username, password, callback) {
      var details,
        _this = this;
      details = {
        name: "Logging " + username + " in",
        options: {}
      };
      return this._enqueue(details, function(finished) {
        return _this._postAgent('/api/login', {
          api_type: 'json',
          user: username,
          passwd: password,
          rem: false
        }).end(function(res) {
          var _ref, _ref1;
          if (res.status === 200) {
            callback(null, (_ref = res.body.json) != null ? (_ref1 = _ref.data) != null ? _ref1.modhash : void 0 : void 0);
          } else {
            callback(new Error(JSON.stringify(details)));
          }
          return finished();
        });
      });
    };

    Reddit.prototype._getAgent = function(pathname, query) {
      if (query == null) {
        query = {};
      }
      return this._agent.get(url.format({
        protocol: 'https',
        host: 'ssl.reddit.com',
        pathname: pathname,
        query: query
      })).set('User-Agent', this._userAgent);
    };

    Reddit.prototype._get = function(pathname, options, callback) {
      var details,
        _this = this;
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      details = {
        name: "GET " + pathname,
        options: options
      };
      return this._enqueue(details, function(finished) {
        return _this._getAgent(pathname, options).end(function(res) {
          var _ref;
          if (res.status === 200) {
            callback(null, (_ref = res.body.data) != null ? _ref.children : void 0);
          } else {
            callback(new Error(JSON.stringify(details)));
          }
          return finished();
        });
      });
    };

    Reddit.prototype.messages = function(type, options, callback) {
      if (type == null) {
        type = 'inbox';
      }
      return this._get("/message/" + type + ".json", options, callback);
    };

    Reddit.prototype.subredditPosts = function(subreddit, type, options, callback) {
      if (typeof type === 'object') {
        callback = options;
        options = type;
        type = 'hot';
      }
      if (typeof type === 'function') {
        callback = type;
        options = {};
        type = 'hot';
      }
      return this._get("/r/" + subreddit + "/" + type + ".json", options, callback);
    };

    return Reddit;

  })();

}).call(this);
