const express = require('express');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/reviews', (req, res) => {
  console.log('Request to: ', req.url, req.params);
  // TODO: account for pages,count,sort
  const productId = req.query.product_id || '';
  let page = 0;
  let count = 5;
  if (req.query.page && parseInt(req.query.page, 10) > 1) {
    page = parseInt(req.query.page, 10) - 1;
  }
  if (req.query.count && parseInt(req.query.count, 10) > 0) {
    count = parseInt(req.query.count, 10);
  }
  db.getReviews(productId, page, count)
    .then((data) => {
      const response = {
        product_id: productId,
        page: req.query.page,
        count: req.query.count,
        results: data.rows,
      };
      res.status(200).send(response);
    })
    .catch((err) => res.status(500).send(err.body));
});

app.get('/reviews/meta', (req, res) => {
  console.log('Request to: ', req.url, req.params);
  const productId = req.query.product_id || '';
  db.getMetaData(productId)
    .then((data) => {
      console.log();
      const response = {
        product_id: productId,
        ratings: data[0].rows[0].ratings || {},
        recommended: data[1].rows,
        characteristics: data[2].rows,
      };
      res.status(200).send(response);
    })
    .catch((err) => res.status(500).send(err.body));
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
