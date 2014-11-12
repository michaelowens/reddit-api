class Links
    constructor: (@reddit) ->

    # Submit a link to a subreddit
    #
    # @param givenOptions [Object] The options for the submit call
    # @option givenOptions [String] subreddit `required` The name of the subreddit to submit to
    # @option givenOptions [String] subject `required` The subject of the post
    # @option givenOptions [String] modhash `required`
    # @option givenOptions [String] url `required (or text)` The link to submit
    # @option givenOptions [String] text `required (or url)` The text to submit
    # @option givenOptions [String] resubmit Resubmit if link was already posted to the subreddit before
    # @param callback [Function] The callback
    submit: (givenOptions, callback) ->
        for param in ['subreddit', 'subject', 'modhash']
            if not givenOptions[param]?
                return callback "Required option missing: " + param

        if not givenOptions.url? and not givenOptions.text?
            return callback "Either url or text option is required."

        options =
            api_type: 'json'
            sr: givenOptions.subreddit
            title: givenOptions.subject
            kind: if givenOptions.url? then 'link' else 'text'
            uh: givenOptions.modhash

        if givenOptions.url?
            options.url = givenOptions.url

        if givenOptions.text?
            options.text = givenOptions.text

        if givenOptions.resubmit?
            options.resubmit = givenOptions.resubmit

        params = Object.keys options

        @reddit._post '/api/submit', options, params, (error, res) ->
            return callback error if error?
            callback.apply res

module.exports = (reddit) -> reddit.links = new Links reddit
