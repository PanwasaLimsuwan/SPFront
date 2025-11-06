// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeDashboard from './views/HomeDashboard.vue';
import DashboardMFG from './views/DashboardMFG.vue';
import DashboardHR from './views/DashboardHR.vue';
import AdminHome from './views/AdminHome.vue';
import CamerasList from './components/CamerasList.vue';
import Login from './views/Login.vue';
import RegisterLeader from './components/RegisterLeader'
import RegisterAdmin from './components/RegisterAdmin'
import MFGControl from './components/MFGControl'
import WidgetManagement from './components/AdminWidgetManagement'

const routes = [
  { path: "/", name: "Login", component: Login, meta: { guestOnly: true } },
  { path: '/dashboard', component: HomeDashboard },
  { path: '/dashboard-mfg', component: DashboardMFG },
  { path: '/dashboard-hr', component: DashboardHR },
  { path: '/dashboard-admin' , component: AdminHome },
  { path: '/register-leader' , component: RegisterLeader },
  { path: '/register-admin' , component: RegisterAdmin },
  { path: '/MFGControl' , component: MFGControl },
  { path: '/widget-management' , component: WidgetManagement },
  {
    path: '/dashboard-mfg',
    name: 'DashboardMFG',
    component: () => import('@/views/DashboardMFG.vue'),
    meta: { requiresAuth: true, roles: ['Admin', 'LeaderMFG'] } // ✅ จำกัดสิทธิ์
  },
  {
    path: '/dashboard-hr',
    name: 'DashboardHR',
    component: () => import('@/views/DashboardHR.vue'),
    meta: { requiresAuth: true, roles: ['Admin', 'LeaderHR'] } // ✅ จำกัดสิทธิ์
  },
  // {
  //   path: '/dashboard-admin',
  //   name: 'DashboardAdmin',
  //   component: () => import('@/views/DashboardAdmin.vue'),
  //   meta: { requiresAuth: true, roles: ['Admin'] } // ✅ เฉพาะ Admin
  // }

  // { path: 'MFG'}
  // { path: '/cameras' , component: CamerasList },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    next('/'); // ถ้าไม่มี token, ไปหน้า login
  } else {
    next();
  }
});

export default router;
