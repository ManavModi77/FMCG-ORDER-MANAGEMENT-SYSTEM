import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL 
                ? `${process.env.REACT_APP_API_URL}/api` 
                : 'http://localhost:8080/api';

const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const serverMessage = error.response?.data?.error || error.response?.data?.message;
        if (serverMessage) error.message = serverMessage;
        return Promise.reject(error);
    }
);

// ==========================================
// AUTHENTICATION
// ==========================================
export const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
};

export const registerShopOwner = async (shopData) => {
    await apiClient.post('/auth/register', {
        name: shopData.name,
        email: shopData.email,
        password: shopData.password,
        role: shopData.role || 'SHOP_OWNER',
        distributorId: shopData.distributorId || null
    });
    if (!shopData.role || shopData.role === 'SHOP_OWNER') {
        return login(shopData.email, shopData.password);
    }
};

// ==========================================
// PRODUCTS
// ==========================================

export const getProducts = async (category = null, search = null, distributorId = null) => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search && search.trim() !== '')  params.append('search', search.trim());
    if (distributorId)                   params.append('distributorId', distributorId);
    const query = params.toString();
    const response = await apiClient.get(query ? `/products?${query}` : '/products');
    return response.data;
};


export const getDistributorInventory = async (distributorId) => {
    const response = await apiClient.get(`/products/inventory/${distributorId}`);
    return response.data;
};

export const getAllProducts = async () => {
    const response = await apiClient.get('/products');
    return response.data;
};

// ==========================================
// USERS (Shops & Distributors)
// ==========================================
export const getDistributors = async () => {
    const response = await apiClient.get('/users/distributors');
    return response.data;
};

export const getShopsByDistributor = async (distributorId) => {
    const response = await apiClient.get(`/users/shops/${distributorId}`);
    return response.data;
};

// ==========================================
// ORDERS
// ==========================================
export const placeOrder = async (orderData) => {
    const formattedItems = orderData.items.map(item => ({
        product: { id: item.id },
        count: item.quantity,
        subtotal: item.price * item.quantity,
        quantityType: item.quantityType,
        label: item.label
    }));

    const payload = {
        shopId: parseInt(orderData.shopId, 10),
        distributorId: parseInt(orderData.distributorId, 10),
        total: parseFloat(orderData.totalAmount),
        transactionId: orderData.transactionId,
        items: formattedItems
    };

    const response = await apiClient.post('/orders', payload);
    return response.data;
};

export const getOrdersByShop = async (shopId) => {
    const response = await apiClient.get(`/orders/shop/${shopId}`);
    return response.data;
};

export const getOrdersByDistributor = async (distributorId, status = null) => {
    const url = status
        ? `/orders/distributor/${distributorId}?status=${status}`
        : `/orders/distributor/${distributorId}`;
    const response = await apiClient.get(url);
    return response.data;
};

export const confirmOrder = async (orderId) => {
    const response = await apiClient.put(`/orders/${orderId}/confirm`);
    return response.data;
};

export const cancelOrder = async (orderId) => {
    const response = await apiClient.put(`/orders/${orderId}/cancel`);
    return response.data;
};


export const updateProductStock = async (productId, stock, distributorId) => {
    const response = await apiClient.put(
        `/products/${productId}/stock?distributorId=${distributorId}`,
        { stock }
    );
    return response.data;
};
