<template>
  <div class="assignment-status-panel">
    <div class="panel-header">
      <div class="header-top">
        <h3>📋 สถานะการ Assign พนักงาน</h3>
        <!-- ✅ แสดง scope ของ user ที่ login อยู่ -->
        <div class="user-scope" v-if="userBiz || userProcess">
          <span class="scope-label">
            🏭 {{ userBiz || "ทุก Biz" }}
            <template v-if="userProcess"> / {{ userProcess }}</template>
          </span>
          <span class="scope-role" :class="roleClass">{{ roleLabel }}</span>
        </div>
      </div>

      <div class="tab-group">
        <button
          v-for="tab in tabs" :key="tab.value"
          :class="['tab-btn', { active: activeTab === tab.value }]"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span class="badge" :class="tab.value">{{ counts[tab.value] }}</span>
        </button>
      </div>
    </div>

    <div v-if="assignments.length === 0 && !loading" class="empty-state">
      <p>✅ ไม่มีรายการในส่วนของ {{ userBiz || "คุณ" }}</p>
    </div>

    <div class="table-wrapper" v-else>
      <table>
        <thead>
          <tr>
            <th>รหัส</th>
            <th>ชื่อ-นามสกุล</th>
            <th>จาก</th>
            <th>ไปยัง</th>
            <th>เริ่มต้น</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filtered.length === 0">
            <td colspan="7" class="empty">ไม่มีข้อมูลในแท็บนี้</td>
          </tr>
          <tr v-for="a in filtered" :key="a.assignmentID"
              :class="{ 'row-mine': canApprove(a) }">
            <td>{{ a.empID }}</td>
            <td>{{ a.firstName }} {{ a.lastName }}</td>
            <td>{{ a.fromProcess || '-' }} / {{ a.fromBiz || '-' }}</td>
            <td><strong>{{ a.toProcess }}</strong> / {{ a.toBiz }}</td>
            <td>{{ formatDate(a.startAt) }}</td>
            <td>
              <span :class="['status-badge', a.status?.toLowerCase()]">
                {{ statusLabel(a.status) }}
              </span>
            </td>
            <td class="action-cell">
              <!-- ✅ Approve เฉพาะหัวหน้าของ ToProcess/ToBiz -->
              <template v-if="a.status === 'Pending'">
                <button
                  v-if="canApprove(a)"
                  class="btn-approve"
                  @click="approve(a.assignmentID)"
                  title="อนุมัติ"
                >✅ Approve</button>
                <!-- <span v-else class="lock-icon" title="ไม่ใช่ Process ของคุณ">🔒</span> -->
              
              <button
    v-if="isToSide(a) || canApprove(a)"
    class="btn-cancel"
    @click="cancelAssignment(a.assignmentID)"
    title="ยกเลิก"
  >✕</button>
              </template>

              <!-- Complete เฉพาะถ้า canApprove -->
              <!-- <button
                v-if="a.status === 'Active' && canApprove(a)"
                class="btn-complete"
                @click="complete(a.assignmentID)"
                title="เสร็จงาน"
              >🏁 Complete</button> -->

              <!-- Cancel เฉพาะถ้ายังไม่ Completed และ canApprove -->
              <!-- <button
                v-if="a.status !== 'Completed' && canApprove(a)"
                class="btn-cancel"
                @click="cancel(a.assignmentID)"
                title="ยกเลิก"
              >✕</button> -->
              <!-- ✅ เพิ่ม: FromProcess กด Cancel ได้ตอน Pending -->

              <button
    v-if="a.status === 'Active' && canReturn(a)"
    class="btn-complete"
    @click="returnEmployee(a)"
    title="คืนพนักงาน"
  >Complete</button>

   <!-- Returning: เฉพาะ ToProcess ยืนยัน -->
  <template v-if="a.status === 'Returning'">
    <button v-if="canConfirmReturn(a)" class="btn-approve"
      @click="confirmReturn(a.assignmentID)">✅ ยืนยันรับทราบ</button>
    <span v-else class="lock-icon" title="รอ ToProcess ยืนยัน">⏳</span>
  </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import axios from "axios";
import jwt_decode from "jwt-decode";

const props = defineProps({ filters: Object });
const emit  = defineEmits(["changed"]);
const refreshBarChart = inject("refreshBarChart", () => {});

const assignments = ref([]);
const activeTab   = ref("Pending");
const loading     = ref(false);

// ✅ ดึงข้อมูลจาก JWT token
const currentUser = computed(() => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return jwt_decode(token);
  } catch { return {}; }
});

const userRole     = computed(() => currentUser.value?.role     ?? "");
const userBiz      = computed(() => currentUser.value?.biz      ?? "");
const userProcess  = computed(() => currentUser.value?.process  ?? "");
const userPosition = computed(() => currentUser.value?.position ?? "");
const isAdmin      = computed(() => userRole.value === "Admin");

// ✅ ตรวจว่าเป็น supervisor/foreman/leader หรือไม่
const isSupervisor = computed(() => {
  if (isAdmin.value) return true;
  const pos = userPosition.value.toLowerCase();
  return ["supervisor","foreman","section chief","manager","leader"]
    .some(p => pos.includes(p));
});

const roleLabel = computed(() => ({
  "Admin":     "Admin (ดูได้ทั้งหมด)",
  "LeaderMFG": "Leader MFG",
  "LeaderHR":  "Leader HR",
}[userRole.value] ?? userRole.value));

const roleClass = computed(() => ({
  "Admin":     "role-admin",
  "LeaderMFG": "role-leader",
  "LeaderHR":  "role-leader",
}[userRole.value] ?? "role-leader"));

// ✅ ตรวจว่า approve assignment นี้ได้ไหม
// ✅ แก้: ตรวจ FromBiz/FromProcess แทน ToBiz/ToProcess
const canApprove = (a) => {
  if (isAdmin.value) return true;
  if (!isSupervisor.value) return false;
  
  // ✅ หัวหน้าต้นทาง (FromBiz/FromProcess) คือคนที่ approve ได้
  const bizOk     = !userBiz.value     || a.fromBiz     === userBiz.value;
  const processOk = !userProcess.value || a.fromProcess === userProcess.value;
  return bizOk && processOk;
};

const tabs = [
  { label: "⏳ รออนุมัติ",  value: "Pending"   },
  { label: "🟢 กำลังทำงาน", value: "Active"    },
  { label: "🔄 รอยืนยันการคืนพนักงาน", value: "Returning" },
  { label: "✅ เสร็จแล้ว",   value: "Completed" },
];

const statusLabel = (s) => ({
  Pending:   "รออนุมัติ",
  Active:    "กำลังทำงาน",
  Completed: "เสร็จแล้ว",
  Cancelled: "ยกเลิกแล้ว",
}[s] ?? s);

const formatDate = (d) =>
  d ? new Date(d).toLocaleString("th-TH", { dateStyle:"short", timeStyle:"short" }) : "-";

const counts = computed(() => ({
  Pending:   assignments.value.filter(a => a.status === "Pending").length,
  Active:    assignments.value.filter(a => a.status === "Active").length,
  Returning: assignments.value.filter(a => a.status === "Returning").length,
  Completed: assignments.value.filter(a => a.status === "Completed").length,
}));

const filtered = computed(() =>
  assignments.value.filter(a => a.status === activeTab.value)
);

// const fetchData = async () => {
//   loading.value = true;
//   try {
//     const params = {};

//     if (isAdmin.value) {
//       // Admin — ใช้ filter จาก dropdown
//       if (props.filters?.biz     !== "ALL") params.toBiz     = props.filters.biz;
//       if (props.filters?.process !== "ALL") params.toProcess = props.filters.process;
//     } else {
//       // ✅ Leader — กรองเฉพาะ Biz/Process ของตัวเอง
//       if (userBiz.value)     params.fromBiz     = userBiz.value;
//       if (userProcess.value) params.fromProcess = userProcess.value;
//     }

//     const res = await axios.get(
//       "http://localhost:5000/api/Assignment/with-employees", { params }
//     );
//     assignments.value = res.data ?? [];
//   } catch (err) {
//     console.error("❌ fetchData error:", err);
//   } finally {
//     loading.value = false;
//   }
// };
const fetchData = async () => {
  loading.value = true;
  try {
    let results = [];
 
    if (isAdmin.value) {
      const params = {};
      if (props.filters?.biz     !== "ALL") params.toBiz     = props.filters.biz;
      if (props.filters?.process !== "ALL") params.toProcess = props.filters.process;
      const res = await axios.get("http://localhost:5000/api/Assignment/with-employees",{params});
      results = res.data ?? [];
    } else {
      // ✅ ดึง 2 ชุดพร้อมกัน: ฝั่ง From และ ฝั่ง To
      const [fromRes, toRes] = await Promise.all([
        axios.get("http://localhost:5000/api/Assignment/with-employees", {
          params: {
            ...(userBiz.value     && { fromBiz:     userBiz.value }),
            ...(userProcess.value && { fromProcess: userProcess.value }),
          }
        }),
        axios.get("http://localhost:5000/api/Assignment/with-employees", {
          params: {
            ...(userBiz.value     && { toBiz:     userBiz.value }),
            ...(userProcess.value && { toProcess: userProcess.value }),
          }
        }),
      ]);
 
      // ✅ รวมและ deduplicate ด้วย assignmentID
      const map = new Map();
      [...(fromRes.data??[]), ...(toRes.data??[])].forEach(a => map.set(a.assignmentID, a));
      results = [...map.values()];
    }
 
    results.sort((a,b) => new Date(b.startAt) - new Date(a.startAt));
    assignments.value = results;
  } catch (err) {
    console.error("❌ fetchData error:", err);
  } finally {
    loading.value = false;
  }
};

const approve = async (id) => {
  try {
    await axios.put(`http://localhost:5000/api/Assignment/${id}/approve`);
    // await fetchData();
    await fetchData(); refreshBarChart(); emit("changed");
    refreshBarChart();
    emit("changed");
  } catch (err) {
    alert("Approve ไม่สำเร็จ: " + (err?.response?.data || err.message));
  }
};

const cancelAssignment = async (id) => {
  if (!confirm("ยืนยันการยกเลิก Assignment นี้?")) return;
  try {
    await axios.put(`http://localhost:5000/api/Assignment/${id}/status?status=Cancelled`);
    await fetchData();
    refreshBarChart();
    emit("changed");
  } catch (err) {
    alert("ไม่สำเร็จ: " + err.message);
  }
};

// const complete = async (id) => {
//   try {
//     await axios.put(`http://localhost:5000/api/Assignment/${id}/status?status=Completed`);
//     await fetchData();
//     refreshBarChart();
//     emit("changed");
//   } catch (err) {
//     alert("ไม่สำเร็จ: " + err.message);
//   }
// };

// const cancel = async (id) => {
//   if (!confirm("ยืนยันการยกเลิก Assignment นี้?")) return;
//   try {
//     await axios.put(`http://localhost:5000/api/Assignment/${id}/status?status=Cancelled`);
//     await fetchData();
//     refreshBarChart();
//     emit("changed");
//   } catch (err) {
//     alert("ไม่สำเร็จ: " + err.message);
//   }
// };

// ✅ ToProcess กดคืนได้ทันที, FromProcess กดได้แต่ต้อง Confirm
const isFromSide = (a) => {
  const bizOk     = !userBiz.value     || a.fromBiz     === userBiz.value;
  const processOk = !userProcess.value || a.fromProcess === userProcess.value;
  return bizOk && processOk;
};

const isToSide = (a) => {
  const bizOk     = !userBiz.value     || a.toBiz     === userBiz.value;
  const processOk = !userProcess.value || a.toProcess === userProcess.value;
  return bizOk && processOk;
};

const canReturn = (a) => {
  if (isAdmin.value) return true;
  if (!isSupervisor.value) return false;
  return isFromSide(a) || isToSide(a);
};

// ✅ ToProcess เท่านั้นที่กด confirm-return ได้
const canConfirmReturn = (a) => {
  if (isAdmin.value) return true;
  if (!isSupervisor.value) return false;
  return isToSide(a);
};

const returnEmployee = async (a) => {
  const side = isToSide(a) ? "to" : "from";
  const msg  = side === "from"
    ? "ขอคืนพนักงาน? ระบบจะแจ้ง ToProcess เพื่อยืนยัน"
    : "ยืนยันการคืนพนักงาน?";
  if (!confirm(msg)) return;
  try {
    await axios.put(`http://localhost:5000/api/Assignment/${a.assignmentID}/return?callerSide=${side}`);
    await fetchData();
    refreshBarChart();
    emit("changed");
  } catch (err) {
    alert("ไม่สำเร็จ: " + err.message);
  }
};

const confirmReturn = async (id) => {
  if (!confirm("ยืนยันรับทราบการคืนพนักงาน?")) return;
  try {
    await axios.put(`http://localhost:5000/api/Assignment/${id}/confirm-return`);
    await fetchData();
    refreshBarChart();
    emit("changed");
  } catch (err) {
    alert("ไม่สำเร็จ: " + err.message);
  }
};

onMounted(() => {
  fetchData();
  setInterval(fetchData, 15000);
  if (window.connection) {
    window.connection.on("AssignmentUpdated", fetchData);
  }
});
</script>

<style scoped>
.assignment-status-panel { font-family: Arial, sans-serif; }

.panel-header { margin-bottom: 12px; }
.header-top {
  display: flex; align-items: flex-start;
  justify-content: space-between; flex-wrap: wrap; gap: 8px;
  margin-bottom: 10px;
}
.header-top h3 { margin: 0; font-size: 24px; }

.user-scope {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.scope-label {
  font-size: 16px; color: #374151;
  background: #f3f4f6; padding: 3px 10px; border-radius: 999px;
}
.scope-role {
  font-size: 16px; font-weight: bold;
  padding: 2px 8px; border-radius: 999px;
}
.role-admin  { background: #e0e7ff; color: #3730a3; }
.role-leader { background: #d1fae5; color: #065f46; }

.tab-group { display: flex; gap: 6px; flex-wrap: wrap; }
.tab-btn {
  padding: 5px 12px; border-radius: 20px; border: 1px solid #d1d5db;
  background: #f9fafb; color: #111827; cursor: pointer; font-size: 18px;
  display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.tab-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }

.badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; border-radius: 10px;
  font-size: 16px; font-weight: bold; padding: 0 5px;
}
.badge.Pending   { background: #fef3c7; color: #92400e; }
.badge.Active    { background: #d1fae5; color: #065f46; }
.badge.Completed { background: #e0e7ff; color: #3730a3; }
.badge.Returning     { background: #fce7f3; color: #9d174d; }
.tab-btn.active .badge { background: rgba(255,255,255,0.3); color: white; }

/* .empty-state { text-align: center; padding: 24px; color: #6b7280; } */
.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 16px; }
th, td { padding: 8px 10px; border: 1px solid #e5e7eb; text-align: center; }
th { background: #f3f4f6; font-weight: 600; }
.empty { color: #374151; font-weight: 500; }
.empty-state { color: #111827; font-weight: 500; }
.scope-label { color: #111827; font-weight: 600; }

/* ✅ แถวที่ approve ได้ */
.row-mine { background: #fafffe; }
.row-mine:hover { background: #f0fdf4; }
tr:not(.row-mine):hover { background: #f9fafb; }

.status-badge {
  display: inline-block; padding: 3px 10px;
  border-radius: 12px; font-size: 18px; font-weight: 600;
}
.status-badge.pending   { background: #fef3c7; color: #92400e; }
.status-badge.active    { background: #d1fae5; color: #065f46; }
.status-badge.completed { background: #e0e7ff; color: #3730a3; }
.status-badge.cancelled { background: #fee2e2; color: #991b1b; }
.status-badge.returning { background: #fce7f3; color: #9d174d; }

.action-cell { display: flex; gap: 4px; justify-content: center; align-items: center; }
.lock-icon { font-size: 16px; color: #9ca3af; }

.btn-approve, .btn-complete, .btn-cancel {
  border: none; border-radius: 6px; padding: 4px 8px;
  cursor: pointer; font-size: 16px;
}
.btn-approve  { background: #d1fae5; color: #065f46; }
.btn-complete { background: #e0e7ff; color: #3730a3; }
.btn-cancel   { background: #fee2e2; color: #991b1b; }
.btn-approve:hover  { background: #a7f3d0; }
.btn-complete:hover { background: #c7d2fe; }
.btn-cancel:hover   { background: #fecaca; }
</style>