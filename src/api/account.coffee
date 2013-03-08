
module.exports = (Reddit) ->

	Reddit::clearSessions = (modhash, password, url, callback) ->
		
		options =
			curpass: password
			dest: url
			uh: modhash
		
		params = Object.keys options
		
		@_post '/api/clear_sessions', options, params, (error, res) =>
			
			return callback error if error?
			
			callback()
				
	Reddit::deleteUser = (username, password, modhash, callback) ->
		
		options =
			confirm: true
			passwd: password
			uh: modhash
			user: username
		
		params = Object.keys options
		
		@_post '/api/delete_user', options, params, (error, res) =>
			
			return callback error if error?
			
			callback()
				
	Reddit::login = (username, password, callback) ->
		
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
	
	Reddit::me = (callback) ->
				
		@_get '/api/me.json', (error, res) ->
		
			return callback error if error?
			
			callback null, res.body.data

	Reddit::update = (password, email, newPassword, modhash, callback) ->
		
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

