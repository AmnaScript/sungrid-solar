
import axios from "axios";

export type StaffUser = {
    id: number;
    name: string;
    email: string;
    role: "staff" | "admin";
};

export type Order = {
    id: number;
    customer_name: string;
    address: string;
    status: string;
    created_at: string;
};

export type LoginResponse = {
    message: string;
    token: string;
    user: StaffUser;
};

export const TOKEN_KEY = "sungrid_staff_token";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
            return "Invalid email or password.";
        }

        if (error.response?.status === 403) {
            return "Your session is invalid or you don't have permission.";
        }

        return error.response?.data?.message ||
            "Could not connect to the server. Please try again.";
    }

    return "Something went wrong. Please try again.";
}
