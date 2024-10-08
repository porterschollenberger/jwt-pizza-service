const request = require('supertest');
const app = require('../service');
const {DB} = require("../database/database");

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let testUserId;

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUserId = registerRes.body.user.id;
});

afterAll(async () => {
    if (testUserId !== undefined) {
        try {
            await DB.deleteUser(testUserId);
        } catch (error) {
            console.error('Error in afterAll cleanup:', error);
        }
    }
});

// test('login', async () => {
//     const loginRes = await request(app).put('/api/auth').send(testUser);
//     expect(loginRes.status).toBe(200);
//     expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
//
//     const { ...user } = { ...testUser, roles: [{ role: 'diner' }] };
//     expect(loginRes.body.user).toMatchObject(user);
// });

test('login with invalid credentials', async () => {
    const response = await request(app)
        .put('/api/auth')
        .send({ email: testUser.email, password: 'wrongpassword' });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('unknown user');
});

test('update user', async () => {
    const updatedEmail = Math.random().toString(36).substring(2, 12) + '@test.com';
    const updateRes = await request(app)
        .put(`/api/auth/${testUserId}`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send({ email: updatedEmail, password: 'newpassword' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.email).toBe(updatedEmail);
});

test('logout', async () => {
    const logoutRes = await request(app)
    .delete(`/api/auth/`)
    .set('Authorization', `Bearer ${testUserAuthToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('logout successful');
})

test('unauthorized access', async () => {
    const unauthorizedRes = await request(app)
        .put(`/api/auth/${testUserId}`)
        .send({ email: 'newemail@test.com', password: 'newpassword' });

    expect(unauthorizedRes.status).toBe(401);
    expect(unauthorizedRes.body.message).toBe('unauthorized');
})

test('register with missing fields', async () => {
    const incompleteUser = { name: 'Incomplete User' };
    const registerRes = await request(app).post('/api/auth').send(incompleteUser);

    expect(registerRes.status).toBe(400);
    expect(registerRes.body.message).toBe('name, email, and password are required');
});