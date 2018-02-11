const express = require('express')
const request = require('request')
const querystring = require('querystring')
const cookieParser = require('cookie-parser')

// initial setup
const config = require('./config.json')
const app = express()

// absolutely The Wrong Way To Do It(tm)

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = (length) => {
	let text = ''
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

const stateKey = 'spotify_auth_state'

// login handler
app.get('/login', (req, res) => {

	const state = generateRandomString(16)
	res.cookie(stateKey, state)

	// your application requests authorization
	const scope = 'user-read-private user-read-email user-library-read'
	res.redirect('https://accounts.spotify.com/authorize?' +
		querystring.stringify({
			response_type: 'code',
			client_id: config.client_id,
			scope: scope,
			redirect_uri: config.redirect_uri,
			state: state
		}))
})

// oauth2 callback
app.get('/callback', (req, res) => {

	// your application requests refresh and access tokens
	// after checking the state parameter

	const code = req.query.code || null
	const state = req.query.state || null

	// request an authorization code
	res.clearCookie(stateKey)
	const authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		form: {
			code: code,
			redirect_uri: config.redirect_uri,
			grant_type: 'authorization_code'
		},
		headers: {
			'Authorization': 'Basic ' + (new Buffer(config.client_id + ':' + config.client_secret).toString('base64'))
		},
		json: true
	}

	// actually make the post
	request.post(authOptions, (error, response, body) => {
		if (!error && response.statusCode === 200) {
			// we've successfully created an auth token!
			const access_token  = body.access_token
			const refresh_token = body.refresh_token

			const options = {
				url: 'https://api.spotify.com/v1/me',
				headers: {
					'Authorization': 'Bearer ' + access_token
				},
				json: true
			}

			// use the access token to access the Spotify Web API
			request.get(options, function(error, response, body) {
				console.log(body)
				if (body.id != config.authorized_user) {
					res.redirect('/unauth.html')
				} else {
					config.access_token = access_token
					config.refresh_token = refresh_token
					res.redirect('/')
				}
			})
		} else {
			res.redirect('/unauth.html')
		}
	})
})

app.get('/refresh_token', function(req, res) {

	// requesting access token from refresh token
	var refresh_token = req.query.refresh_token;
	var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: {
			'Authorization': 'Basic ' + (new Buffer(config.client_id + ':' + config.client_secret).toString('base64'))
		},
		form: {
			grant_type: 'refresh_token',
			refresh_token: config.refresh_token
		},
		json: true
	};

	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var access_token = body.access_token;
			config.access_token = access_token
			res.redirect('/')
		}
	});
});

app.get('/', (req, res) => {
	console.log(config)
	if (!('access_token' in config)) {
		res.redirect('/login')
	} else {
		res.sendFile(__dirname + '/static/index.html')
	}
})

app.get('/tracks', (req, res) => {
	if (!('access_token' in config)) {
		res.redirect('/login')
		return
	}

	const offset = req.query.offset || '0'

	const options = {
		url: `https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`,
		headers: {
			'Authorization': 'Bearer ' + config.access_token
		},
		json: true
	}

	// use the access token to access the Spotify Web API
	request.get(options, function(error, response, body) {
		res.send(body)
	})

})

// static routes
app.use(express.static(__dirname + '/static'))
	.use(cookieParser())

console.log('Listening on 30400');
app.listen(30400);
