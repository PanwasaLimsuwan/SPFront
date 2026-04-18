// src/services/AuthService.js

import axios from 'axios';

// const API_BASE_URL = 'http://16.176.50.155:5000';
const API_BASE_URL = 'http://16.176.50.155:5000';

// ฟังก์ชันการลงทะเบียนที่ Admin จะเป็นคนลงทะเบียนให้
export async function register({ empID, firstName, lastName, email, role }) {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/api/Admin/register`, {
      EmpID: empID,         // ส่ง EmpID
      FirstName: firstName, // ส่ง FirstName
      LastName: lastName,   // ส่ง LastName
      Email: email,         // ส่ง Email
      Role: role,           // ส่ง Role
    });

    // ตรวจสอบว่าได้ token หรือไม่
    if (data?.token) {
      return data.token; // ส่งคืน token
    } else {
      throw new Error("ไม่พบ token จากระบบ");
    }
  } catch (error) {
    // ถ้าเกิดข้อผิดพลาด ให้แสดงข้อความที่ได้จาก API หรือข้อความผิดพลาดทั่วไป
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
}

export async function login({ email, password }) {
  const { data } = await axios.post(`${API_BASE_URL}/api/Admin/login`, {
    Email: email,
    Password: password,
  });

  sessionStorage.setItem("token", data.token);
  sessionStorage.setItem("role", data.role);

  // 🔥 แก้ตรงนี้
  sessionStorage.setItem("mustChangePassword", String(data.mustChangePassword));

  return data;
}
