CookieAccess = require('superagent/node_modules/cookiejar').CookieAccessInfo
events = require 'events'
superagent = require 'superagent'
url = require 'url'
util = require 'util'

module.exports = class Reddit
	
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
			
		@_dispatchMode = 'immediate'
		
		@_queue = []
		@_queueCount = 0
		@_limiterFrequency = 2100
		@_limiterInterval = null
		
		@_logging = false
		
	util.inherits Reddit, events.EventEmitter
	
	setDispatchMode: (dispatchMode) ->
		
		@_dispatchMode = switch dispatchMode
			
			when 'limited'
				
				@_startDispatching()
				
				'limited'
			
			when 'deferred'
				
				@_stopDispatching()
				
				'deferred'
				
			else
				
				@_stopDispatching()
				
				'immediate'
				
		console.log "Set dispatch mode to #{@_dispatchMode}" if @isLogging()
			
	dispatchMode: -> @_dispatchMode
	
	burst: -> @_dispatch() while @_queue.length > 0
	
	_dispatch: ->
		
		return if @_queue.length is 0
		
		dispatching = @_queue.shift()
		
		if @isLogging()
			
			console.log 'Dispatching:', dispatching
		
		dispatching.callback =>
			
			@_queueCount -= 1
		
			@emit 'drain' if @_queueCount is 0
	
	_enqueue: (details, callback) ->
		
		switch @dispatchMode()
		
			when 'immediate'
				
				console.log 'Dispatching:', details if @isLogging()
				
				callback ->
				
			when 'deferred', 'limited'
		
				console.log 'Enqueueing:', details if @isLogging()
		
				@_queue.push details: details, callback: callback
				
				@_queueCount += 1
	
	_startDispatching: ->
	
		return if @_limiterInterval?
		
		console.log "Dispatching started" if @isLogging()
		
		@_limiterInterval = setInterval(
			@_dispatch.bind this
			@_limiterFrequency
		)
	
	_stopDispatching: ->
	
		return unless @_limiterInterval?
		
		console.log "Dispatching stopped" if @isLogging()
		
		clearInterval @_limiterInterval
		@_limiterInterval = null
	
	setLimiterFrequency: (@_limiterFrequency) ->
	
	limiterFrequency: -> @_limiterFrequency
	
	setIsLogging: (@_logging) ->
		
		console.log "Logging turned #{if @_logging then 'on' else 'off'}"
		
	isLogging: -> @_logging
	
	_post: (pathname, options, params, callback) ->
		
		options ?= {}
		
		if typeof params is 'function'
			
			callback = params
			params = []
		
		if typeof options is 'function'
			
			callback = options
			params = []
			options = {}
		
		if (error = @_checkParams options, params)?
			return callback error
		
		details =
			name: "POST #{pathname}"
			options: options
		
		@_enqueue details, (finished) =>
			
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
				.end (res) ->
					
					if res.status is 200
						
						callback null, res
						
					else
						
						callback new Error JSON.stringify details
						
					finished()
					
	_get: (pathname, options, params, callback) ->
		
		options ?= {}
			
		if typeof params is 'function'
			
			callback = params
			params = []
			
		if typeof options is 'function'
			
			callback = options
			params = []
			options = {}
		
		if (error = @_checkParams options, params)?
			return callback error
		
		details =
			name: "GET #{pathname}"
			options: options
		
		@_enqueue details, (finished) =>
			
			@_agent
				.get(
					url.format(
						protocol: 'https'
						host: 'ssl.reddit.com'
						pathname: pathname
						query: options
					)
				)
				.set('User-Agent', @_userAgent)
				.end (res) ->
					
					if res.status is 200
						
						callback null, res
						
					else
						
						callback new Error JSON.stringify details
						
					finished()
	
	_checkParams: (options, params) ->
		
		missing = []
		for param in params
			missing.push param unless options[param]?
		missing = missing.join ', '
		
		new Error "Missing parameters: #{missing}" unless missing is ''

	###
	 # Account
	###
		
	clearSessions: (modhash, password, url, callback) ->
		
		options =
			curpass: password
			dest: url
			uh: modhash
		
		params = Object.keys options
		
		@_post '/api/clear_sessions', options, params, (error, res) =>
			
			return callback error if error?
			
			callback()
				
	deleteUser: (username, password, modhash, callback) ->
		
		options =
			confirm: true
			passwd: password
			uh: modhash
			user: username
		
		params = Object.keys options
		
		@_post '/api/delete_user', options, params, (error, res) =>
			
			return callback error if error?
			
			callback()
				
	login: (username, password, callback) ->
		
		params = ['user', 'passwd']
		
		options =
			api_type: 'json'
			user: username
			passwd: password
			rem: false
		
		@_post '/api/login', options, params, (error, res) =>
			
			@_agent.jar.setCookies([
				"reddit_session=#{res.body?.json?.data?.cookie}; Domain=reddit.com; Path=/; HttpOnly"
			])
			
			return callback error if error?
		
			callback null, res.body.json?.data?.modhash
	
	me: (callback) ->
				
		@_get '/api/me.json', (error, res) ->
		
			return callback error if error?
			
			callback null, res.body.data

	update: (password, email, newPassword, modhash, callback) ->
		
		options =
			curpass: password
			email: email
			newpass: newPassword
			uh: modhash
			verify: true
			verpass: newPassword
		
		params = Object.keys options
		
		@_post '/api/update', options, params, (error, res) ->
		
			return callback error if error?
			
			callback()

	###
	 # Apps
	###
		
	###
	 # Flair
	###
		
	###
	 # Links & Comments
	###
		
	###
	 # Listings
	###
		
	###
	 # Private Messages
	###
		
	messages: (type, options, callback) ->
		
		if typeof type is 'function'
			
			callback = type
			options = {}
			type = 'inbox'
			
		if typeof options is 'function'
			
			callback = options
			options = {}
		
		@_get "/message/#{type}.json", options, (error, res) ->
			
			return callback error if error?
		
			callback null, res.body.data?.children
				
	###
	 # Misc.
	###
		
	###
	 # Moderation
	###
		
	###
	 # Search
	###
		
	###
	 # Subreddits
	###
		
	###
	 # Users
	###
		
	###
	 # Wiki
	###
