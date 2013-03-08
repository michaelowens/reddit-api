# Welcome!

This is a project to wrap and make the Reddit API easily accessible to your node.js applications.

See [the Reddit API documentation](http://www.reddit.com/dev/api) for details on what to do.

Please note, this is not finished. I will be developing it as I go. I am working on my own projects to leverage the reddit API, so I started the effort. Pull requests are very welcome!

# Example

Please don't mind the coffeescript example for the time being. Again, this is a work in prorgess. :)

You would launch this like:
`user=foo password=bar coffee test.coffee`

```
Reddit = require 'reddit-api'

reddit = new Reddit 'cutebot v0.1 by /u/YOUR_REDDIT_USERNAME_HERE'

# Automatic rate limiting.
reddit.startDispatching()

# Login operation.	
{user, password} = process.env
reddit.login user, password, (error) ->
	
	throw error if error?

# Fetch subreddit posts operation.
reddit.subredditPosts 'trees', (error, posts) ->
	
	throw error if error?
	
	console.log posts

# Notification when all queued operations are complete.
reddit.on 'dispatchingFinished', ->
	
	# Shut it down.
	reddit.stopDispatching()

```

# TODO

* Use the limiter by default, but allow bursting
* Obviously, implement more of the API including OAuth
