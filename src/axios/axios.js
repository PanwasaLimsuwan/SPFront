import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api/', // เปลี่ยนเป็น URL ของ API ในแบคเอนด์
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance;
