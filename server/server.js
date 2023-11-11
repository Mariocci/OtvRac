
const express = require('express');
const app = express();
const path = require('path');
const port = 8000;
const routes = require('./routes/routes'); 

app.use(express.static(path.join(__dirname, '../public')));
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
