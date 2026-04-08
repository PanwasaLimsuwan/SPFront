<template>
  <div class="employee-recommendations">

    <!-- ✅ Stepper -->
    <div class="stepper">
      <span class="step" :class="{ done: selectedProcess }">
        <span class="dot"></span> เลือก Process
      </span>
      <span class="step-arrow">›</span>
      <span class="step" :class="{ active: selectedProcess }">
        <span class="dot"></span> ดูพนักงาน
      </span>
      <span class="step-arrow">›</span>
      <span class="step">
        <span class="dot"></span> ยืนยัน Assign
      </span>
    </div>

    <div v-if="!selectedProcess">
      <!-- <div class="prompt-icon">👆</div>
      <p>กดที่แท่งกราฟด้านบนเพื่อดูพนักงานที่แนะนำ</p> -->
    </div>

    <div v-else class="info-bar">
      <span
        >Biz: <strong style="color: #007bff">{{ selectedBiz }}</strong></span
      >
      <span
        >Process:
        <strong style="color: #007bff">{{ selectedProcess }}</strong></span
      >
      <span style="margin-left: 16px"
        >ขาด <strong style="color: red">{{ headcountNeed }}</strong> คน</span
      >
      <span v-if="selectedWorkDate" style="margin-left: 16px; color: #666">
        วันที่: {{ formatDate(selectedWorkDate) }}
      </span>
    </div>

    <!-- ✅ warning ถ้าไม่มีสิทธิ์ (fallback — ปกติจะถูก block ที่ chart แล้ว) -->
    <div
      v-if="selectedProcess && !canSelectForThisProcess"
      class="no-permission-bar"
    >
      🔒 คุณดูแล
      <strong>{{ userBizJwt || "?" }} / {{ userProcessJwt || "?" }}</strong> —
      ไม่สามารถ Assign พนักงานให้
      <strong>{{ selectedBiz }} / {{ selectedProcess }}</strong> ได้
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap">
      <button class="refresh-skill-btn" @click="resetFilter" title="รีเซต">
        <img src="refresh.png" alt="Refresh" class="icon" />
        <span>รีเซต</span>
      </button>
    </div>

    <div
      v-if="autoAssignResult"
      class="auto-result-box"
      :class="autoAssignResult.shortfallCount > 0 ? 'warn' : 'ok'"
    >
      <strong>{{ autoAssignResult.message }}</strong>
      <ul
        v-if="autoAssignResult.assigned?.length"
        style="margin: 6px 0 0; padding-left: 16px"
      >
        <li v-for="emp in autoAssignResult.assigned" :key="emp.empID">
          {{ emp.empID }} — {{ emp.firstName }} {{ emp.lastName }} &nbsp;<span
            style="color: #16a34a"
            >Skill {{ emp.totalSkill }}/18</span
          >
          &nbsp;<span style="color: #f59e0b"
            >OT {{ Math.round(emp.totalTime * 10) / 10 }}h</span
          >
        </li>
      </ul>
      <button
        style="
          margin-top: 8px;
          font-size: 12px;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #6b7280;
        "
        @click="autoAssignResult = null"
      >
        ✕ ปิด
      </button>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th rowspan="2">รหัส</th>
            <th rowspan="2">ชื่อ</th>
            <th rowspan="2">นามสกุล</th>
            <!-- <th rowspan="2">OT สะสม ⓘ</th> -->
            <th rowspan="2">จำนวน Worktime</th>
            <th colspan="6" style="background: #dbeafe; color: #1e40af">
              ระดับ Skill
            </th>
            <th rowspan="2">เลือก</th>
            <th rowspan="2">ยกเลิก</th>
          </tr>
          <tr>
            <th style="background: #eff6ff">Material</th>
            <th style="background: #eff6ff">Operation</th>
            <th style="background: #eff6ff">SAB#1</th>
            <th style="background: #eff6ff">SAB#2</th>
            <th style="background: #eff6ff">SAB#3</th>
            <th style="background: #eff6ff">Inspection</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!selectedProcess">
            <td colspan="14" class="empty-msg">
              💡 กรุณากดที่แท่งกราฟเพื่อดูพนักงานแนะนำ
            </td>
          </tr>
          <tr v-else-if="filteredEmployees.length === 0">
            <td colspan="14" class="empty-msg">
              ไม่พบพนักงานที่ตรงกับเงื่อนไข
            </td>
          </tr>
          <tr
            v-else
            v-for="(emp, index) in filteredEmployees"
            :key="emp.empID"
            :class="{
              'row-highlight': index < headcountNeed && !emp.assignmentStatus,
              'row-pending': emp.assignmentStatus === 'Pending',
              'row-active-assigned': emp.assignmentStatus === 'Active',
            }"
          >
            <td>{{ emp.empID }}</td>
            <td>
              <div
                style="
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  justify-content: center;
                "
              >
                <span>{{ emp.firstName }}</span>
                <span
                  v-if="emp.assignmentStatus === 'Pending'"
                  class="badge-pending"
                  >⏳ รออนุมัติ</span
                >
                <span
                  v-if="emp.assignmentStatus === 'Active'"
                  class="badge-active"
                  >🟢 ทำงานอยู่</span
                >
              </div>
            </td>
            <td>{{ emp.lastName }}</td>
            <td>
              <span
                :style="{
                  color: emp.totalTime >= 50 ? 'orange' : '#16a34a',
                  fontWeight: 'bold',
                }"
              >
                {{ roundTime(emp.totalTime) }}h
              </span>
              <small style="color: #999"> / 60h</small>
            </td>
            <td class="skill-td">
              <span :class="skillCellClass(emp.material)">{{
                getSkillLabel(emp.material)
              }}</span>
            </td>
            <td class="skill-td">
              <span :class="skillCellClass(emp.operation)">{{
                getSkillLabel(emp.operation)
              }}</span>
            </td>
            <td class="skill-td">
              <span :class="skillCellClass(emp.machineSAB1)">{{
                getSkillLabel(emp.machineSAB1)
              }}</span>
            </td>
            <td class="skill-td">
              <span :class="skillCellClass(emp.machineSAB2)">{{
                getSkillLabel(emp.machineSAB2)
              }}</span>
            </td>
            <td class="skill-td">
              <span :class="skillCellClass(emp.machineSAB3)">{{
                getSkillLabel(emp.machineSAB3)
              }}</span>
            </td>
            <td class="skill-td">
              <span :class="skillCellClass(emp.inspection)">{{
                getSkillLabel(emp.inspection)
              }}</span>
            </td>
            <td>
              <button
                class="select-btn"
                :disabled="!!emp.assignmentStatus || !canSelectForThisProcess"
                @click="openSelectionForm(emp)"
                :title="
                  !canSelectForThisProcess
                    ? 'ไม่มีสิทธิ์ Assign Process นี้'
                    : emp.assignmentStatus
                    ? `สถานะ: ${emp.assignmentStatus}`
                    : 'เลือกพนักงาน'
                "
              >
                <img src="select.png" alt="select" class="action-icon" />
              </button>
            </td>
            <td>
              <button
                class="remove-btn"
                :disabled="!emp.assignmentStatus"
                @click="updateEndAt(emp.empID)"
                title="ยกเลิก Assignment"
              >
                <img src="remove.png" alt="remove" class="action-icon" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="legend">
  <button
    v-for="level in [0,1,2,3]"
    :key="level"
    class="legend-btn"
    :class="{ [`active-${level}`]: selectedSkillLevel === level }"
    @click="filterBySkillLevel(level)"
  >
    <span :class="'legend-dot dot-' + level"></span>
    {{ ['Not Trained','Basic','Medium','Expert'][level] }}
  </button>

  <!-- <button class="refresh-skill-btn" @click="selectedSkillLevel = null">
    รีเซต
  </button> -->
</div>

    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>✅ ยืนยันการย้ายพนักงาน</h3>
        <div class="emp-info-box">
          <p>
            <strong>พนักงาน:</strong> {{ modalEmployee.empID }} —
            {{ modalEmployee.firstName }} {{ modalEmployee.lastName }}
          </p>
          <p>
            <strong>Process ปัจจุบัน:</strong> {{ modalEmployee.biz }} /
            {{ modalEmployee.process }}
          </p>
        </div>
        <hr style="margin: 12px 0" />
        <label>Biz ปลายทาง:</label>
        <input
          v-model="modalEmployee.toBiz"
          type="text"
          class="input-field"
          placeholder="ToBiz"
        />
        <label>ย้ายไป Process:</label>
        <input
          v-model="modalEmployee.toProcess"
          type="text"
          class="input-field"
          placeholder="ToProcess"
        />
        <div class="modal-actions">
          <button class="btn-confirm" @click="saveAssignment">ยืนยัน</button>
          <button class="btn-cancel" @click="showModal = false">ยกเลิก</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, watch, onMounted, computed } from "vue";
import axios from "axios";
import jwt_decode from "jwt-decode";

const selectedProcess = inject("selectedProcess", ref(null));
const selectedBiz = inject("selectedBiz", ref(null));
const selectedSkill = inject("selectedSkill", ref(null));
const selectedSkillLevel = ref(null);
const selectedWorkDate = inject("selectedWorkDate", ref(null));
const headcountNeed = inject("headcountNeed", ref(1));
const refreshBarChart = inject("refreshBarChart", () => {});

const props = defineProps({ filters: Object });
const emit = defineEmits(["assignmentChanged"]);

const filterBySkillLevel = (level) => {
  selectedSkillLevel.value =
    selectedSkillLevel.value === level ? null : level;
};

// ✅ JWT claims
const currentUser = computed(() => {
  try {
    return jwt_decode(localStorage.getItem("token") || "");
  } catch {
    return {};
  }
});
const userRole = computed(() => currentUser.value?.role ?? "");
const userBizJwt = computed(() => currentUser.value?.biz ?? "");
const userProcessJwt = computed(() => currentUser.value?.process ?? "");
const isAdmin = computed(() => userRole.value === "Admin");

// ✅ หัวหน้าของ ToProcess/ToBiz เท่านั้นที่เลือกพนักงานได้
const canSelectForThisProcess = computed(() => {
  if (isAdmin.value) return true;
  if (!selectedProcess.value) return false;
  const bizOk = !userBizJwt.value || selectedBiz.value === userBizJwt.value;
  const processOk =
    !userProcessJwt.value || selectedProcess.value === userProcessJwt.value;
  return bizOk && processOk;
});

const skills = ref([]);
const worktime = ref([]);
const activeAssignments = ref([]);
const filteredEmployees = ref([]);
const showModal = ref(false);
const modalEmployee = ref({
  empID: null,
  firstName: "",
  lastName: "",
  biz: "",
  process: "",
  toProcess: "",
  toBiz: "",
  totalSkill: 0,
});
const isAutoAssigning = ref(false);
const autoAssignResult = ref(null);
const faceEntryData = ref([]);

const getSkillLabel = (level) =>
  ["Not Trained", "Basic", "Medium", "Expert"][level] ?? "Unknown";

const skillCellClass = (level) =>
  ["cell-level-0", "cell-level-1", "cell-level-2", "cell-level-3"][level] ?? "";

const getBiz = (o) => o.biz ?? o.Biz ?? "";
const getProcess = (o) => o.process ?? o.Process ?? "";
const isActive = (empID) =>
  activeAssignments.value.some(
    (a) => String(a.empID).trim() === String(empID).trim()
  );
const roundTime = (t) => Math.round((t || 0) * 10) / 10;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH") : "");

const resetFilter = () => {
  filteredEmployees.value = [];
  autoAssignResult.value = null;
  selectedProcess.value = null;
  selectedBiz.value = null;
};

const LEADER_POSITIONS = [
  "supervisor",
  "foreman",
  "section chief",
  "manager",
  "senior engineer",
  "executive director",
  "general manager",
  "assistant general manager",
  "officer",
  "senior officer",
];
const isLeader = (emp) =>
  LEADER_POSITIONS.some((p) => (emp.position || "").toLowerCase().includes(p));

const computeRecommendations = () => {
  if (!selectedProcess.value) {
    filteredEmployees.value = [];
    return;
  }
  const faceMap = new Map(
    (faceEntryData.value || []).map((e) => [String(e.empID), e])
  );
  const wtMap = new Map(
    (worktime.value || []).map((w) => [String(w.empID), w.totalHours])
  );

  filteredEmployees.value = skills.value
    .map((emp) => {
      const fe = faceMap.get(String(emp.empID));
      const ts =
        (emp.material || 0) +
        (emp.operation || 0) +
        (emp.machineSAB1 || 0) +
        (emp.machineSAB2 || 0) +
        (emp.machineSAB3 || 0) +
        (emp.inspection || 0);
      const asgn = activeAssignments.value.find(
        (a) => String(a.empID).trim() === String(emp.empID).trim()
      );
      return {
        ...emp,
        totalSkill: ts,
        totalTime: wtMap.get(String(emp.empID)) || 0,
        faceStatus: fe?.status || null,
        assignmentStatus: asgn?.status || null,
        assignmentID: asgn?.assignmentID || null,
      };
    })
    .filter(
      (emp) =>
        faceEntryData.value.length === 0 ||
        emp.faceStatus === "status-in-cleanroom"
    )
    .filter((emp) => !isLeader(emp))
   .filter((emp) => {
  if (selectedSkillLevel.value === null) return true;

  return [
    emp.material,
    emp.operation,
    emp.machineSAB1,
    emp.machineSAB2,
    emp.machineSAB3,
    emp.inspection,
  ].some((s) => Number(s) === selectedSkillLevel.value);
})
};

const fetchData = async () => {
  try {
    const [skillRes, wtRes, faceRes, activeRes] = await Promise.all([
      axios.get("http://localhost:5000/api/Skill"),
      axios.get("http://localhost:5000/api/EICCControl/latest"),
      axios.get("http://localhost:5000/api/Transactions/GetFaceEntry", {
        params: {
          biz: props.filters?.biz !== "ALL" ? props.filters?.biz : undefined,
        },
      }),
      axios.get("http://localhost:5000/api/Assignment"),
    ]);
    skills.value = skillRes.data || [];
    const raw = faceRes.data;
    faceEntryData.value = Array.isArray(raw) ? raw : raw?.data || [];
    activeAssignments.value = (activeRes.data ?? []).filter(
      (a) => a.status === "Active" || a.status === "Pending"
    );
    const wtMap = new Map(
      (wtRes.data || []).map((w) => [String(w.empID), Number(w.totalHours)])
    );
    worktime.value = skills.value.map((emp) => ({
      empID: emp.empID,
      totalHours: wtMap.get(String(emp.empID)) || 0,
    }));
    computeRecommendations();
  } catch (err) {
    console.error("❌", err);
  }
};

watch(
  () => [selectedProcess.value, selectedWorkDate.value],
  () => fetchData()
);

watch(selectedSkillLevel, () => {
  computeRecommendations();
});

const openSelectionForm = (emp) => {
  if (!canSelectForThisProcess.value) {
    alert("คุณไม่มีสิทธิ์ Assign พนักงานให้ Process นี้");
    return;
  }
  if (emp.assignmentStatus) {
    alert(`พนักงานคนนี้มีสถานะ "${emp.assignmentStatus}" อยู่แล้ว`);
    return;
  }
  const resolvedBiz =
    selectedBiz.value ||
    (props.filters?.biz !== "ALL" ? props.filters.biz : emp.biz || "");
  modalEmployee.value = {
    ...emp,
    biz: emp.biz || "",
    process: emp.process || "",
    toProcess: selectedProcess.value || "",
    toBiz: resolvedBiz,
  };
  showModal.value = true;
};

const saveAssignment = async () => {
  if (!modalEmployee.value.toProcess || !modalEmployee.value.toBiz) {
    alert("กรุณากรอก ToProcess และ ToBiz");
    return;
  }
  const payload = {
    EmpID: modalEmployee.value.empID,
    FromBiz: getBiz(modalEmployee.value),
    FromProcess: getProcess(modalEmployee.value),
    ToProcess: modalEmployee.value.toProcess,
    ToBiz: modalEmployee.value.toBiz,
    SkillGroup: selectedSkill.value || "General",
    StartAt: new Date().toISOString(),
    EndAt: null,
    Status: "Pending",
  };
  try {
    const res = await axios.post(
      "http://localhost:5000/api/Assignment",
      payload
    );
    if (res.status === 200) {
      alert(
        `✅ ส่งคำขอย้าย ${modalEmployee.value.firstName} ${
          modalEmployee.value.lastName
        } \nไป Biz : ${payload.ToBiz} Process : ${
          payload.ToProcess
        }\n(รอหัวหน้า Biz : ${payload.FromBiz || "?"} Process : ${
          payload.FromProcess || "?"
        } อนุมัติ)`
      );
      await axios
        .post("http://localhost:5000/api/Assignment/notify", {
          empID: payload.EmpID,
          fromBiz: payload.FromBiz,
          fromProcess: payload.FromProcess,
          toProcess: payload.ToProcess,
          toBiz: payload.ToBiz,
        })
        .catch((e) => console.warn("Notify failed:", e));
      showModal.value = false;
      await fetchData();
      refreshBarChart();
      emit("assignmentChanged");
    }
  } catch (err) {
    alert("บันทึกไม่สำเร็จ:\n" + (err?.response?.data || err.message));
  }
};

const runAutoAssign = async () => {
  if (!selectedProcess.value || !canSelectForThisProcess.value) return;
  const resolvedBiz =
    selectedBiz.value ||
    (props.filters?.biz !== "ALL" ? props.filters.biz : "");
  if (
    !confirm(
      `Auto-Assign พนักงาน ${headcountNeed.value} คน\nBiz: ${
        resolvedBiz || "(ทั้งหมด)"
      }\nProcess: ${selectedProcess.value}\n\nต้องการดำเนินการ?`
    )
  )
    return;
  isAutoAssigning.value = true;
  autoAssignResult.value = null;
  const workDateStr = selectedWorkDate.value
    ? new Date(selectedWorkDate.value).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  try {
    const res = await axios.post(
      "http://localhost:5000/api/Assignment/auto-assign",
      {
        process: selectedProcess.value,
        toBiz: resolvedBiz,
        skillGroup: selectedSkill.value || "General",
        workDate: workDateStr,
        headcountNeed: headcountNeed.value,
      }
    );
    autoAssignResult.value = res.data;
    await fetchData();
    refreshBarChart();
    emit("assignmentChanged");
  } catch (err) {
    alert("Auto-Assign ไม่สำเร็จ:\n" + (err?.response?.data || err.message));
  } finally {
    isAutoAssigning.value = false;
  }
};

const updateEndAt = async (empID) => {
  try {
    const found = activeAssignments.value.find(
      (a) => String(a.empID) === String(empID)
    );
    if (found?.assignmentID)
      await axios.put(
        `http://localhost:5000/api/Assignment/${found.assignmentID}/status?status=Completed`
      );
    else
      await axios.put(`http://localhost:5000/api/Assignment/${empID}`, {
        EndAt: new Date().toISOString(),
        Status: "Completed",
      });
    alert("✅ ยกเลิก Assignment สำเร็จ");
    await fetchData();
    refreshBarChart();
    emit("assignmentChanged");
  } catch (err) {
    alert("ไม่สามารถยกเลิก Assignment ได้");
  }
};

onMounted(() => {
  fetchData();
  if (window.connection) {
    window.connection.on("EICCUpdated", fetchData);
    window.connection.on("AssignmentUpdated", fetchData);
  }
});
</script>

<style scoped>
.employee-recommendations {
  font-family: Arial, sans-serif;
}
.info-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 8px 12px;
}
.no-permission-bar {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 10px;
  font-size: 16px;
  color: #991b1b;
}
.refresh-skill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s, transform 0.3s;
}
.refresh-skill-btn:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}
.refresh-skill-btn .icon {
  width: 18px;
  height: 18px;
  filter: invert(1);
}
.auto-result-box {
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 10px;
  font-size: 16px;
}
.auto-result-box.ok {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
}
.auto-result-box.warn {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
}
.table-wrapper {
  max-height: 500px;
  overflow: auto;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
}
th,
td {
  padding: 8px 10px;
  text-align: center;
  border: 1px solid #e5e7eb;
}
th {
  background: #f3f4f6;
  font-weight: 600;
}
.empty-msg {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 16px;
}
.row-highlight {
  background: #eff6ff;
}
.row-highlight:hover {
  background: #dbeafe;
}
.row-pending {
  background: #fffbeb !important;
}
.row-pending:hover {
  background: #fef3c7 !important;
}
.row-active-assigned {
  background: #f0fdf4 !important;
}
.row-active-assigned:hover {
  background: #dcfce7 !important;
}
tr:not(.row-highlight):not(.row-pending):not(.row-active-assigned):hover {
  background: #f9fafb;
}
.badge-pending {
  background: #fef3c7;
  color: #92400e;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
}
.badge-active {
  background: #d1fae5;
  color: #065f46;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
}
.skill-td {
  padding: 0 !important;
  height: 1px;
}
.cell-level-0,
.cell-level-1,
.cell-level-2,
.cell-level-3 {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 38px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  box-sizing: border-box;
}
.cell-level-0 { background: #d1d5db; color: #374151; }
.cell-level-1 { background: #ef4444; color: white; }
.cell-level-2 { background: #eab308; color: white; }
.cell-level-3 { background: #16a34a; color: white; }
.legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 12px;
  padding: 6px 0;
}
.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}
.action-icon {
  width: 20px;
  height: 20px;
}
.select-btn,
.remove-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  transition: background 0.2s;
}
.select-btn:hover {
  background: #dcfce7;
}
.remove-btn:hover {
  background: #fee2e2;
}
button[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}
.modal-content {
  background: white;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  animation: fadeIn 0.2s ease-out;
  position: relative;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.btn-confirm {
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
}
.btn-confirm:hover {
  background: #15803d;
}
.btn-cancel {
  background: red;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
}
.btn-cancel:hover {
  background: #890808;
}
.emp-info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.8;
}
.emp-info-box p {
  margin: 0;
}
.input-field {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  margin: 6px 0 12px;
  box-sizing: border-box;
}
.input-field:focus {
  border-color: #3b82f6;
  outline: none;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 4px 12px;
}
.step .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  flex-shrink: 0;
}
.step.active {
  background: #d1fae5;
  color: #065f46;
}
.step.active .dot {
  background: #1D9E75;
}
.step.done {
  background: #e0f2fe;
  color: #0369a1;
}
.step.done .dot {
  background: #38bdf8;
}
.step-arrow {
  color: #9ca3af;
  font-size: 16px;
}
.empty-prompt {
  text-align: center;
  padding: 32px 16px;
  color: #6b7280;
  border: 1.5px dashed #d1d5db;
  border-radius: 12px;
  background: #fafafa;
}
.prompt-icon {
  font-size: 28px;
  margin-bottom: 8px;
  animation: bounce 1.2s infinite;
}

.legend-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1.5px solid #d1d5db;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  color: #374151;
}

.legend-btn:hover {
  transform: scale(1.05);
}

/* active สี */
.active-0 { background: #d1d5db; color:#111; }
.active-1 { background: #ef4444; color:#fff; }
.active-2 { background: #eab308; color:#fff; }
.active-3 { background: #16a34a; color:#fff; }

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot-0 { background:#d1d5db; }
.dot-1 { background:#ef4444; }
.dot-2 { background:#eab308; }
.dot-3 { background:#16a34a; }
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>