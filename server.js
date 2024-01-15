

const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const port = 8000;
const crypto = require('crypto');

const generateSessionSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const sessionSecret = generateSessionSecret();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const { auth } = require('express-openid-connect');



const { requiresAuth } = require('express-openid-connect');

const routes = require('./routes/routes'); 
app.use('/', routes);

const sessionConfig = {
  secret: sessionSecret, 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
};

app.use(session(sessionConfig));

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'anjufdIU&&HDOAHO7%%_nsua',
  baseURL: 'http://localhost:8000',
  clientID: 'hlaBQfKiOrpzWxBmKLQZ7WQY8L85Ousc',
  issuerBaseURL: 'https://dev-dhh7rrc7jjza3i2w.eu.auth0.com'
};
app.use(auth(config));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

app.get('/userprofile', requiresAuth(), (req, res) => {
  const user = req.oidc.user; 
  res.render('userprofile', { user, openInNewTab: true });
});

app.get('/login', (req, res) => {
  const domain = 'dev-dhh7rrc7jjza3i2w.eu.auth0.com';
  const clientId = 'hlaBQfKiOrpzWxBmKLQZ7WQY8L85Ousc';
  const redirectUri = 'http://localhost:8000/callbackk';
  const responseType = 'id_token';
  const scope = 'openid profile email';

  const loginUrl = `https://${domain}/authorize` +
                  `?response_type=${encodeURIComponent(responseType)}` +
                  `&client_id=${encodeURIComponent(clientId)}` +
                  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                  `&scope=${encodeURIComponent(scope)}`;

  res.redirect(loginUrl);
});


app.get('/authentication-status', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    console.log("Yes");
    res.json({ isAuthenticated: true });
  } else {
    console.log("No");
    res.json({ isAuthenticated: false });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    const returnTo = 'http://localhost:8000';
    const logoutUrl = `https://dev-dhh7rrc7jjza3i2w.eu.auth0.com/v2/logout?client_id=hlaBQfKiOrpzWxBmKLQZ7WQY8L85Ousc&returnTo=${encodeURIComponent(returnTo)}`;
    res.redirect(logoutUrl);
  });
});

app.get('/callbackk',async  (req, res, next) => {
  const accessToken = req.session && req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/login');
  }
  try {
    const response = await axios.get('https://dev-dhh7rrc7jjza3i2w.eu.auth0.com/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 200) {
      const user = response.data;

      req.session.isAuthenticated = true;
      req.session.user = user;
      return res.redirect('/user');
    } else {
      return res.redirect('/login');
    }
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return res.redirect('/login');
  }
});

app.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;