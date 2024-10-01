const request = require('supertest');
const app = require('../service');
const { DB } = require('../database/database')
const {Role} = require("../model/model");

jest.mock('../database/database');

let testUserAuthToken;
let adminUserAuthToken;

beforeAll(async () => {
    const testUser = {
        id: 1,
        name: 'Test Diner',
        email: 'testdiner@test.com',
        roles: [{ role: Role.Diner }],
        isRole: (role) => role === Role.Diner
    };

    const adminUser = {
        id: 2,
        name: 'Admin User',
        email: 'admin@test.com',
        roles: [{ role: Role.Admin }],
        isRole: (role) => role === Role.Admin
    };

    testUserAuthToken = 'test-user-token';
    adminUserAuthToken = 'admin-user-token';

    DB.getUser.mockImplementation((email) => {
        if (email === adminUser.email) return adminUser;
        if (email === testUser.email) return testUser;
        return null;
    });
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