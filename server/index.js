const app = require('./app');
require('dotenv').config();

app.listen(process.env.LOCAL_LISTENING_PORT, () => {
  console.log(`Listening on port ${process.env.LOCAL_LISTENING_PORT}`);
});
