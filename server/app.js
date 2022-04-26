const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/loaderio-52daed5d46f379eec3c611c3df10ddd1.txt', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '../token.txt'));
});

app.get('/reviews', (req, res) => {
  console.log('Request to: ', req.url, req.params);
  // TODO: account for pages,count,sort
  const { sort } = req.query;
  const productId = req.query.product_id || '';
  let page = 0;
  let count = 5;
  if (req.query.page && parseInt(req.query.page, 10) > 0) {
    page = parseInt(req.query.page, 10) - 1;
  }
  if (req.query.count && parseInt(req.query.count, 10) > 0) {
    count = parseInt(req.query.count, 10);
  }

  db.getReviews(productId, (page * count), (page * count) + count + 1, sort)
    .then((data) => {
      const response = {
        product_id: productId,
        page: req.query.page,
        count: req.query.count,
        results: data.rows.slice((page * count), (page * count) + count),
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
      const characteristicsObject = {};

      // return a characteristics object with proper keu names
      if (data[2].rows[0].weightedcharacteristics) {
        Object.entries(data[2].rows[0].weightedcharacteristics).forEach((row) => {
          data[3].rows.forEach((characteristic) => {
            const { id, name } = characteristic;
            if (id === Number(row[0]) && typeof characteristicsObject.name === 'undefined') {
            // eslint-disable-next-line prefer-destructuring
              characteristicsObject[name] = {
                id,
                value: row[1].toFixed(3),
              };
            }
          });
        });
      } else {
        const traits = data[3].rows;
        traits.forEach((trait) => {
          characteristicsObject[trait.name] = {
            id: trait.id,
            value: '0',
          };
        });
      }

      const response = {
        product_id: productId,
        ratings: data[0].rows[0].ratings || {},
        recommended: (data[1].rows[0].recommended ? {
          0: data[1].rows[0].recommended.true,
          1: data[1].rows[0].recommended.false,
        } : {}),
        characteristics: characteristicsObject || {},
      };

      res.status(200).send(response);
    })
    .catch((err) => res.status(500).send(err.body));
});

app.post('/reviews', (req, res) => {
  console.log(req.body);
  db.addAReview(req.body)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => res.status(500).send(err.body));
});

app.put('/reviews/:review_id/helpful', (req, res) => {
  console.log(req.params);
  db.markHelpful(req.params.review_id)
    .then(() => {
      res.status(204).send();
    })
    .catch((err) => res.status(500).send(err.body));
});

app.put('/reviews/:review_id/report', (req, res) => {
  console.log(req.params);
  db.reportReview(req.params.review_id)
    .then(() => {
      res.status(204).send();
    })
    .catch((err) => res.status(500).send(err.body));
});

module.exports = app;
