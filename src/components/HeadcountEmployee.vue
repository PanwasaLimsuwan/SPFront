<template>
  <div class="headcount-container">
    <div class="chart-selector">
      <select v-model="selectedGroup" @change="drawChart">
        <option value="biz">Head Count by Biz</option>
        <option value="process">Head Count by Process</option>
      </select>
    </div>
    <div ref="chartRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import Plotly from 'plotly.js';

const emit = defineEmits(['filter']);
const selectedGroup = ref('biz');
const employees = ref([]);
const chartRef = ref(null); // ✅ ใช้ ref แทน id เพื่อกัน conflict กรณีมีหลาย widget

onMounted(fetchData);
watch(selectedGroup, drawChart);

async function fetchData() {
  try {
    const res = await axios.get('http://localhost:5000/api/Attendance/ByDate');
    employees.value = Array.isArray(res.data.data) ? res.data.data : [];
    drawChart();
  } catch (err) {
    console.error('❌ Error fetching data:', err);
    employees.value = [];
    drawChart();
  }
}

function drawChart() {
  if (!chartRef.value) return;

  const groupBy = selectedGroup.value;
  const counts = groupData(employees.value, groupBy);

  if (Object.keys(counts).length === 0) {
    Plotly.purge(chartRef.value);
    return;
  }

  const chartData = [{
    values: Object.values(counts),
    labels: Object.keys(counts),
    type: 'pie',
    textinfo: 'label+percent',
    textposition: 'inside',       // ✅ ข้อความอยู่ในกราฟ ไม่ล้น
    insidetextorientation: 'radial',
    hole: 0.3,                    // ✅ donut style อ่านง่ายขึ้น
  }];

  const layout = {
    title: `Head Count by ${capitalize(groupBy)}`,
    height: 420,
    paper_bgcolor: 'rgba(0,0,0,0)',
    legend: {
      orientation: 'v',
      x: 1.05,
      y: 0.5,
      font: { size: 11 },
    },
    margin: { t: 50, b: 20, l: 20, r: 150 }, // ✅ เพิ่มที่ขวาให้ legend
  };

  Plotly.react(chartRef.value, chartData, layout, { displayModeBar: false })
    .then(() => {
      chartRef.value.on('plotly_click', (eventData) => {
        if (eventData.points?.length) {
          emit('filter', { groupBy, value: eventData.points[0].label });
        }
      });
    });
}

function groupData(data, key) {
  return data.reduce((acc, emp) => {
    const k = emp[key] || 'undefined';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
</script>

<style scoped>
.headcount-container { width: 100%; }
.chart-selector { margin-bottom: 12px; }
</style>