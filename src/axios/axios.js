// src/axios/axios.js
import axios from 'axios';

// ตั้งค่า Axios: เช่น ตั้งค่า baseURL ของ Backend API
const instance = axios.create({
    baseURL: 'http://localhost:5000', // ตั้งค่า URL ของ Backend (API)
    headers: {
        'Content-Type': 'application/json',
    },
});

// คุณสามารถกำหนดตัวกรองหรือ interceptor สำหรับการจัดการ response หรือ error
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // จัดการข้อผิดพลาดที่เกิดขึ้น
        return Promise.reject(error);
    }
);

export default instance;
