import axios from "axios";
const API_URL = "http://localhost:5001";
export const getProductDetails = async (productId) => {
    try {
        const response = await axios.get(`${API_URL}/getProductDetails`, {
            params: { productId },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching product details:", error);
        return { error: "Failed to fetch product details" };
    }
};
export const checkProductOwnership = async (productId, gmail, name) => {
    try {
        const response = await axios.post(`${API_URL}/checkProduct`, { productId, gmail, name });
        return response.data;
    } catch (error) {
        console.error("Error checking product ownership:", error);
        return { error: "Failed to check product ownership" };
    }
};
export const addConflictProduct = async (productId, gmail1, gmail2) => {
    try {
        const response = await axios.post(`${API_URL}/addConflictProduct`, { productId, gmail1, gmail2 });
        return response.data;
    } catch (error) {
        console.error("Error adding conflict product:", error);
        return { error: "Failed to add conflict product" };
    }
};