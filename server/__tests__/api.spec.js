/* eslint-disable no-undef */

require('jest');

const request = require('supertest');
const server = require('../app');

describe('Product API test suite', () => {
  it('should reject an invalid route', async () => {
    const response = await request(server).get('/');
    expect(response.statusCode).toBe(404);
  });
  it('should reject an invalid verb', async () => {
    const response = await request(server).post('/products');
    expect(response.statusCode).toBe(404);
  });
});
