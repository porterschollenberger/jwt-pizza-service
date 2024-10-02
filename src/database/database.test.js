const { DB } = require('../database/database');

describe('Database Operations', () => {
    let testUserId;
    let testFranchiseId;
    // let testStoreId;
    // let testMenuItemId;

    beforeAll(async () => {
        await DB.initialized;
    });

    afterAll(async () => {

        if (testUserId) await DB.deleteUser(testUserId);
        if (testFranchiseId) await DB.deleteFranchise(testFranchiseId);
    });

    // test('addUser and getUser', async () => {
    //     const testUser = {
    //         name: 'Test User',
    //         email: `test${Math.random().toString(36).substring(7)}@example.com`,
    //         password: 'testpassword',
    //         roles: [{ role: Role.Diner }]
    //     };
    //
    //     const addedUser = await DB.addUser(testUser);
    //     expect(addedUser).toHaveProperty('id');
    //     expect(addedUser.name).toBe(testUser.name);
    //     expect(addedUser.email).toBe(testUser.email);
    //
    //     testUserId = addedUser.id;
    //
    //     const retrievedUser = await DB.getUser(testUser.email, testUser.password);
    //     expect(retrievedUser.id).toBe(addedUser.id);
    //     expect(retrievedUser.name).toBe(testUser.name);
    //     expect(retrievedUser.email).toBe(testUser.email);
    //     expect(retrievedUser).not.toHaveProperty('password');
    // });

    // test('updateUser', async () => {
    //     const updatedEmail = `updated${Math.random().toString(36).substring(7)}@example.com`;
    //     const updatedUser = await DB.updateUser(testUserId, updatedEmail, 'newpassword');
    //     expect(updatedUser.email).toBe(updatedEmail);
    // });

    // test('loginUser and isLoggedIn', async () => {
    //     const token = 'testtoken.signature';
    //     await DB.loginUser(testUserId, token);
    //     const isLoggedIn = await DB.isLoggedIn(token);
    //     expect(isLoggedIn).toBe(true);
    // });

    test('logoutUser', async () => {
        const token = 'testtoken.signature';
        await DB.logoutUser(token);
        const isLoggedIn = await DB.isLoggedIn(token);
        expect(isLoggedIn).toBe(false);
    });

    test('getMenu and addMenuItem', async () => {
        const initialMenu = await DB.getMenu();
        const newMenuItem = {
            title: 'Test Pizza',
            description: 'A test pizza',
            image: 'test.png',
            price: 10.99
        };
        const addedMenuItem = await DB.addMenuItem(newMenuItem);
        expect(addedMenuItem).toHaveProperty('id');
        expect(addedMenuItem.title).toBe(newMenuItem.title);

        // testMenuItemId = addedMenuItem.id;

        const updatedMenu = await DB.getMenu();
        expect(updatedMenu.length).toBe(initialMenu.length + 1);
    });

    // test('createFranchise and getFranchises', async () => {
    //     const franchise = {
    //         name: 'Test Franchise',
    //         admins: [{ email: `admin${Math.random().toString(36).substring(7)}@example.com` }]
    //     };
    //
    //     await DB.addUser({...franchise.admins[0], name: 'Admin', password: 'adminpass', roles: [{ role: Role.Franchisee }]});
    //
    //     const createdFranchise = await DB.createFranchise(franchise);
    //     expect(createdFranchise).toHaveProperty('id');
    //     expect(createdFranchise.name).toBe(franchise.name);
    //
    //     testFranchiseId = createdFranchise.id;
    //
    //     const franchises = await DB.getFranchises({ isRole: () => true });
    //     expect(franchises.some(f => f.id === testFranchiseId)).toBe(true);
    // });

    // test('createStore and deleteStore', async () => {
    //     const store = { name: 'Test Store' };
    //     const createdStore = await DB.createStore(testFranchiseId, store);
    //     expect(createdStore).toHaveProperty('id');
    //     expect(createdStore.name).toBe(store.name);
    //
    //     testStoreId = createdStore.id;
    //
    //     await DB.deleteStore(testFranchiseId, testStoreId);
    //     const franchise = await DB.getFranchise({ id: testFranchiseId });
    //     expect(franchise.stores.some(s => s.id === testStoreId)).toBe(false);
    // });

    // test('addDinerOrder and getOrders', async () => {
    //     const order = {
    //         franchiseId: testFranchiseId,
    //         storeId: testStoreId,
    //         items: [{ menuId: testMenuItemId, description: 'Test Pizza', price: 10.99 }]
    //     };
    //     const createdOrder = await DB.addDinerOrder({ id: testUserId }, order);
    //     expect(createdOrder).toHaveProperty('id');
    //
    //     const userOrders = await DB.getOrders({ id: testUserId });
    //     expect(userOrders.orders.some(o => o.id === createdOrder.id)).toBe(true);
    // });
});
