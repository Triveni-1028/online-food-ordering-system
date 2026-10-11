const request=require('supertest'),app=require('../server');
test('health',async()=>expect((await request(app).get('/health')).statusCode).toBe(200));
test('orders list',async()=>expect(Array.isArray((await request(app).get('/orders')).body)).toBe(true));
