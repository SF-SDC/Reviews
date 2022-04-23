/* eslint-disable no-prototype-builtins */
/* eslint-disable no-undef */

require('jest');

const request = require('supertest');
const server = require('../app');

const productId = '1000011';

const mockReview = {
  product_id: '12',
  date: '1606286549844',
  rating: '4',
  summary: 'testing',
  body: 'testing',
  recommend: 'true',
  name: 'tester',
  email: 'tester@gmail',
  photos: ['url1', 'url2', 'url3'],
  characteristics: {
    Fit: '4', Length: '4', Comfort: '4', Quality: '4',
  },
};

describe('Product API test suite', () => {
  it('should reject an invalid route', async () => {
    const response = await request(server).get('/');
    expect(response.statusCode).toBe(404);
  });
  it('should reject an invalid verb', async () => {
    const response = await request(server).post('/reviews/meta');
    expect(response.statusCode).toBe(404);
  });
  it('should return server error if no product is given', async () => {
    const response = await request(server).get('/reviews');
    expect(response.statusCode).toBe(500);
  });
  it('should return reviews in the expected format', async () => {
    const response = await request(server).get(`/reviews?product_id=${productId}`);
    expect(response.body.hasOwnProperty('product_id')).toBe(true);
    expect(response.body.hasOwnProperty('results')).toBe(true);
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(typeof response.body.results[0]).toBe('object');
    expect(Array.isArray(response.body.results[0])).toBe(false);
    expect(response.body.results[0].hasOwnProperty('review_id')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('rating')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('summary')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('recommend')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('response')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('body')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('date')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('reviewer_name')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('helpfulness')).toBe(true);
    expect(response.body.results[0].hasOwnProperty('photos')).toBe(true);
    expect(Array.isArray(response.body.results[0].photos)).toBe(true);
    expect(response.statusCode).toBe(200);
  });
  it('should return the correct reviews given page and count values', async () => {
    const response = await request(server).get('/reviews/?page=2&product_id=1000011&count=5');
    expect(response.statusCode).toBe(200);
    expect(response.body.results.length).toBe(5);
    expect(response.body.results[0].review_id).toBe(5774946);
    expect(response.body.results[4].review_id).toBe(5774942);
  });
  it('should sort by given sort or default to ID for all else', async () => {
    const responseSortByNewest = await request(server).get('/reviews/?product_id=1000011&sort=newest');
    const responseSortByHelpful = await request(server).get('/reviews/?product_id=1000011&sort=helpful');
    const responseSortByRelevant = await request(server).get('/reviews/?product_id=1000011&sort=relevant');
    const defaultResponse = await request(server).get(`/reviews/?product_id=${productId}&sort=badSort`);

    expect(responseSortByNewest.body.results[0].date).toBe('2021-04-23T04:01:55.787Z');
    expect(responseSortByNewest.body.results[4].date).toBe('2021-02-03T14:51:48.887Z');
    expect(responseSortByNewest.statusCode).toBe(200);

    expect(responseSortByHelpful.body.results[0].helpfulness).toBe(28);
    expect(responseSortByHelpful.body.results[4].helpfulness).toBe(18);
    expect(responseSortByHelpful.statusCode).toBe(200);

    expect(responseSortByRelevant.body.results[0].recommend).toBe(true);
    expect(responseSortByRelevant.statusCode).toBe(200);

    expect(defaultResponse.statusCode).toBe(200);
  });
  it('should return the correct fields for /reviews/meta', async () => {
    const response = await request(server).get(`/reviews/meta?product_id=${productId}`);
    const validCharacteristicsResponse = await request(server).get('/reviews/meta?product_id= 1000011');
    const validRatingResponse = await request(server).get('/reviews/meta?product_id= 1000011');
    const validRecommendedResponse = await request(server).get('/reviews/meta?product_id= 1000011');

    expect(response.statusCode).toBe(200);
    expect(typeof response.body).toBe('object');
    expect(Array.isArray(response.body)).toBe(false);
    expect(response.body.hasOwnProperty('product_id')).toBe(true);

    expect(response.body.hasOwnProperty('ratings')).toBe(true);
    expect(typeof response.body.ratings).toBe('object');
    expect(Array.isArray(response.body.ratings)).toBe(false);
    expect(validRatingResponse.body.ratings.hasOwnProperty('1'));
    expect(validRatingResponse.body.ratings.hasOwnProperty('2'));
    expect(validRatingResponse.body.ratings.hasOwnProperty('3'));
    expect(validRatingResponse.body.ratings.hasOwnProperty('4'));
    expect(validRatingResponse.body.ratings.hasOwnProperty('5'));

    expect(response.body.hasOwnProperty('recommended')).toBe(true);
    expect(typeof response.body.recommended).toBe('object');
    expect(Array.isArray(response.body.recommended)).toBe(false);
    expect(validRecommendedResponse.body.ratings.hasOwnProperty('0'));
    expect(validRecommendedResponse.body.ratings.hasOwnProperty('1'));

    expect(response.body.hasOwnProperty('characteristics')).toBe(true);
    expect(typeof response.body.characteristics).toBe('object');
    expect(Array.isArray(response.body.characteristics)).toBe(false);
    expect(validCharacteristicsResponse.body.characteristics.hasOwnProperty('Size'));
    expect(validCharacteristicsResponse.body.characteristics.Size.hasOwnProperty('id'));
    expect(validCharacteristicsResponse.body.characteristics.Size.hasOwnProperty('value'));
    expect(validCharacteristicsResponse.body.characteristics.hasOwnProperty('Width'));
    expect(validCharacteristicsResponse.body.characteristics.hasOwnProperty('Comfort'));
    expect(validCharacteristicsResponse.body.characteristics.hasOwnProperty('Quality'));
  });
  it('should reject bad POST /reviews', async () => {
    const response = await request(server)
      .post('/reviews');
    expect(response.statusCode).toBe(500);
  });
  it('should reject bad PUT /reviews/:review_id/helpful', async () => {
    const response = await request(server)
      .put('/reviews/helpful');
    const badIdResponse = await request(server)
      .put('/reviews/qw/helpful');
    expect(response.statusCode).toBe(404);
    expect(badIdResponse.statusCode).toBe(500);
  });
  it('should reject bad PUT /reviews/:review_id/report', async () => {
    const response = await request(server)
      .put('/reviews/:review_id/report');
    const badIdResponse = await request(server)
      .put('/reviews/qw/report');
    expect(response.statusCode).toBe(500);
    expect(badIdResponse.statusCode).toBe(500);
  });
});
