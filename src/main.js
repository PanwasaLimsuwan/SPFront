import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import axios from 'axios';
import Logout from '../src/views/Logout';

// base URL
axios.defaults.baseURL = 'http://16.176.50.155:5000';

// ✅ ใช้ sessionStorage แทน sessionStorage
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// response interceptor
axios.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.clear(); // 🔥 เปลี่ยน
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

const app = createApp(App);

app.component("Logout", Logout);

app.use(router);
app.use(Toast);
app.mount('#app');