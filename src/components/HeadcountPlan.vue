<template>
  <div id="headcount-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import Plotly from 'plotly.js';

// ✅ รับ props filters
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
});

const headcountData = ref([]);

const fetchData = async () => {
  try {
    const response = await axios.get("http://16.176.50.155:5000/api/ManpowerPlan");
    headcountData.value = response.data;
    await nextTick();
    drawChart();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const drawChart = () => {
  if (!headcountData.value.length) return;

  // ✅ Group รายเดือน เอาค่า average
  const monthGroups = {};
  headcountData.value.forEach(item => {
    const monthKey = item.date?.substring(0, 7); // "2025-08"
    if (!monthKey) return;

    if (!monthGroups[monthKey]) monthGroups[monthKey] = { planned: [], actual: [] };
    monthGroups[monthKey].planned.push(item.plannedHeadcount || 0);
    monthGroups[monthKey].actual.push(item.actualHeadcount || 0);
  });

  // const avg = (arr) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
  const sum = (arr) => arr.reduce((s, v) => s + v, 0);

  const sortedMonths = Object.keys(monthGroups).sort();

  // ✅ Format เดือนให้อ่านง่าย "Aug 2025"
  const formattedMonths = sortedMonths.map(m => {
    const date = new Date(m + '-01');
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  });

  // const planned = sortedMonths.map(m => avg(monthGroups[m].planned));
  // const actual  = sortedMonths.map(m => avg(monthGroups[m].actual));
  const planned = sortedMonths.map(m => sum(monthGroups[m].planned));
const actual  = sortedMonths.map(m => sum(monthGroups[m].actual));

  // ✅ สีแท่ง actual ตามว่าต่ำกว่า/สูงกว่า planned
  const actualColors = sortedMonths.map((m, i) =>
    actual[i] >= planned[i] ? '#10b981' : '#ef4444'
  );

  const chartData = [
    {
      x: formattedMonths, y: planned,
      type: 'bar', name: 'Planned',
      marker: { color: '#3b82f6' },
      text: planned.map(v => `${v} คน`), textposition: 'auto',
    },
    {
      x: formattedMonths, y: actual,
      type: 'bar', name: 'Actual',
      marker: { color: actualColors },
      text: actual.map(v => `${v} คน`), textposition: 'auto',
    },
  ];

  const layout = {
    title: 'Headcount Plan vs Actual รายเดือน',
    barmode: 'group',
    xaxis: { title: 'เดือน', tickangle: -45, automargin: true },
    yaxis: { title: 'จำนวนพนักงาน (คน)', rangemode: 'tozero', autorange: true },
    plot_bgcolor: '#f9f9f9',
    paper_bgcolor: '#fff',
    margin: { l: 60, r: 20, t: 60, b: 100 },
    height: 420,
    legend: { orientation: 'h', y: -0.25 },
    // ✅ annotation อธิบายสี
    annotations: [{
      xref: 'paper', yref: 'paper',
      x: 1, y: -0.3,
      text: '🟢 Actual ≥ Planned  🔴 Actual < Planned',
      showarrow: false,
      font: { size: 11, color: '#666' },
      xanchor: 'right',
    }],
  };

  Plotly.react('headcount-chart', chartData, layout, {
  displayModeBar: false
}, { responsive: true });
};

// ✅ lifecycle
onMounted(fetchData);

// ✅ watch filter เปลี่ยน → re-fetch ข้อมูลใหม่
watch(() => props.filters, async () => {
  await fetchData();
}, { deep: true });
</script>

<style scoped>
#headcount-chart {
  width: 100%;
  height: 100%;
}
</style>
