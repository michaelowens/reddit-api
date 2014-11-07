(function() {
  var PrivateMessages;

  PrivateMessages = (function() {
    function PrivateMessages(reddit) {
      this.reddit = reddit;
    }

    PrivateMessages.prototype.block = function(thingId, modhash, callback) {
      var options, params;
      options = {
        id: thingId,
        uh: modhash
      };
      params = Object.keys(options);
      return this.reddit._post('/api/block', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback.apply(res);
      });
    };

    PrivateMessages.prototype.compose = function(captchaResponse, captchaId, subject, message, to, modhash, callback) {
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
      return this.reddit._post('/api/block', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback.apply(res);
      });
    };

    PrivateMessages.prototype.readMessage = function(thingId, modhash, callback) {
      var options, params;
      options = {
        id: thingId,
        uh: modhash
      };
      params = Object.keys(options);
      return this.reddit._post('/api/read_message', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback.apply(res);
      });
    };

    PrivateMessages.prototype.unreadMessage = function(thingId, modhash, callback) {
      var options, params;
      options = {
        id: thingId,
        uh: modhash
      };
      params = Object.keys(options);
      return this.reddit._post('/api/unread_message', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback.apply(res);
      });
    };

    PrivateMessages.prototype.get = function(type, options, callback) {
      if (typeof type === 'function') {
        callback = type;
        options = {};
        type = 'inbox';
      }
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      return this.reddit._get("/message/" + type + ".json", options, function(error, res) {
        var _ref;
        if (error != null) {
          return callback(error);
        }
        return callback.apply(res, [null, (_ref = res.body.data) != null ? _ref.children : void 0]);
      });
    };

    return PrivateMessages;

  })();

  module.exports = function(reddit) {
    return reddit.messages = new PrivateMessages(reddit);
  };

}).call(this);
