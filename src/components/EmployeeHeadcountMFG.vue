<script setup>
import { ref, onMounted, computed, watch, inject } from "vue";
import axios from "axios";

const props = defineProps({
  filterStatus: String,
  filters: Object,
});

const emit = defineEmits(["clear-status"]);

const employees = ref([]);
const workDate = ref(null);
const isLoading = ref(false);
const signalRConnection = inject("signalRConnection", null);
let interval = null;

// ===============================
// Fetch Employees
// ===============================
const fetchEmployees = async () => {
  isLoading.value = true;

  try {

    const response = await axios.get(
      "http://localhost:5000/api/Transactions/GetFaceEntry",
      {
        params: {
          division:
            props.filters.division !== "ALL"
              ? props.filters.division
              : undefined,

          department:
            props.filters.department !== "ALL"
              ? props.filters.department
              : undefined,

          section:
            props.filters.section !== "ALL"
              ? props.filters.section
              : undefined,

          biz:
            props.filters.biz !== "ALL"
              ? props.filters.biz
              : undefined,

          process:
            props.filters.process !== "ALL"
              ? props.filters.process
              : undefined,

          // shiftOverride: "B"
        }
      }
    );

    const apiData = response.data;

    workDate.value = apiData.workDate || apiData.selectedDate;
    employees.value = apiData.data;

    console.log("✅ Employees:", employees.value.length);
    console.log("📅 WorkDate:", workDate.value);

  } catch (error) {
    console.error("❌ Error fetching employees:", error);
  } finally {
    isLoading.value = false;
  }
};

// ===============================
// Watch filters
// ===============================
watch(
  () => props.filters,
  () => {
    fetchEmployees();
    emit("clear-status");
  },
  { deep: true }
);

// ===============================
// Watch status filter
// ===============================
watch(
  () => props.filterStatus,
  (newStatus, oldStatus) => {
    console.log("🔍 Filter changed:", oldStatus, "→", newStatus);
  }
);

watch(signalRConnection, (conn, oldConn) => {
  if (oldConn) {
    oldConn.off("HeadcountUpdated", fetchEmployees);
  }

  if (conn) {
    conn.off("HeadcountUpdated", fetchEmployees);
    conn.on("HeadcountUpdated", fetchEmployees);
  }
}, { immediate: true });

// ===============================
// Filter by Status
// ===============================
const filteredEmployees = computed(() => {

  if (!props.filterStatus) {
    return employees.value;
  }

  return employees.value.filter(
    (e) => e.status === props.filterStatus
  );

});

// ===============================
// Sort by status priority
// ===============================
const sortedEmployees = computed(() => {

  const rank = {
    "status-missing": 0,
    "status-out-cleanroom": 1,
    "status-in-cleanroom": 2,
    "status-get-off": 3,
  };

  return [...filteredEmployees.value].sort((a, b) => {

    const rA = rank[a.status] ?? 99;
    const rB = rank[b.status] ?? 99;

    return rA - rB;

  });

});

// ===============================
// Reset Filter
// ===============================
const resetFilter = () => {

  emit("clear-status");

  fetchEmployees();

};

// ===============================
// Status Style
// ===============================
const getStatusClass = (status) => {

  return {
    "status-in-cleanroom": "status-in-cleanroom",
    "status-out-cleanroom": "status-out-cleanroom",
    "status-missing": "status-missing",
    "status-get-off": "status-get-off",
  }[status] || "";

};

// ===============================
// Status Label
// ===============================
const getStatusLabel = (status) => {

  return {
    "status-in-cleanroom": "In Cleanroom",
    "status-out-cleanroom": "Out Cleanroom",
    "status-missing": "Missing",
    "status-get-off": "Get Off",
  }[status] || status;

};

// ===============================
onMounted(async () => {
  await fetchEmployees();

  // ✅ auto refresh ทุก 10 วินาที
  interval = setInterval(() => {
    fetchEmployees();
  }, 10000);
});
</script>

<template>

  <div class="employee-table">

    <div v-if="isLoading" class="loading">
      Loading employee data...
    </div>

    <div v-else class="table-scroll">

      <h3>
        Head Count
        <span v-if="workDate" class="workdate">
          ({{ workDate }})
        </span>
      </h3>

      <button
        class="refresh-skill-btn"
        @click="resetFilter"
        title="Refresh"
      >
        <img src="refresh.png" alt="Refresh" class="icon" />
        <span>Refresh</span>
      </button>

      <table>

        <thead>
          <tr>
            <th>EmpID</th>
            <th>Firstname</th>
            <th>Lastname</th>
            <th class="datetime-column">Check in time</th>
            <th class="datetime-column">Check out time</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          <tr
            v-for="(employee, index) in sortedEmployees"
            :key="index"
          >
            <td>{{ employee.empID }}</td>

            <td>{{ employee.firstName }}</td>

            <td>{{ employee.lastName }}</td>

            <td class="datetime-column">
              {{ employee.entryDateTime || "-" }}
            </td>

            <td class="datetime-column">
              {{ employee.exitDateTime || "-" }}
            </td>

            <td :class="getStatusClass(employee.status)">
              {{ getStatusLabel(employee.status) }}
            </td>

          </tr>

        </tbody>

      </table>

    </div>

  </div>

</template>

<style scoped>

.employee-table {
  margin-top: 20px;
}

.loading {
  text-align: center;
  font-weight: bold;
  color: #888;
  padding: 20px;
}

.table-scroll {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px;
  text-align: center;
  border: 1px solid #ddd;
}

th {
  background-color: #f4f4f4;
}

.status-in-cleanroom {
  color: green;
  font-weight: bold;
}

.status-out-cleanroom {
  color: orange;
  font-weight: bold;
}

.status-missing {
  color: red;
  font-weight: bold;
}

.status-get-off {
  color: blue;
  font-weight: bold;
}

.datetime-column {
  white-space: nowrap;
}

.refresh-skill-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 6px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  font-weight: bold;
}

.refresh-skill-btn:hover {
  background-color: #0056b3;
}

.icon {
  width: 18px;
  height: 18px;
  filter: invert(1);
}

.workdate {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
}

</style>