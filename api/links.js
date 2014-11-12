(function() {
  var Links;

  Links = (function() {
    function Links(reddit) {
      this.reddit = reddit;
    }

    Links.prototype.submit = function(givenOptions, callback) {
      var options, param, params, _i, _len, _ref;
      _ref = ['subreddit', 'subject', 'modhash'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        param = _ref[_i];
        if (givenOptions[param] == null) {
          return callback("Required option missing: " + param);
        }
      }
      if ((givenOptions.url == null) && (givenOptions.text == null)) {
        return callback("Either url or text option is required.");
      }
      options = {
        api_type: 'json',
        sr: givenOptions.subreddit,
        title: givenOptions.subject,
        kind: givenOptions.url != null ? 'link' : 'text',
        uh: givenOptions.modhash
      };
      if (givenOptions.url != null) {
        options.url = givenOptions.url;
      }
      if (givenOptions.text != null) {
        options.text = givenOptions.text;
      }
      if (givenOptions.resubmit != null) {
        options.resubmit = givenOptions.resubmit;
      }
      params = Object.keys(options);
      return this.reddit._post('/api/submit', options, params, function(error, res) {
        if (error != null) {
          return callback(error);
        }
        return callback.apply(res);
      });
    };

    return Links;

  })();

  module.exports = function(reddit) {
    return reddit.links = new Links(reddit);
  };

}).call(this);
