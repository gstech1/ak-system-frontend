"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWarranty = checkWarranty;
exports.getWarrantyPolicies = getWarrantyPolicies;
exports.getProducts = getProducts;
exports.getProduct = getProduct;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5001";
/* ======================================================
   AUTH
   ====================================================== */
function getAccessToken() {
    if (typeof window === "undefined") {
        return null;
    }
    return localStorage.getItem("accessToken");
}
function getAuthHeaders() {
    const token = getAccessToken();
    if (!token) {
        return {};
    }
    return {
        Authorization: `Bearer ${token}`,
    };
}
async function checkWarranty(serialNumber) {
    const normalizedSerialNumber = serialNumber
        .trim()
        .replace(/\s+/g, "");
    const response = await fetch(`${API_BASE_URL}/warranty/check/${encodeURIComponent(normalizedSerialNumber)}`, {
        method: "GET",
        cache: "no-store",
    });
    if (!response.ok) {
        throw new Error("Unable to verify warranty.");
    }
    return await response.json();
}
async function getWarrantyPolicies() {
    const response = await fetch(`${API_BASE_URL}/warranty-policies`, {
        method: "GET",
        cache: "no-store",
    });
    if (!response.ok) {
        throw new Error("Unable to load warranty policies.");
    }
    return await response.json();
}
/* ======================================================
   GET PRODUCTS
   ====================================================== */
async function getProducts() {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: "GET",
        headers: {
            ...getAuthHeaders(),
        },
        cache: "no-store",
    });
    if (!response.ok) {
        throw new Error("Unable to load products.");
    }
    return await response.json();
}
/* ======================================================
   GET SINGLE PRODUCT
   ====================================================== */
async function getProduct(id) {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
            ...getAuthHeaders(),
        },
        cache: "no-store",
    });
    if (!response.ok) {
        throw new Error("Unable to load product.");
    }
    return await response.json();
}
/* ======================================================
   CREATE PRODUCT
   ====================================================== */
async function createProduct(data) {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response
            .json()
            .catch(() => null);
        throw new Error(errorData?.message ||
            "Unable to create product.");
    }
    return await response.json();
}
/* ======================================================
   UPDATE PRODUCT
   ====================================================== */
async function updateProduct(id, data) {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response
            .json()
            .catch(() => null);
        throw new Error(errorData?.message ||
            "Unable to update product.");
    }
    return await response.json();
}
/* ======================================================
   DELETE PRODUCT
   ====================================================== */
async function deleteProduct(id) {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
            ...getAuthHeaders(),
        },
    });
    if (!response.ok) {
        const errorData = await response
            .json()
            .catch(() => null);
        throw new Error(errorData?.message ||
            "Unable to delete product.");
    }
}
//# sourceMappingURL=api.js.map