const request = require('supertest');
const app = require('../service');
const {DB} = require("../database/database");

const testUser = { name: 'franchise tester', email: 'franchise@test.com', password: 'testpass' };
const testAdmin = { name: 'admin tester', email: 'admin@test.com', password: 'adminpass', roles: [{ role: 'admin' }] };
let testUserAuthToken;
let testAdminAuthToken;
let testUserId;
let testAdminId;
let testFranchiseId;
let testStoreId;

beforeAll(async () => {
    // Create test user
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerUserRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerUserRes.body.token;
    testUserId = registerUserRes.body.user.id;

    // Create admin user
    testAdmin.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerAdminRes = await request(app).post('/api/auth').send(testAdmin);
    testAdminAuthToken = registerAdminRes.body.token;
    testAdminId = registerAdminRes.body.user.id;

    // Create a test franchise
    const createFranchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${testAdminAuthToken}`)
        .send({ name: 'Test Franchise', admins: [{ email: testUser.email }] });
    testFranchiseId = createFranchiseRes.body.id;

    // Create a test store
    const createStoreRes = await request(app)
        .post(`/api/franchise/${testFranchiseId}/store`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send({ name: 'Test Store' });
    testStoreId = createStoreRes.body.id;
});

afterAll(async () => {
    // Clean up
    await DB.deleteUser(testUserId);
    await DB.deleteUser(testAdminId);
    await DB.deleteFranchise(testFranchiseId);
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

// test('create franchise (as admin)', async () => {
//     const newFranchise = {
//         name: 'New Test Franchise',
//         admins: [{ email: testUser.email }]
//     };
//
//     const createFranchiseRes = await request(app)
//         .post('/api/franchise')
//         .set('Authorization', `Bearer ${testAdminAuthToken}`)
//         .send(newFranchise);
//
//     expect(createFranchiseRes.status).toBe(200);
//     expect(createFranchiseRes.body).toHaveProperty('id');
//     expect(createFranchiseRes.body.name).toBe(newFranchise.name);
//     expect(createFranchiseRes.body.admins[0].email).toBe(newFranchise.admins[0].email);
//
//     // Clean up
//     await DB.deleteFranchise(createFranchiseRes.body.id);
// });

// test('delete franchise (as admin)', async () => {
//     // First, create a franchise to delete
//     const franchiseToDelete = await request(app)
//         .post('/api/franchise')
//         .set('Authorization', `Bearer ${testAdminAuthToken}`)
//         .send({ name: 'Franchise to Delete', admins: [{ email: testAdmin.email }] });
//
//     const deleteFranchiseRes = await request(app)
//         .delete(`/api/franchise/${franchiseToDelete.body.id}`)
//         .set('Authorization', `Bearer ${testAdminAuthToken}`);
//
//     expect(deleteFranchiseRes.status).toBe(200);
//     expect(deleteFranchiseRes.body.message).toBe('franchise deleted');
// });

// test('create store', async () => {
//     const newStore = {
//         name: 'New Test Store'
//     };
//
//     const createStoreRes = await request(app)
//         .post(`/api/franchise/${testFranchiseId}/store`)
//         .set('Authorization', `Bearer ${testUserAuthToken}`)
//         .send(newStore);
//
//     expect(createStoreRes.status).toBe(200);
//     expect(createStoreRes.body).toHaveProperty('id');
//     expect(createStoreRes.body.name).toBe(newStore.name);
//     expect(createStoreRes.body.franchiseId).toBe(testFranchiseId);
//
//     // Clean up
//     await DB.deleteStore(testFranchiseId, createStoreRes.body.id);
// });

// test('delete store', async () => {
//     const deleteStoreRes = await request(app)
//         .delete(`/api/franchise/${testFranchiseId}/store/${testStoreId}`)
//         .set('Authorization', `Bearer ${testUserAuthToken}`);
//
//     expect(deleteStoreRes.status).toBe(200);
//     expect(deleteStoreRes.body.message).toBe('store deleted');
// });

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
    expect(createFranchiseRes.body.message).toBe('unable to create a franchise');
});

test('delete franchise (as non-admin)', async () => {
    const deleteFranchiseRes = await request(app)
        .delete(`/api/franchise/${testFranchiseId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`);

    expect(deleteFranchiseRes.status).toBe(403);
    expect(deleteFranchiseRes.body.message).toBe('unable to delete a franchise');
});
