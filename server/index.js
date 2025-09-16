require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT;
const httpsPort = process.env.HTTPS_PORT;

const userRoutes = require('./routes/users');
const artistRoutes = require('./routes/artists');
const clientRoutes = require('./routes/clients');
const httpsRedirect = require('./middleware/httpsRedirect');

app.use(express.json());

app.use(httpsRedirect);

app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.use('/api/users', userRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/clients', clientRoutes);

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '../client/views/404.html'));
});

if (process.env.NODE_ENV !== 'test') 
{
  if (process.env.NODE_ENV === 'production') 
  {
    const https = require('https');
    const fs = require('fs');

    const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
    const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
    const ca = fs.readFileSync(process.env.SSL_CA_PATH, 'utf8');

    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca
    };

    const httpsServer = https.createServer(credentials, app);

    httpsServer.listen(httpsPort, () => {
      console.log(`HTTPS Server running on port ${httpsPort}`);
    });

    const http = require('http');
    const httpServer = http.createServer((req, res) => {
      res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
      res.end();
    });

    httpServer.listen(port, () => {
      console.log(`HTTP server listening on ${port} and redirecting to HTTPS`);
    });
  } else {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  }
}

module.exports = app;