<template>
  <div>
    <div class="filter-bar">
      <label>Year:</label>
      <select v-model="selectedYear" @change="fetchAbsentData">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>

      <label>Month:</label>
      <select v-model="selectedMonth" @change="fetchAbsentData">
        <option v-for="(m, i) in months" :key="i" :value="i + 1">{{ m }}</option>
      </select>
    </div>

    <div v-if="loading" class="no-data">⏳ กำลังโหลด...</div>
    <div v-else-if="hasData" class="chart-scroll-wrapper">
      <div id="monthly-absent-summary"></div>
    </div>
    <div v-else class="no-data">ไม่พบข้อมูล</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import Plotly from 'plotly.js';

const props = defineProps({ filters: Object });

const now = new Date();
const selectedMonth = ref(now.getMonth() + 1);
const selectedYear = ref(now.getFullYear());

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const years = ref([now.getFullYear()]); // ✅ default ปีปัจจุบันก่อน ไม่ให้ว่าง
const hasData = ref(false);
const loading = ref(false);

const fetchAbsentData = async () => {
  loading.value = true;
  hasData.value = false;

  try {
    const res = await axios.get('http://16.176.50.155:5000/api/Attendance', {
      params: {
        division:   props.filters?.division   !== 'ALL' ? props.filters.division   : undefined,
        department: props.filters?.department !== 'ALL' ? props.filters.department : undefined,
        section:    props.filters?.section    !== 'ALL' ? props.filters.section    : undefined,
        biz:        props.filters?.biz        !== 'ALL' ? props.filters.biz        : undefined,
        process:    props.filters?.process    !== 'ALL' ? props.filters.process    : undefined,
        status: 'Absent',
        year: selectedYear.value,
        month: selectedMonth.value,
      },
    });

    const records = res.data || [];

    // 🔹 นับจำนวนวันขาดงานต่อคน
    const counts = {};
    records.forEach(emp => {
      const key = emp.empID;
      if (!counts[key]) {
        counts[key] = {
          name: `${emp.firstName} ${emp.lastName}`,
          count: 0
        };
      }
      counts[key].count++;
    });

    const summary = Object.values(counts)
      .sort((a, b) => b.count - a.count);

    hasData.value = summary.length > 0;
    loading.value = false;

    await nextTick();

    const el = document.getElementById('monthly-absent-summary');
    if (!el || !hasData.value) return;

    const data = [{
      x: summary.map(i => i.count),
      y: summary.map(i => i.name),
      type: 'bar',
      orientation: 'h',
      marker: {
        color: '#ef4444' // 🔥 แดงนุ่มขึ้น
      },
      text: summary.map(i => `${i.count} วัน`),
      textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>ขาดงาน: %{x} วัน<extra></extra>',
    }];

    const layout = {
      title: {
        text: `จำนวนวันขาดงานรายบุคคล (${months[selectedMonth.value - 1]} ${selectedYear.value})`,
        font: { size: 18 }
      },
      xaxis: {
        title: 'จำนวนวัน (Days)',
        dtick: 1,
        gridcolor: '#eee'
      },
      yaxis: {
        automargin: true,
        autorange: 'reversed'
      },
      margin: { l: 180, r: 40, t: 60, b: 50 },
      height: Math.max(350, summary.length * 35),
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#fafafa',
    };

    // 🔥 ใช้ react แทน newPlot (ลื่นกว่า)
    Plotly.react(el, data, layout, { displayModeBar: false });

  } catch (err) {
    console.error('❌ Error fetching absent data:', err);
    loading.value = false;
  }
};

// เพิ่มฟังก์ชันนี้
const fetchYears = async () => {
  try {
    const res = await axios.get('http://16.176.50.155:5000/api/Attendance/AbsentYears');
    const data = res.data || [];
    years.value = data.length > 0 ? data : [new Date().getFullYear()];
  } catch (err) {
    console.error('❌ Error fetching years:', err);
    years.value = [new Date().getFullYear()];
  }
};

// ✅ ดึงเดือน/ปีล่าสุดที่มี Absent ใน DB
const fetchLatestMonthYear = async () => {
  try {
    const res = await axios.get('http://16.176.50.155:5000/api/Attendance/AbsentLatest');
    if (res.data) {
      selectedYear.value  = res.data.year;
      selectedMonth.value = res.data.month;
    }
  } catch (err) {
    console.error('❌ Error fetching latest month/year:', err);
    // fallback ใช้ปัจจุบัน
  }
};

onMounted(async () => {
  await fetchYears();
  await fetchLatestMonthYear(); // ✅ set เดือน/ปีล่าสุดก่อน
  await fetchAbsentData();
});

// แก้ watch ให้ reload years ด้วยเมื่อ filter เปลี่ยน
watch(() => props.filters, async () => {
  await fetchYears();
  await fetchLatestMonthYear();
  await fetchAbsentData();
}, { deep: true });

// onMounted(() => {
//   fetchAbsentData();
// });

// watch(() => props.filters, fetchAbsentData, { deep: true });
// </script>

<style scoped>
#monthly-absent-summary { width: 100%; }
.filter-bar {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-bar select {
  padding: 4px 8px;
  border-radius: 4px;
}
.no-data {
  text-align: center;
  padding: 20px;
  color: #888;
  font-weight: bold;
}
.chart-scroll-wrapper {
  height: 450px;        /* ✅ ความสูงคงที่ */
  overflow-y: auto;     /* ✅ scroll ได้ */
  overflow-x: hidden;
}

#monthly-absent-summary { 
  width: 100%; 
}
</style>