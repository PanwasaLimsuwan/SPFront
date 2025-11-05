<template>
  <div class="admin-home">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <img src="logo2.png" alt="Sony Logo" class="logo" />
          <div class="title-group">
            <h1>Admin Control Panel</h1>
            <p class="subtitle">จัดการระบบและผู้ใช้งาน</p>
          </div>
        </div>
      </div>
      <Logout />
    </header>

    <!-- Main Content -->
    <div class="container">
      <!-- Welcome Section -->
      <!-- <section class="welcome-section">
        <div class="welcome-card">
          <h2>👋 ยินดีต้อนรับ, Admin</h2>
          <p>เลือกเมนูด้านล่างเพื่อจัดการระบบ</p>
        </div>
      </section> -->

      <!-- Menu Cards -->
      <section class="menu-grid">
        <!-- Widget Management Card -->
        <!-- <div class="menu-card card-widget"> -->
        <div class="menu-card card-widget" @click="goToWidgetManagement">
          <div class="card-icon">🎛️</div>
          <div class="card-content">
            <h3>Widget Management</h3>
            <p>จัดการ Widget และการแสดงผลใน Dashboard</p>
            <!-- <ul class="feature-list">
              <li>✓ เปิด/ปิด Widget</li>
              <li>✓ แก้ไขลำดับการแสดงผล</li>
              <li>✓ จัดการคอมโพเนนต์</li>
            </ul> -->
          </div>
          <!-- <div class="card-footer">
            <span class="btn-text">เข้าสู่ระบบ →</span>
          </div> -->
        </div>

        <!-- Leader Management Card -->
        <div class="menu-card card-leader" @click="goToLeaderManagement">
          <div class="card-icon">👥</div>
          <div class="card-content">
            <h3>Manage Leader</h3>
            <p>จัดการข้อมูล Leader</p>
            <!-- <ul class="feature-list">
              <li>✓ ลงทะเบียน Leader</li>
              <li>✓ แก้ไขข้อมูลผู้ใช้</li>
              <li>✓ จัดการสิทธิ์การเข้าถึง</li>
            </ul> -->
          </div>
          <!-- <div class="card-footer">
            <span class="btn-text">เข้าสู่ระบบ →</span>
          </div> -->
        </div>

        <!-- Admin Management Card -->
        <div class="menu-card card-admin" @click="goToAdminManagement">
          <div class="card-icon">⚙️</div>
          <div class="card-content">
            <h3>Manage Admin</h3>
            <p>จัดการข้อมูล Admin</p>
            <!-- <ul class="feature-list">
              <li>✓ ลงทะเบียน Admin</li>
              <li>✓ แก้ไขข้อมูลระบบ</li>
              <li>✓ จัดการผู้ดูแลระบบ</li>
            </ul> -->
          </div>
          <!-- <div class="card-footer">
            <span class="btn-text">เข้าสู่ระบบ →</span>
          </div> -->
        </div>
      </section>

      <!-- Quick Stats -->
      <section class="stats-section">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <h4>Active Widgets</h4>
            <p class="stat-number">{{ activeWidgets }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-content">
            <h4>Total Leaders</h4>
            <p class="stat-number">{{ totalLeaders }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👨‍💼</div>
          <div class="stat-content">
            <h4>Total Admins</h4>
            <p class="stat-number">{{ totalAdmins }}</p>
          </div>
        </div>
        <!-- <div class="stat-card">
          <div class="stat-icon">🔐</div>
          <div class="stat-content">
            <h4>System Status</h4>
            <p class="stat-status">● Online</p>
          </div>
        </div> -->
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Logout from '../views/Logout';

const API_BASE = 'http://localhost:5000/api';

// Stats
const activeWidgets = ref(0);
const totalLeaders = ref(0);
const totalAdmins = ref(0);

// Navigation functions
const goToWidgetManagement = () => {
  window.location.href = '/widget-management';
};

const goToLeaderManagement = () => {
  window.location.href = '/register-leader';
};

const goToAdminManagement = () => {
  window.location.href = '/register-admin';
};

// Fetch stats
const fetchStats = async () => {
  try {
    // Fetch active widgets count
    const widgetsResponse = await axios.get(`${API_BASE}/AdminWidget`);
    activeWidgets.value = widgetsResponse.data.filter(w => w.isActive).length;

    // Fetch leaders count
    const leadersResponse = await axios.get(`${API_BASE}/EmployeeInfo/get-leaders`);
    totalLeaders.value = leadersResponse.data.length;

    // Fetch admins count
    const adminsResponse = await axios.get(`${API_BASE}/EmployeeInfo/get-technicians`);
    totalAdmins.value = adminsResponse.data.length;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.admin-home {
  min-height: 100vh;
  background: #babbbd;
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Header */
.header {
  background: white;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  height: 50px;
  width: auto;
}

.title-group h1 {
  font-size: 28px;
  color: #2d3748;
  margin-bottom: 4px;
}

.subtitle {
  color: #718096;
  font-size: 14px;
}

/* Container */
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
}

/* Welcome Section */
.welcome-section {
  margin-bottom: 40px;
}

.welcome-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.welcome-card h2 {
  font-size: 36px;
  color: #2d3748;
  margin-bottom: 12px;
}

.welcome-card p {
  font-size: 18px;
  color: #718096;
}

/* Menu Grid */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.menu-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  display: flex;
  flex-direction: column;
}

.menu-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.card-widget:hover {
  border-color: #4299e1;
}

.card-leader:hover {
  border-color: #48bb78;
}

.card-admin:hover {
  border-color: #ed8936;
}

.card-icon {
  font-size: 64px;
  margin-bottom: 20px;
  text-align: center;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 24px;
  color: #2d3748;
  margin-bottom: 12px;
}

.card-content > p {
  color: #718096;
  font-size: 15px;
  margin-bottom: 20px;
  line-height: 1.6;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  color: #4a5568;
  font-size: 14px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.feature-list li:last-child {
  border-bottom: none;
}

.card-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
}

.btn-text {
  color: #4299e1;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s;
}

.card-widget:hover .btn-text {
  color: #2b6cb0;
}

.card-leader:hover .btn-text {
  color: #2f855a;
}

.card-admin:hover .btn-text {
  color: #c05621;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 40px;
}

.stat-content h4 {
  font-size: 14px;
  color: #718096;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
}

.stat-status {
  font-size: 18px;
  font-weight: 600;
  color: #48bb78;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 20px;
  }

  .header-content {
    padding: 0 20px;
    flex-direction: column;
    gap: 16px;
  }

  .logo-section {
    flex-direction: column;
    text-align: center;
  }

  .title-group h1 {
    font-size: 24px;
  }

  .welcome-card {
    padding: 24px;
  }

  .welcome-card h2 {
    font-size: 28px;
  }

  .menu-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .stats-section {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-number {
    font-size: 24px;
  }
}
</style>