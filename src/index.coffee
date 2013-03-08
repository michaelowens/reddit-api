CookieAccess = require('superagent/node_modules/cookiejar').CookieAccessInfo
events = require 'events'
superagent = require 'superagent'
url = require 'url'
util = require 'util'

class Reddit
	
	constructor: (@_userAgent) ->
		
		unless @_userAgent?
			throw new Error "You must specify a User Agent. See https://github.com/reddit/reddit/wiki/API for official API guidelines."
		
		events.EventEmitter.call this
		
		@_agent = superagent.agent()
		
		# Hax :/ Reddit should set its cookie on .reddit.com
		@_agent.attachCookies = (req) ->
			req.cookies = @jar.getCookies(
				CookieAccess 'reddit.com', '/', true
			).toValueString()
		
		@_queue = []
		@_dispatchInterval = null
		
		@_logging = false
		
	util.inherits Reddit, events.EventEmitter
	
	_dispatch: ->
		
		return if @_queue.length is 0
		
		dispatching = @_queue.shift()
		
		if @isLogging()
			
			name = dispatching.details.name
			delete dispatching.details.name
			
			console.log name, dispatching.details
		
		dispatching.callback =>
		
			@emit 'dispatchingFinished' if @_queue.length is 0
	
	_enqueue: (details, callback) ->
		
		@_queue.push details: details, callback: callback
	
	startDispatching: (ms = 2100) ->
	
		return if @_dispatchInterval?
		
		console.log "Dispatching started" if @isLogging()
		
		@_dispatchInterval = setInterval(
			@_dispatch.bind this
			ms
		)
	
	stopDispatching: ->
	
		return unless @_dispatchInterval?
		
		console.log "Dispatching stopped" if @isLogging()
		
		clearInterval @_dispatchInterval
		@_dispatchInterval = null
	
	setIsLogging: (@_logging) ->
		
		console.log "Logging turned #{if @_logging then 'on' else 'off'}" if @isLogging()
		
	isLogging: -> @_logging
	
	_postAgent: (pathname, options = {}) ->
		
		@_agent
			.post(
				url.format(
					protocol: 'https'
					host: 'ssl.reddit.com'
					pathname: pathname
				)
			)
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.set('User-Agent', @_userAgent)
			.send(options)
			
	login: (username, password, callback) ->
		
		details =
			name: "Logging #{username} in"
			options: {}
		
		@_enqueue details, (finished) =>
			
			@_postAgent('/api/login', {
				api_type: 'json'
				user: user
				passwd: password
				rem: false
			})
				.end (res) =>
					
					if res.status is 200
						
						callback null, res.body.json?.data?.modhash
						
					else
						
						callback new Error JSON.stringify details
						
					finished()
					
	_getAgent: (pathname, query = {}) ->
				
		@_agent
			.get(
				url.format(
					protocol: 'https'
					host: 'ssl.reddit.com'
					pathname: pathname
					query: query
				)
			)
			.set('User-Agent', @_userAgent)
	
	_get: (pathname, options, callback) ->
			
		if typeof options is 'function'
			
			callback = options
			options = {}
		
		details =
			name: "GET #{pathname}"
			options: options
		
		@_enqueue details, (finished) =>
			
			@_getAgent(pathname, options)
				.end (res) =>
					
					if res.status is 200
						
						callback null, res.body.data?.children
						
					else
						
						callback new Error JSON.stringify details
						
					finished()
					
	messages: (type = 'inbox', options, callback) ->
		
		@_get "/message/#{type}.json", options, callback
				
	subredditPosts: (subreddit, type, options, callback) ->
		
		if typeof type is 'object'
			
			callback = options
			options = type
			type = 'hot'
		
		if typeof type is 'function'
			
			callback = type
			options = {}
			type = 'hot'
			
		@_get "/r/#{subreddit}/#{type}.json", options, callback
