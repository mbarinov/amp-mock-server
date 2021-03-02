const express = require('express')
const uuid = require('uuid');
const cors = require('cors')
const app = express()
const port = 9000

const store = {
  sessions:{},
  users: {}
}

const corsOptions = {
	credentials: true,
	origin: function(origin, callback) {
			callback(null, true)
	}
}

app.use(express.static('public'))
app.use(cors(corsOptions))

app.get('/api/v1/amp', (req, res) => {
  const {
    amp_reader_id,
    article_url,
    return_url,
  } = req.query;

  if(store.users[amp_reader_id] && store.users[amp_reader_id].unlocked.includes(article_url)) {
    return res.json({
    	access: true
    })
  }

  const id = uuid.v4()

  store.users[amp_reader_id] = {id, unlocked:[]}

  store.sessions[id] = {
    amp_reader_id,
    article_url,
    return_url,
  }

  const data = {
		"identify_url": `http://localhost:9000/login?sessionId=${id}`,
		"purchase_options": {
				"price": {
					"amount": 19,
					"currency": "RUB",
				},
				"purchase_url": `http://localhost:9000/unlock?sessionId=${id}`,
    },
	};

	res.status(402).json(data)
})

app.get('/api/v1/session', (req,res) => {
  const sessionId = req.query.sessionId
  const data = store.sessions[sessionId]

  res.json(data)
})

app.get('/api/v1/unlock', (req,res) => {
  const sessionId = req.query.sessionId
  const data = store.sessions[sessionId]

  store.users[data.amp_reader_id].unlocked.push(data.article_url);
  res.json(data)
})

app.all('*', function(req, res) {
  res.sendfile('index.html', { root: __dirname+'/public' });
});

app.listen(port, () => {
	console.log(`AMP test server is listening at http://localhost:${port}`)
})
