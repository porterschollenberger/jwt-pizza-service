const request = require('supertest');
const app = require('../service');
const { DB } = require('../database/database');

let testUserAuthToken;
let adminUserAuthToken;
let testUserId;
let adminUserId;

beforeAll(async () => {
    const testUser = {
        name: 'Test Diner',
        email: Math.random().toString(36).substring(2, 12) + '@test.com',
        password: 'testpassword'
    };
    const registerTestUserRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerTestUserRes.body.token;
    testUserId = registerTestUserRes.body.user.id;

    const adminUser = {
        name: 'Admin User',
        email: Math.random().toString(36).substring(2, 12) + '@admin.com',
        password: 'adminpassword'
    };
    const registerAdminUserRes = await request(app).post('/api/auth').send(adminUser);
    adminUserAuthToken = registerAdminUserRes.body.token;
    adminUserId = registerAdminUserRes.body.user.id;
});

afterAll(async () => {
    if (testUserId !== undefined) {
        try {
            await DB.deleteUser(testUserId);
            await DB.deleteUser(adminUserId);
        } catch (error) {
            console.error('Error in afterAll cleanup:', error);
        }
    }
});

test('get menu', async () => {
    const mockMenu = [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' }
    ];
    DB.getMenu.mockResolvedValue(mockMenu);

    const response = await request(app).get('/api/order/menu');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockMenu);
});

test('add menu item as non-admin', async () => {
    const newMenuItem = { title: 'Student', description: 'No topping, no sauce, just carbs', image: 'pizza9.png', price: 0.0001 };

    const response = await request(app)
        .put('/api/order/menu')
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send(newMenuItem);

    expect(response.status).toBe(403);
});

test('add menu item as admin', async () => {
    const newMenuItem = { title: 'Student', description: 'No topping, no sauce, just carbs', image: 'pizza9.png', price: 0.0001 };

    const response = await request(app)
        .put('/api/order/menu')
        .set('Authorization', `Bearer ${adminUserAuthToken}`)
        .send(newMenuItem);

    // expect(response.status).toBe(200);
    expect(response.body).toEqual([newMenuItem]);
});
