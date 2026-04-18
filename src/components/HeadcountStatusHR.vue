<script setup>
import { ref, onMounted, watch, nextTick, inject } from 'vue';
import axios from 'axios';
import Plotly from 'plotly.js';

const props = defineProps({
  filters: Object
});

const emit = defineEmits(['filter-status']);
// const headcountData = ref([]);
const attendanceData = ref([]);
// const transactionsData = ref([]);
const isLoading = ref(false);
const chartRendered = ref(false); // ✅ เพิ่ม flag
const signalRConnection = inject("signalRConnection", null);
let interval = null;

// ✅ ดึงข้อมูล headcount จาก API พร้อม filter
// const fetchHeadcountData = async () => {
//   isLoading.value = true;
//   try {
//     const response = await axios.get('http://16.176.50.155:5000/api/Attendance/ByDate', {
//       params: {
//         division: props.filters.division !== 'ALL' ? props.filters.division : undefined,
//         department: props.filters.department !== 'ALL' ? props.filters.department : undefined,
//         section: props.filters.section !== 'ALL' ? props.filters.section : undefined,
//         biz: props.filters.biz !== 'ALL' ? props.filters.biz : undefined,
//         process: props.filters.process !== 'ALL' ? props.filters.process : undefined,
//       },
//     });

//     headcountData.value = response.data;  // ใช้ข้อมูลจาก Attendance
//   } catch (error) {
//     console.error('Error fetching headcount data:', error);
//   } finally {
//     isLoading.value = false;
//     await nextTick(); // ✅ รอ DOM พร้อม
//     drawChart();
//   } // <-- ปิดปีกกาให้ถูกต้อง
// };

const fetchAttendanceData = async () => {
  try {
    const response = await axios.get(
      'http://16.176.50.155:5000/api/Attendance/ByDate',
      {
        params: {
          division:   props.filters.division   !== 'ALL' ? props.filters.division   : undefined,
          department: props.filters.department !== 'ALL' ? props.filters.department : undefined,
          section:    props.filters.section    !== 'ALL' ? props.filters.section    : undefined,
          biz:        props.filters.biz        !== 'ALL' ? props.filters.biz        : undefined,
          process:    props.filters.process    !== 'ALL' ? props.filters.process    : undefined,
        },
      }
    );

    // ✅ แก้ตรงนี้
    attendanceData.value = response.data.data ?? [];

  } catch (error) {
    console.error('Error fetching attendance data:', error);
    attendanceData.value = [];
  }
};

// const fetchTransactionsData = async () => {
//   try {
//     const response = await axios.get('http://16.176.50.155:5000/api/Transactions/GetFaceEntry', {
//       params: {
//         division: props.filters.division !== 'ALL' ? props.filters.division : undefined,
//         department: props.filters.department !== 'ALL' ? props.filters.department : undefined,
//         section: props.filters.section !== 'ALL' ? props.filters.section : undefined,
//         biz: props.filters.biz !== 'ALL' ? props.filters.biz : undefined,
//         process: props.filters.process !== 'ALL' ? props.filters.process : undefined,
//       },
//     });
//     // ✅ Extract the nested `data` array from the response object
//     transactionsData.value = response.data.data ?? [];
//   } catch (error) {
//     console.error('Error fetching transactions data:', error);
//     transactionsData.value = []; // ✅ Fallback to empty array on error
//   }
// };

// ✅ ดึงข้อมูลทั้งหมด
const fetchHeadcountData = async () => {
  isLoading.value = true;
  try {
    await fetchAttendanceData(); // ✅ ใช้ตัวเดียวพอ
  } finally {
    isLoading.value = false;
    await nextTick();
    setTimeout(() => {
  drawChart();
}, 100);
  }
};

// ✅ ฟังก์ชันวาดกราฟ Pie Chart
// const drawChart = () => {
//   if (!headcountData.value.length) return;

//   const statusCounts = headcountData.value.reduce(
//     (acc, entry) => {
//       acc[entry.status] = (acc[entry.status] || 0) + 1;
//       return acc;
//     },
//     { 'normal': 0, 'late': 0, 'Missing': 0 }
//   );

//   const data = [{
//     labels: ['Normal', 'Late', 'Missing'],
//     values: [
//       statusCounts['normal'],
//       statusCounts['late'],
//       statusCounts['Missing'],
//     ],
//     type: 'pie',
//     marker: {
//       colors: ['#2ECC71', '#F39C12', '#E74C3C'],
//     },
//     textinfo: 'label+percent',
//     hoverinfo: 'label+value+percent',
//   }];

//   const layout = {
//     title: 'Headcount Status',
//     height: 500,
//     width: 500,
//   };

//   Plotly.newPlot('headcount-pie-chart', data, layout);

//   const chart = document.getElementById('headcount-pie-chart');
//   chart.on('plotly_click', (data) => {
//     const clickedLabel = data.points[0].label;
//     console.log('Clicked Label:', clickedLabel); // ตรวจสอบค่าที่คลิก
//     const labelToStatus = {
//       'Normal': 'normal',
//       'Late': 'late',
//       'Missing': 'Missing',
//     };
//     emit('filter-status', labelToStatus[clickedLabel]); // ส่งค่ากลับไปที่ตาราง
//   });
// };

// ✅ แก้ drawChart() ใน HeadcountStatusHR.vue
const drawChart = () => {
  if (!attendanceData.value.length) return;

  const chartEl = document.getElementById('headcount-pie-chart');
  if (!chartEl) return;

  const normal = attendanceData.value.filter(e => e.status?.toLowerCase().trim() === 'normal').length;
  const late = attendanceData.value.filter(e => e.status?.toLowerCase().trim() === 'late').length;
  const absent = attendanceData.value.filter(e => e.status?.toLowerCase().trim() === 'absent').length;

  if (normal + absent === 0) return;

  Plotly.newPlot(chartEl, [{
    // title: 'HeadCount Status',
    labels: ['Normal', 'Late', 'Absent'],
    values: [normal, late, absent],
    type: 'pie',
    marker: { colors: ['#2ECC71','#ffcc00', '#E74C3C'] },
    textinfo: 'label+percent',
    hoverinfo: 'label+value+percent',
  }], {
    // ✅ เพิ่ม title พร้อม workDate เหมือน MFG
    // title: `Headcount Status${workDate.value ? ' (' + workDate.value + ')' : ''}`,
    height: 500,   // ✅ ขยายให้ใหญ่เท่า MFG
    width: 500,
    paper_bgcolor: 'rgba(0,0,0,0)',
  }, { displayModeBar: false });

  chartEl.on('plotly_click', (eventData) => {
    if (!eventData.points?.length) return;
    const labelMap = { 'Normal': 'normal', 'Late': 'late', 'Absent': 'absent' };
    const status = labelMap[eventData.points[0].label];
    if (status) emit('filter-status', status);
  });
};

let fetchTimeout = null;

watch(
  () => props.filters,
  async () => {
    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(async () => {
      await fetchHeadcountData();
    }, 300);
  },
  { deep: true }
);

watch(signalRConnection, (conn, oldConn) => {
  if (oldConn) {
    oldConn.off("HeadcountUpdated", fetchHeadcountData);
  }

  if (conn) {
    conn.off("HeadcountUpdated", fetchHeadcountData);
    conn.on("HeadcountUpdated", fetchHeadcountData);
  }
}, { immediate: true });

// ✅ เริ่มต้น mount component -> fetch data และวาด chart
onMounted(async () => {
  await fetchHeadcountData();

  // ✅ auto refresh ทุก 10 วินาที
  interval = setInterval(() => {
    fetchHeadcountData();
  }, 10000);
});
</script>

<template>
  <div class="headcount-status-container">

    <!-- ✅ เพิ่ม header เหมือน MFG -->
    <h3>
      Headcount Status
      <span v-if="workDate" class="workdate">({{ workDate }})</span>
    </h3>

    <div
      id="headcount-pie-chart"
      v-show="!isLoading && attendanceData.length > 0"
    ></div>

    <div v-if="isLoading" class="loading">Loading chart...</div>
    <div v-else-if="attendanceData.length === 0" class="loading">ไม่พบข้อมูล</div>

  </div>
</template>

<style scoped>
.headcount-status-container {
  width: 100%;
}

#headcount-pie-chart {
  width: 100%;
  max-width: 500px;
  margin: auto;
}

h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.workdate {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
}

.loading {
  text-align: center;
  font-weight: bold;
  color: #888;
  padding: 20px;
}
</style>