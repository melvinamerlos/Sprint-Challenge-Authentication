const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/dbConfig.js');
const { authenticate, jwtKey } = require('../auth/authenticate');

function generateToken(user) {
  const jwtPayload = {
    username: user.username
  };
  const jwtOptions = {
    expiresIn: '1h',
  };
  return jwt.sign(jwtPayload, jwtKey, jwtOptions);
}

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  // implement user registration
  const creds = req.body;
  const hash = bcrypt.hashSync(creds.password, 14);
  creds.password = hash;

  db('users')
    .insert(creds)
    .then(ids => {
      const id = ids[0];
      console.log(ids, ids[0])
      res
        .status(201)
        .json({ newUserId: id });
    })
    .catch(err => {
      res
        .status(500)
        .json(err);
    });
};

function login(req, res) {
  // implement user login
  const creds = req.body;
  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);
        res
          .status(200)
          .json({
            welcome: user.username, token
          });
      } else {
        res
          .status(401)
          .json({ message: 'Please enter both a username and password :)' })
      }
    })
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
