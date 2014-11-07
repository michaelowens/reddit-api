class PrivateMessages
    constructor: (@reddit) ->
    block: (thingId, modhash, callback) ->
        options =
            id: thingId
            uh: modhash

        params = Object.keys options

        @reddit._post '/api/block', options, params, (error, res) ->
            return callback error if error?
            callback.apply res

    compose: (
        captchaResponse
        captchaId
        subject
        message
        to
        modhash
        callback
    ) ->
        options =
            captcha: captchaResponse
            iden: captchaId
            subject: subject
            text: message
            to: to
            uh: modhash

        params = Object.keys options

        @reddit._post '/api/block', options, params, (error, res) ->
            return callback error if error?
            callback.apply res

    # Mark a private message as read
    #
    # @param thingId [String] The message ID
    # @param modhash [String] The modhash given by Reddit
    # @param callback [Function] The callback
    readMessage: (thingId, modhash, callback) ->
        options =
            id: thingId
            uh: modhash

        params = Object.keys options

        @reddit._post '/api/read_message', options, params, (error, res) ->
            return callback error if error?
            callback.apply res

    unreadMessage: (thingId, modhash, callback) ->
        options =
            id: thingId
            uh: modhash

        params = Object.keys options

        @reddit._post '/api/unread_message', options, params, (error, res) ->
            return callback error if error?
            callback.apply res

    get: (type, options, callback) ->
        if typeof type is 'function'
            callback = type
            options = {}
            type = 'inbox'

        if typeof options is 'function'
            callback = options
            options = {}

        @reddit._get "/message/#{type}.json", options, (error, res) ->
            return callback error if error?
            callback.apply res, [null, res.body.data?.children]

module.exports = (reddit) -> reddit.messages = new PrivateMessages reddit
