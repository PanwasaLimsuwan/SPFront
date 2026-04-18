<template>
  <div class="pending-panel">
    <div class="panel-header">
      <span class="panel-title">📋 รายการรอยืนยัน</span>
      <span class="badge" v-if="pendingList.length > 0">{{ pendingList.length }}</span>
      <button class="refresh-btn" @click="fetchPending" title="รีเฟรช">🔄</button>
    </div>

    <div v-if="pendingList.length === 0" class="empty-msg">
      ✅ ไม่มีรายการรอยืนยัน
    </div>

    <div v-else class="pending-list">
      <div
        v-for="item in pendingList"
        :key="item.assignmentID"
        class="pending-card"
      >
        <div class="card-top">
          <span class="emp-name">👤 {{ item.empID }} — {{ item.empName || "—" }}</span>
          <span class="status-badge">รอยืนยัน</span>
        </div>
        <div class="card-detail">
          <span>➜ <strong>{{ item.toProcess }}</strong></span>
          <span style="margin-left:8px; color:#666">{{ item.toBiz }}</span>
          <span style="margin-left:8px; font-size:11px; color:#999">
            {{ formatDate(item.startAt) }}
          </span>
        </div>
        <div class="card-actions">
          <button class="btn-approve" @click="approve(item)" title="อนุมัติ">
            ✅ อนุมัติ
          </button>
          <button class="btn-reject" @click="reject(item)" title="ปฏิเสธ">
            ❌ ปฏิเสธ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import axios from "axios";

const refreshBarChart = inject("refreshBarChart", () => {});
const emit = defineEmits(["updated"]);

const pendingList = ref([]);

const formatDate = (d) =>
  d ? new Date(d).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "";

// ✅ ดึง pending พร้อมชื่อพนักงาน (JOIN กับ EmployeeInfo)
const fetchPending = async () => {
  try {
    const res = await axios.get("http://16.176.50.155:5000/api/Assignment?status=Pending");
    // ดึงชื่อพนักงานเพิ่มเติม
    const empRes = await axios.get("http://16.176.50.155:5000/api/EmployeeInfo").catch(() => ({ data: [] }));
    const empMap = new Map(
      (empRes.data || []).map((e) => [
        String(e.empID),
        `${e.firstName || ""} ${e.lastName || ""}`.trim(),
      ])
    );
    pendingList.value = (res.data || []).map((a) => ({
      ...a,
      empName: empMap.get(String(a.empID)) || "",
    }));
  } catch (err) {
    console.error("❌ fetchPending error:", err);
  }
};

const approve = async (item) => {
  if (!confirm(`อนุมัติการย้าย ${item.empName || item.empID} → ${item.toProcess}?`)) return;
  try {
    await axios.put(`http://16.176.50.155:5000/api/Assignment/${item.assignmentID}/approve`);
    alert("✅ อนุมัติสำเร็จ");
    await fetchPending();
    refreshBarChart();
    emit("updated");
  } catch (err) {
    alert("อนุมัติไม่สำเร็จ: " + (err?.response?.data || err.message));
  }
};

const reject = async (item) => {
  if (!confirm(`ปฏิเสธการย้าย ${item.empName || item.empID}?`)) return;
  try {
    await axios.put(
      `http://16.176.50.155:5000/api/Assignment/${item.assignmentID}/status?status=Rejected`
    );
    alert("❌ ปฏิเสธและยกเลิก Assignment สำเร็จ");
    await fetchPending();
    refreshBarChart();
    emit("updated");
  } catch (err) {
    alert("ปฏิเสธไม่สำเร็จ: " + (err?.response?.data || err.message));
  }
};

onMounted(() => {
  fetchPending();
  // ✅ polling ทุก 10 วินาที ให้อัปเดตอัตโนมัติ
  setInterval(fetchPending, 10000);
  if (window.connection) {
    window.connection.on("AssignmentUpdated", fetchPending);
  }
});
</script>

<style scoped>
.pending-panel {
  font-family: Arial, sans-serif;
  font-size: 13px;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.panel-title { font-weight: bold; font-size: 15px; }
.badge {
  background: #ef4444;
  color: white;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: bold;
}
.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  margin-left: auto;
}
.empty-msg { color: #16a34a; padding: 12px 0; }
.pending-list { display: flex; flex-direction: column; gap: 8px; }
.pending-card {
  border: 1px solid #fcd34d;
  background: #fffbeb;
  border-radius: 8px;
  padding: 10px 12px;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.emp-name { font-weight: bold; color: #1e293b; }
.status-badge {
  background: #fef3c7;
  color: #92400e;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: bold;
}
.card-detail { color: #374151; margin-bottom: 8px; }
.card-actions { display: flex; gap: 8px; }
.btn-approve {
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
}
.btn-approve:hover { background: #15803d; }
.btn-reject {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
}
.btn-reject:hover { background: #dc2626; }
</style>