// src/router.js
import { createRouter, createWebHistory } from 'vue-router';

import DashboardMFG from './views/DashboardMFG.vue';
import DashboardHR from './views/DashboardHR.vue';
import AdminHome from './views/AdminHome.vue';
import Login from './views/Login.vue';

import RegisterLeader from './components/RegisterLeader';
import RegisterAdmin from './components/RegisterAdmin';
import MFGControl from './components/MFGControl';
import WidgetManagement from './components/AdminWidgetManagement';
import ChangePassword from './components/ChangePassword.vue';

const routes = [
  {
    path: "/",
    name: "Login",
    component: Login
  },

  {
    path: "/change-password",
    component: ChangePassword
  },

  {
    path: '/dashboard-mfg',
    component: DashboardMFG,
    meta: { roles: ['Admin', 'LeaderMFG'] }
  },
  {
    path: '/dashboard-hr',
    component: DashboardHR,
    meta: { roles: ['Admin', 'LeaderHR'] }
  },
  {
    path: '/dashboard-admin',
    component: AdminHome,
    meta: { roles: ['Admin'] }
  },

  {
    path: '/register-leader',
    component: RegisterLeader,
    meta: { roles: ['Admin'] }
  },
  {
    path: '/register-admin',
    component: RegisterAdmin,
    meta: { roles: ['Admin'] }
  },
  {
    path: '/MFGControl',
    component: MFGControl,
    meta: { roles: ['Admin'] }
  },
  {
    path: '/widget-management',
    component: WidgetManagement,
    meta: { roles: ['Admin'] }
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


// 🔥🔥🔥 GUARD (ล็อกทั้งระบบ)
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const mustChangePassword = sessionStorage.getItem("mustChangePassword") === "true";

  // ❌ ยังไม่ login
  if (!token) {
    if (to.path !== "/") return next("/");
    return next();
  }

  // 🔥 force change password (ต้องมาก่อน role)
  if (mustChangePassword && to.path !== "/change-password") {
    return next("/change-password");
  }

  // 🔒 login แล้ว ห้ามกลับ login
  if (to.path === "/") {
    if (role === "Admin") return next("/dashboard-admin");
    if (role === "LeaderMFG") return next("/dashboard-mfg");
    if (role === "LeaderHR") return next("/dashboard-hr");
  }

  // 🔐 role check
  if (to.meta.roles && !to.meta.roles.includes(role)) {
    return next("/"); // หรือทำ unauthorized page ก็ได้
  }

  next();
});

export default router;