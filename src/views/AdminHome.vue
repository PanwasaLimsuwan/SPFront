<template>
  <div class="dash">
    <!-- Topbar -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo-dot">
          <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        </div>
        <div>
          <h1>Admin Dashboard</h1>
          <!-- <div class="greeting">Welcome back 👋</div> -->
        </div>
      </div>
      <Logout />
    </header>

    <div class="main">
      <!-- STATS -->
      <div class="section-label">Overview</div>
      <section class="stats">
        <div class="stat-card stat-blue pop">
          <div class="stat-left">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 4h2v-2h2v-2h-2v-2h-2v2h-2v2h2v2zm2 4v-2h2v-2h2v2h-2v2h-2z"/></svg>
          </div>
          <div class="stat-label">Widgets</div>
          <div class="stat-num">{{ activeWidgets }}</div>
          <div class="stat-trend"><span class="trend-badge">Active</span> this session</div>
        </div>
        </div>

        <div class="stat-card stat-green pop delay-1">
          <div class="stat-left">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div class="stat-label">Total Leaders</div>
          <div class="stat-num">{{ totalLeaders }}</div>
          <div class="stat-trend"><span class="trend-badge">Registered</span> accounts</div>
        </div>
        </div>

        <div class="stat-card stat-amber pop delay-2">
          <div class="stat-left">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
          </div>
          <div class="stat-label">Total Admins</div>
          <div class="stat-num">{{ totalAdmins }}</div>
          <div class="stat-trend"><span class="trend-badge">All systems</span> active</div>
        </div>
        </div>
      </section>

      <!-- ACTIONS -->
      <div class="section-label" style="margin-top: 8px;">Quick Actions</div>
      <section class="actions">
        <div class="action-card widget float" @click="go('/widget-management')">
          <div class="card-icon-wrap">
            <svg viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 4h2v-2h2v-2h-2v-2h-2v2h-2v2h2v2zm2 4v-2h2v-2h2v2h-2v2h-2z"/></svg>
          </div>
          <h3>Widget Management</h3>
          <p>Customize and control dashboard widgets</p>
          <div class="card-arrow">→</div>
        </div>

        <div class="action-card leader float delay-1" @click="go('/register-leader')">
          <div class="card-icon-wrap">
            <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <h3>Manage Leaders</h3>
          <p>Control roles and leader permissions</p>
          <div class="card-arrow">→</div>
        </div>

        <div class="action-card admin float delay-2" @click="go('/register-admin')">
          <div class="card-icon-wrap">
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
          </div>
          <h3>Manage Admins</h3>
          <p>Control roles and admin permissions</p>
          <div class="card-arrow">→</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Logout from '../views/Logout';

const router = useRouter();
const API_BASE = 'http://16.176.50.155:5000/api';

const activeWidgets = ref(0);
const totalLeaders = ref(0);
const totalAdmins = ref(0);

const go = (path) => router.push(path);

const animateValue = (refVar, end) => {
  let start = 0;
  const duration = 800;
  const stepTime = 20;
  const increment = end / (duration / stepTime);

  const counter = setInterval(() => {
    start += increment;
    if (start >= end) {
      refVar.value = end;
      clearInterval(counter);
    } else {
      refVar.value = Math.floor(start);
    }
  }, stepTime);
};

const fetchStats = async () => {
  try {
    const w = await axios.get(`${API_BASE}/AdminWidget`);
    animateValue(activeWidgets, w.data.filter(x => x.isActive).length);

    const l = await axios.get(`${API_BASE}/EmployeeInfo/get-leaders`);
    animateValue(totalLeaders, l.data.length);

    const a = await axios.get(`${API_BASE}/EmployeeInfo/get-technicians`);
    animateValue(totalAdmins, a.data.length);
  } catch (e) {
    console.error(e);
  }
};

onMounted(fetchStats);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@600;700&display=swap');

* { box-sizing: border-box; }

.dash {
  min-height: 100vh;
  font-family: 'DM Sans', sans-serif;
  background: #f8f6ff;
  background-image:
    radial-gradient(ellipse 60% 40% at 10% 0%, #e0d9ff 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 90% 100%, #ffd6ef 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 60% 50%, #d0f0ff 0%, transparent 50%);
  color: #1e1440;
  padding-bottom: 40px;
}

/* ─── TOPBAR ─── */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 36px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(180, 160, 255, 0.18);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-dot {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-dot svg {
  width: 18px;
  height: 18px;
  fill: white;
}

.topbar h1 {
  font-family: 'Sora', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #2d1f6e;
  letter-spacing: -0.3px;
  margin: 0;
}

.greeting {
  font-size: 12px;
  color: #8b7db5;
  margin-top: 2px;
}

/* ─── MAIN ─── */
.main {
  padding: 36px 36px 0;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: #a390c8;
  margin-bottom: 14px;
}

/* ─── STATS ─── */
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px;
  margin-bottom: 32px;
}

.stat-card {
  border-radius: 22px;
  /* padding: 48px 56px; */
  padding: 22px 32px;
  position: relative;
  overflow: hidden;
  transition: transform 0.25s, box-shadow 0.25s;
  cursor: default;
  width: 50%;
  box-sizing: border-box;
  /* min-height: 160px; */
}
 /* .stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 140px;
  padding: 32px 36px;
} */

.stat-card::before {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: white;
  opacity: 0.15;
}

.stat-card::after {
  content: '';
  position: absolute;
  bottom: -20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  opacity: 0.1;
}

.stat-card:hover {
  transform: translateY(-6px) scale(1.02);
}

.stat-blue {
  background: linear-gradient(140deg, #818cf8, #6366f1, #4f46e5);
  box-shadow: 0 8px 28px rgba(99, 102, 241, 0.28);
}

.stat-green {
  background: linear-gradient(140deg, #34d399, #10b981, #059669);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.28);
}

.stat-amber {
  background: linear-gradient(140deg, #fb923c, #f97316, #ea580c);
  box-shadow: 0 8px 28px rgba(249, 115, 22, 0.28);
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: left;
  justify-content: left;
  margin-bottom: 14px;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.stat-label {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 500;
  letter-spacing: 0.2px;
  margin-bottom: 4px;
}

.stat-num {
  font-family: 'Sora', sans-serif;
  font-size: 56px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-trend {
  margin-top: 12px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: left;
  gap: 6px;
}

.stat-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trend-badge {
  background: rgba(255, 255, 255, 0.22);
  color: white;
  border-radius: 30px;
  padding: 2px 9px;
  font-size: 16px;
  font-weight: 600;
}

/* ─── ACTIONS ─── */
.actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.action-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 22px;
  padding: 26px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 20px rgba(100, 80, 180, 0.06);
  position: relative;
  overflow: hidden;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 22px 22px 0 0;
}

.action-card.widget::before { background: linear-gradient(90deg, #818cf8, #6366f1); }
.action-card.leader::before { background: linear-gradient(90deg, #34d399, #10b981); }
.action-card.admin::before  { background: linear-gradient(90deg, #fb923c, #f97316); }

.action-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(100, 80, 180, 0.13);
  background: rgba(255, 255, 255, 0.97);
}

.card-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.widget .card-icon-wrap { background: #eef0ff; }
.leader .card-icon-wrap { background: #e8faf3; }
.admin  .card-icon-wrap { background: #fff3eb; }

.card-icon-wrap svg { width: 20px; height: 20px; }
.widget .card-icon-wrap svg { fill: #6366f1; }
.leader .card-icon-wrap svg { fill: #10b981; }
.admin  .card-icon-wrap svg  { fill: #f97316; }

.action-card h3 {
  font-family: 'Sora', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #1e1440;
  margin-bottom: 6px;
}

.action-card p {
  font-size: 13px;
  color: #8b7db5;
  line-height: 1.5;
  margin: 0;
}

.card-arrow {
  position: absolute;
  bottom: 22px;
  right: 22px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.widget .card-arrow { background: #eef0ff; color: #6366f1; }
.leader .card-arrow { background: #e8faf3; color: #10b981; }
.admin  .card-arrow { background: #fff3eb; color: #f97316; }

.action-card:hover .card-arrow {
  opacity: 1;
  transform: translate(2px, -2px);
}

/* ─── ANIMATIONS ─── */
.pop {
  animation: popIn 0.4s ease both;
}

.float {
  animation: floatUp 0.45s ease both;
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }

@keyframes popIn {
  from { transform: scale(0.92) translateY(12px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes floatUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

/* ─── RESPONSIVE ─── */
@media (max-width: 768px) {
  .main { padding: 24px 20px 0; }
  .topbar { padding: 16px 20px; }
  .stats, .actions { grid-template-columns: 1fr; }
}
</style>
