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
      const characteristicsObject = {};
      // return a characteristics object with proper keu names
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

      const response = {
        product_id: productId,
        ratings: data[0].rows[0].ratings || {},
        recommended: {
          0: data[1].rows[0].recommended.true,
          1: data[1].rows[0].recommended.false,
        } || {},
        characteristics: characteristicsObject || {},
      };
      res.status(200).send(response);
    })
    .catch((err) => res.status(500).send(err.body));
});

app.post('/reviews', (req, res) => {
  db.addAReview(req.body)
    // .then(() => {
    //   res.status(201).send();
    // })
    // .catch((err) => res.status(500).send(err.body));


    //challenge converting id column into auto-incrementing sequence
    /*
----create sequence reviews_id_seq START WITH MAX(reviews.id)
----   owned by reviews.id;
----SELECT SETVAL('reviews_id_seq', (select max(id) from reviews), false)
-   -ALTER TABLE reviews ALTER COLUMN id SET DEFAULT nextval('reviews_id_seq');

    */
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

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
