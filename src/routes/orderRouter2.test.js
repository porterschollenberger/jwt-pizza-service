const request = require('supertest');
const app = require('../service');
const {DB} = require("../database/database");

const testUser = { name: 'pizza diner', email: 'order@test.com', password: 'testpass' };
let testUserAuthToken;
let testUserId;

beforeAll(async () => {

    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUserId = registerRes.body.user.id;

    const testMenuItems = [
        { title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { title: 'Pepperoni', image: 'pizza2.png', price: 0.0045, description: 'A classic favorite' },
        { title: 'Cheese', image: 'pizza3.png', price: 0.0035, description: 'Cheesy goodness' }
    ];

    for (const item of testMenuItems) {
        await DB.addMenuItem(item);
    }
});

afterAll(async () => {
    if (testUserId !== undefined) {
        try {
            await DB.deleteUser(testUserId);
        } catch (error) {
            console.error('Error in afterAll cleanup:', error);
        }
    }
    // Clean up test menu items???
});

test('get menu', async () => {
    const menuRes = await request(app).get('/api/order/menu');

    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toBeDefined();
    expect(Array.isArray(menuRes.body)).toBe(true);
    expect(menuRes.body.length).toBeGreaterThan(0);

    expect(menuRes.body[0]).toHaveProperty('id');
    expect(menuRes.body[0]).toHaveProperty('title');
    expect(menuRes.body[0]).toHaveProperty('image');
    expect(menuRes.body[0]).toHaveProperty('price');
    expect(menuRes.body[0]).toHaveProperty('description');

    expect(menuRes.body).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                title: 'Veggie',
                image: 'pizza1.png',
                price: 0.0038,
                description: 'A garden of delight'
            })
        ])
    );
});

test('add menu item (unauthorized)', async () => {
    const newMenuItem = {
        title: 'Test Pizza',
        description: 'A test pizza',
        image: 'test.png',
        price: 0.0005
    };
    const addItemRes = await request(app)
        .put('/api/order/menu')
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send(newMenuItem);

    expect(addItemRes.status).toBe(403);
    expect(addItemRes.body.message).toBe('unable to add menu item');
});

test('get orders', async () => {
    const ordersRes = await request(app)
        .get('/api/order')
        .set('Authorization', `Bearer ${testUserAuthToken}`);

    expect(ordersRes.status).toBe(200);
    expect(ordersRes.body).toHaveProperty('dinerId');
    expect(ordersRes.body).toHaveProperty('orders');
    expect(ordersRes.body).toHaveProperty('page');
});

test('create order', async () => {
    const newOrder = {
        franchiseId: 1,
        storeId: 1,
        items: [{ menuId: 1, description: 'Test Pizza', price: 0.05 }]
    };

    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ jwt: 'test-jwt', reportUrl: 'http://test.com/report' }),
        })
    );

    const createOrderRes = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send(newOrder);

    expect(createOrderRes.status).toBe(200);
    expect(createOrderRes.body).toHaveProperty('order');
    expect(createOrderRes.body).toHaveProperty('jwt');
    expect(createOrderRes.body).toHaveProperty('reportUrl');
    expect(createOrderRes.body.order.franchiseId).toBe(newOrder.franchiseId);
    expect(createOrderRes.body.order.storeId).toBe(newOrder.storeId);
    expect(createOrderRes.body.order.items).toEqual(newOrder.items);

    global.fetch.mockClear();
    delete global.fetch;
});

test('create order with factory error', async () => {
    const newOrder = {
        franchiseId: 1,
        storeId: 1,
        items: [{ menuId: 1, description: 'Test Pizza', price: 0.05 }]
    };

    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ reportUrl: 'http://test.com/error-report' }),
        })
    );

    const createOrderRes = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send(newOrder);

    expect(createOrderRes.status).toBe(500);
    expect(createOrderRes.body.message).toBe('Failed to fulfill order at factory');
    expect(createOrderRes.body.reportUrl).toBe('http://test.com/error-report');

    global.fetch.mockClear();
    delete global.fetch;
});
