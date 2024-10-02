const request = require('supertest');
const app = require('../service');
const {DB} = require("../database/database");

const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'adminpassword',
    token: null
};

const testUser = { name: 'franchise tester', email: 'franchise@test.com', password: 'testpass' };
let testUserAuthToken;
let testUserId;
let testFranchiseId;
let testStoreId;

beforeAll(async () => {
    await request(app).post('/api/auth').send(adminUser);
    const adminLoginRes = await request(app).put('/api/auth').send({
        email: adminUser.email,
        password: adminUser.password
    });
    adminUser.token = adminLoginRes.body.token;

    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerUserRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerUserRes.body.token;
    testUserId = registerUserRes.body.user.id;

    const createFranchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ name: 'Test Franchise', admins: [{ email: testUser.email }] });
    testFranchiseId = createFranchiseRes.body.id;

    const createStoreRes = await request(app)
        .post(`/api/franchise/${testFranchiseId}/store`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send({ name: 'Test Store' });
    testStoreId = createStoreRes.body.id;
});

afterAll(async () => {
    await DB.deleteUser(testUserId);
    // Do not delete the admin user as it's meant to be persistent
    // await DB.deleteFranchise(testFranchiseId);
});

test('get franchises', async () => {
    const franchisesRes = await request(app).get('/api/franchise');

    expect(franchisesRes.status).toBe(200);
    expect(Array.isArray(franchisesRes.body)).toBe(true);
});

test('get user franchises', async () => {
    const userFranchisesRes = await request(app)
        .get(`/api/franchise/${testUserId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`);

    expect(userFranchisesRes.status).toBe(200);
    expect(Array.isArray(userFranchisesRes.body)).toBe(true);
});

test('delete store (as non-admin, non-franchise owner)', async () => {
    const nonAdminUser = {
        name: 'Non-Admin User',
        email: Math.random().toString(36).substring(2, 12) + '@test.com',
        password: 'password123'
    };
    const registerNonAdminRes = await request(app).post('/api/auth').send(nonAdminUser);
    const nonAdminAuthToken = registerNonAdminRes.body.token;

    const deleteStoreRes = await request(app)
        .delete(`/api/franchise/${testFranchiseId}/store/${testStoreId}`)
        .set('Authorization', `Bearer ${nonAdminAuthToken}`);

    expect(deleteStoreRes.status).toBe(403);
    expect(deleteStoreRes.body.message).toBe('unable to delete a store');

    await DB.deleteUser(registerNonAdminRes.body.user.id);
});

test('create franchise (as non-admin)', async () => {
    const newFranchise = {
        name: 'Unauthorized Franchise',
        admins: [{ email: testUser.email }]
    };

    const createFranchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send(newFranchise);

    expect(createFranchiseRes.status).toBe(403);
});

test('delete franchise (as non-admin)', async () => {
    const deleteFranchiseRes = await request(app)
        .delete(`/api/franchise/${testFranchiseId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`);

    expect(deleteFranchiseRes.status).toBe(403);
    expect(deleteFranchiseRes.body.message).toBe('unable to delete a franchise');
});