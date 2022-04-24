/* eslint-disable camelcase */
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER,
  host: 'localhost',
  database: 'sdc',
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
const getReviews = (productId, min, max, sort = 'id') => {
  let order = sort;
  if (sort === 'helpful') {
    order = 'helpfulness';
  } else if (sort === 'newest') {
    order = 'date';
  } else if (sort === 'relevant') {
    order = 'recommend';
  } else {
    order = 'id';
  }
  return pool.query(`SELECT
  id AS review_id,
  reviews.rating,
  reviews.summary,
  reviews.recommend,
  reviews.response,
  reviews.body,
  TO_CHAR((TO_TIMESTAMP(1589663264078::double precision / 1000)), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS date,
  reviews.reviewer_name,
  reviews.helpfulness,
  (
     SELECT
        ARRAY (
        SELECT
           to_json(X)
        FROM
           (
              SELECT
                 id,
                 url
              FROM
                 reviews_photos
              WHERE
                 reviews_photos.review_id = ANY(
                 SELECT
                    reviews_photos.review_id
                 FROM
                    reviews_photos
                 WHERE
                    reviews_photos.review_id = reviews.id)
           )
           AS X) AS photos
  )
FROM
  reviews
WHERE
  product_id = ${productId}
  AND reported = false
  ORDER BY ${order} DESC`)
    .then((data) => {
      data.rows.map((item) => {
        if (item.response === 'null') {
          // eslint-disable-next-line no-param-reassign
          item.response = '';
          return item;
        }
        return item;
      });
      return data;
    });
};

const getMetaData = (productId) => {
  const promises = [];
  promises.push(pool.query(`SELECT json_object_agg(t.rating,t.count) AS ratings
  FROM (
  SELECT rating, COUNT(*) as count
  FROM reviews
  WHERE reviews.product_id = ${productId}
  GROUP BY rating) AS t
  `));

  promises.push(pool.query(`SELECT json_object_agg(t.recommend,t.recommend_count) AS recommended
  FROM(
  SELECT recommend, count(recommend) AS recommend_count
  FROM reviews
  WHERE product_id = 15
  GROUP BY recommend
  ORDER BY recommend DESC
  ) t`));

  promises.push(pool.query(`SELECT json_object_agg(t.characteristic_id,t.avg) AS weightedCharacteristics
  FROM(
  SELECT characteristic_id, AVG(value)
  FROM characteristic_reviews
  WHERE review_id = ANY(SELECT id AS reviews_id FROM reviews WHERE product_id = ${productId})
  GROUP BY characteristic_id
  ORDER BY characteristic_id DESC
  ) t`));

  promises.push(pool.query(`SELECT * FROM characteristics where product_id = ${productId} ORDER BY name DESC`));

  return Promise.all(promises);
};
const addAReview = (newReview) => {
  const {
    product_id, rating, date, summary, body, recommend, name, email, photos, characteristics,
  } = newReview;

  return pool.query(`INSERT INTO reviews ("product_id", "rating", "date", "summary", "body", "recommend", "reported", "reviewer_name", "reviewer_email", "response", "helpfulness") VALUES('${product_id}', '${rating}', '${date}', '${summary}', '${body}', '${recommend}', 'false', '${name}', '${email}', 'null', '0') `)
    .then(() => {
      pool.query('SELECT max(id) FROM reviews')
        .then((data) => {
          const reviewId = data.rows[0].max;
          const promises = [];
          photos.forEach((photo) => {
            promises.push(pool.query(`INSERT INTO reviews_photos ("review_id", "url") VALUES('${reviewId}', '${photo}' )`));
          });
          const getIds = Object.entries(characteristics);
          getIds.forEach((characteristic) => promises.push(pool.query(`SELECT * FROM characteristics WHERE product_id = '${product_id}' AND id = '${characteristic[0]}'`)
            .then((chars) => pool.query(`INSERT INTO characteristic_reviews("characteristic_id", "review_id", "value") VALUES('${chars.rows[0].id}', '${reviewId}', '${characteristic[1]}')`))));

          Promise.all(promises);
        });
    });
};

const markHelpful = (reviewId) => pool.query(`UPDATE reviews
SET helpfulness = helpfulness + 1
WHERE id = ${reviewId}`);

const reportReview = (reviewId) => pool.query(`UPDATE reviews
SET reported = TRUE
WHERE id = ${reviewId}`);

module.exports.getReviews = getReviews;
module.exports.getMetaData = getMetaData;
module.exports.addAReview = addAReview;
module.exports.markHelpful = markHelpful;
module.exports.reportReview = reportReview;
