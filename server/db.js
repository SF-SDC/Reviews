const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER,
  host: 'localhost',
  database: 'sdc',
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
/*
challenges so far,  timestamp, ANY, running subquery on multiple rows to get the photos for the individual rows
I got caught trying to find photos for the products not the reviews
fixed, then caught on finding photos for products with multiple reviews
then caught on appeneding the right photos to each review

challenge: how to count different values in the same column
use count + aliases

if it works its going to be way easier to just
pull the data from queries and format on the server

versus this monstrosity of a sql statement
*/
const getReviews = (productId) => pool.query(`SELECT id AS review_id, reviews.rating, reviews.summary, reviews.recommend, reviews.response,reviews.body,TO_CHAR((TO_TIMESTAMP(reviews.date::double precision / 1000)), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS date,reviews.reviewer_name,reviews.helpfulness,
(SELECT ARRAY (SELECT to_json(X) FROM (SELECT id,url FROM reviews_photos WHERE reviews_photos.review_id =ANY(SELECT reviews_photos.review_id FROM reviews_photos WHERE reviews_photos.review_id = reviews.id)) AS X) AS photos)
FROM reviews WHERE product_id = ${productId}`);

const getMetaData = (productId) => {
  // get objects here and then add them with keys...
  // body data
  const promises = [];
  // query for just ratings
  promises.push(pool.query(`SELECT json_object_agg(t.rating,t.count) AS ratings
  FROM (
  SELECT rating, COUNT(*) as count
  FROM reviews
  WHERE reviews.product_id = ${productId}
  GROUP BY rating) AS t
  `));
  // query for just recommended
  promises.push(pool.query(''));
  // query for characteristics
  promises.push(pool.query(''));

  return Promise.all(promises);
};
const addAReview = () => {

};

const markHelpful = () => pool.query('');

const reportReview = () => pool.query('');

module.exports.getReviews = getReviews;
module.exports.getMetaData = getMetaData;