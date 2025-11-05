<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  filterStatus: String,
  filters: Object
});
const emit = defineEmits(['clear-status']);

// const employees = ref([]);
const attendanceData = ref([]);
const transactionsData = ref([]);
const isLoading = ref(false);

// ✅ Fetch พร้อมใช้ filters
// const fetchEmployees = async () => {
//   isLoading.value = true;
//   try {
//     const response = await axios.get('http://localhost:5000/api/Attendance/ByDate', {
//       params: {
//         division: props.filters.division !== 'ALL' ? props.filters.division : undefined,
//         department: props.filters.department !== 'ALL' ? props.filters.department : undefined,
//         section: props.filters.section !== 'ALL' ? props.filters.section : undefined,
//         biz: props.filters.biz !== 'ALL' ? props.filters.biz : undefined,
//         process: props.filters.process !== 'ALL' ? props.filters.process : undefined,
//       },
//     });
//     employees.value = response.data;
//   } catch (error) {
//     console.error('Error fetching attendance data:', error);
//   } finally {
//     isLoading.value = false;
//   }
// };

// ✅ ดึงข้อมูลจาก Attendance (Normal, Late)
const fetchAttendanceData = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/Attendance/ByDate', {
      params: {
        division: props.filters.division !== 'ALL' ? props.filters.division : undefined,
        department: props.filters.department !== 'ALL' ? props.filters.department : undefined,
        section: props.filters.section !== 'ALL' ? props.filters.section : undefined,
        biz: props.filters.biz !== 'ALL' ? props.filters.biz : undefined,
        process: props.filters.process !== 'ALL' ? props.filters.process : undefined,
      },
    });
    attendanceData.value = response.data;
  } catch (error) {
    console.error('Error fetching attendance data:', error);
  }
};

// ✅ ดึงข้อมูลจาก Transactions (Missing)
const fetchTransactionsData = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/Transactions/GetFaceEntry', {
      params: {
        division: props.filters.division !== 'ALL' ? props.filters.division : undefined,
        department: props.filters.department !== 'ALL' ? props.filters.department : undefined,
        section: props.filters.section !== 'ALL' ? props.filters.section : undefined,
        biz: props.filters.biz !== 'ALL' ? props.filters.biz : undefined,
        process: props.filters.process !== 'ALL' ? props.filters.process : undefined,
      },
    });
    transactionsData.value = response.data;
  } catch (error) {
    console.error('Error fetching transactions data:', error);
  }
};

// ✅ Fetch ข้อมูลทั้งหมด
const fetchEmployees = async () => {
  isLoading.value = true;
  try {
    await Promise.all([fetchAttendanceData(), fetchTransactionsData()]);
  } catch (error) {
    console.error('Error fetching employee data:', error);
  } finally {
    isLoading.value = false;
  }
};

// // ✅ watch filters แล้ว refetch และ reset filterStatus
watch(() => props.filters, () => {
  fetchEmployees();
  emit('clear-status');
}, { deep: true });

// ✅ รวมข้อมูลจากทั้ง 2 API
const allEmployees = computed(() => {
  // ข้อมูลจาก Attendance (normal, late)
  const attendanceEmployees = attendanceData.value.filter(
    e => e.status === 'normal' || e.status === 'late'
  );
  
  // ข้อมูลจาก Transactions (Missing)
  const missingEmployees = transactionsData.value.filter(
    e => e.status === 'status-missing'
  );
  
  // รวมข้อมูลทั้งหมด
  return [...attendanceEmployees, ...missingEmployees];
});

// ✅ filter ตาม status ที่กด Pie chart
// const filteredEmployees = computed(() => {
//   console.log('Filter Status:', props.filterStatus); // ตรวจสอบค่าที่รับมาจากกราฟ
//   if (!props.filterStatus) return employees.value;
//   return employees.value.filter(e => e.status.toLowerCase() === props.filterStatus.toLowerCase());  // กรองตาม status
// });
const filteredEmployees = computed(() => {
  // console.log('Filter Status:', props.filterStatus);
  if (!props.filterStatus) return allEmployees.value;
  return allEmployees.value.filter(e => e.status.toLowerCase() === props.filterStatus.toLowerCase());
});

// ✅ sorted ให้เรียง status ตามลำดับ
const sortedEmployees = computed(() => {
  const rank = {
    'status-missing': 0,
    'late': 1,
    'normal': 2,
  };

  return [...filteredEmployees.value].sort((a, b) => {
    const rA = rank[a.status] ?? 99;
    const rB = rank[b.status] ?? 99;
    return rA - rB;
  });
});

// ✅ reset filterStatus
const resetFilter = () => {
  emit('clear-status');
};

// ✅ class status
const getStatusClass = (status) => {
  return {
    'normal': 'status-normal',
    'late': 'status-late',
    'status-missing': 'status-missing',
  }[status] || '';
};

// ✅ label status
const getStatusLabel = (status) => {
  return {
    'normal': 'Normal',
    'late': 'Late',
    'status-missing': 'Missing',
  }[status] || status;
};

onMounted(() => {
  fetchEmployees();
});
</script>

<template>
  <div class="employee-table">
    <div v-if="isLoading" class="loading">Loading employee data...</div>
    <div v-else class="table-scroll">
      <h3>Head Count</h3>
      <button class="refresh-skill-btn" @click="resetFilter" title="รีเซตฟิลเตอร์">
        <img src="refresh.png" alt="Refresh Icon" class="icon" />
        <span>Refresh</span>
      </button>
      <table>
        <thead>
          <tr>
            <th>EmpID</th>
            <th>Firstname</th>
            <th>Lastname</th>
            <th>Date</th>
            <th class="datetime-column">Check in time</th>
            <th class="datetime-column">Check out time</th>
            <!-- <th>Gate No</th> -->
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(employee, index) in sortedEmployees" :key="index">
            <td>{{ employee.empID }}</td>
            <td>{{ employee.firstName }}</td>
            <td>{{ employee.lastName }}</td>
            <!-- แสดงเวลา Check In, ถ้าไม่มีให้แสดงเป็น '-' -->
            <td>{{ employee.date }}</td>
            <td class="datetime-column">{{ employee.checkInTime || '-' }}</td>
            <td class="datetime-column">{{ employee.checkOutTime || '-' }}</td>
            <!-- <td>{{ employee.gateNo || '-' }}</td> -->
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
.refresh-skill-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 6px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease, transform 0.3s ease;
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

.status-normal {
  color: green;
  font-weight: bold;
}

.status-late {
  color: orange;
  font-weight: bold;
}

.status-missing {
  color: red;
  font-weight: bold;
}

.datetime-column {
  white-space: nowrap;
}
</style>
