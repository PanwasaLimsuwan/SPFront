<template>
  <div class="chart-wrapper">
    <!-- ✅ ให้ element มีอยู่ตลอด แค่ซ่อนด้วย CSS -->
    <div v-show="loading" class="loading">⏳ Loading...</div>
    <div v-show="errorMessage && !loading" class="error-message">
      ❌ {{ errorMessage }}
    </div>
    <div v-show="!hasData && !loading && !errorMessage" class="no-data">
      No overload data to display
    </div>
    <!-- ✅ element นี้มีอยู่ตลอด เพื่อให้ Plotly ใช้ได้ -->
    <div 
      id="monthly-overload-chart" 
      :style="{ display: hasData && !loading ? 'block' : 'none' }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import Plotly from 'plotly.js';
import axios from 'axios';

// ✅ รับ props filter
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
});

const months = ref([]);
const overloads = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const hasData = ref(false);

// ✅ สร้าง params สำหรับ API
const buildParams = () => {
  const params = {};
  
  if (props.filters?.division && props.filters.division !== 'ALL') {
    params.division = props.filters.division;
  }
  if (props.filters?.department && props.filters.department !== 'ALL') {
    params.department = props.filters.department;
  }
  if (props.filters?.section && props.filters.section !== 'ALL') {
    params.section = props.filters.section;
  }
  if (props.filters?.biz && props.filters.biz !== 'ALL') {
    params.biz = props.filters.biz;
  }
  if (props.filters?.process && props.filters.process !== 'ALL') {
    params.process = props.filters.process;
  }
  
  return params;
};

const fetchWorkTimeData = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';
    hasData.value = false;
    
    console.log('=== Fetching Monthly Overload Data ===');
    
    const params = buildParams();
    console.log('Request params:', params);
    
    const response = await axios.get('http://localhost:5000/api/EICCControl', { params });

    console.log('Response data count:', response.data.length);

    if (!response.data || response.data.length === 0) {
      console.warn('⚠️ No data returned');
      months.value = [];
      overloads.value = [];
      errorMessage.value = 'No data available from API';
      return;
    }

    const data = response.data;
    console.log('Sample data:', data.slice(0, 2));

    // ✅ Group ข้อมูลตาม monthYear และ empID
    const monthlyData = {};

    const validStatuses = ['Active', 'Complete'];
    
    data.forEach(entry => {
      // ✅ กรองเฉพาะ Active/Complete
      if (!validStatuses.includes(entry.status)) return;

      const monthKey = entry.monthYear;
      if (!monthKey) return;

      const empID = entry.empID;
      
      // ✅ แปลงเป็น Number
      const worked = entry.totalHours ? Number(entry.totalHours) : 0;
      const ot = entry.totalOT ? Number(entry.totalOT) : 0;
      const total = worked + ot;

      if (!monthlyData[monthKey]) monthlyData[monthKey] = {};
      if (!monthlyData[monthKey][empID]) monthlyData[monthKey][empID] = 0;

      monthlyData[monthKey][empID] += total;
    });

    console.log('Monthly data grouped:', Object.keys(monthlyData).length, 'months');

    if (Object.keys(monthlyData).length === 0) {
      errorMessage.value = 'No Active/Complete records found';
      return;
    }

    // ✅ คำนวณ overload (เกิน 240 ชั่วโมง/เดือน)
    const monthlyOverload = {};
    for (const month in monthlyData) {
      let overloadSum = 0;
      let employeeCount = 0;
      
      for (const empID in monthlyData[month]) {
        const total = monthlyData[month][empID];
        const overload = total > 240 ? total - 240 : 0;
        overloadSum += overload;
        if (overload > 0) employeeCount++;
      }
      
      monthlyOverload[month] = {
        overload: overloadSum,
        employees: employeeCount
      };
    }

    console.log('Monthly overload:', monthlyOverload);

    // ✅ เรียงเดือนตามลำดับ
    const sortedMonths = Object.keys(monthlyOverload).sort();
    
    months.value = sortedMonths;
    overloads.value = sortedMonths.map(m => monthlyOverload[m].overload);

    // ✅ ตรวจสอบว่ามี overload หรือไม่
    const totalOverload = overloads.value.reduce((sum, v) => sum + v, 0);
    hasData.value = totalOverload > 0;

    console.log('Total overload:', totalOverload);
    console.log('Has data:', hasData.value);

    if (hasData.value) {
      await nextTick();
      drawChart(monthlyOverload);
    } else {
      console.log('⚠️ No overload data found (all employees under 240 hrs/month)');
    }

  } catch (error) {
    console.error('❌ Error fetching data:', error);
    console.error('Error response:', error.response?.data);
    errorMessage.value = `Failed to load data: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

const drawChart = (monthlyOverload) => {
  console.log('=== Drawing Chart ===');
  
  // ✅ ตรวจสอบว่า element มีอยู่หรือไม่
  const chartElement = document.getElementById('monthly-overload-chart');
  if (!chartElement) {
    console.error('❌ Chart element not found!');
    errorMessage.value = 'Chart element not found';
    return;
  }
  
  // ✅ Format เดือนให้อ่านง่าย (เช่น 2024-03 -> Mar 2024)
  const formattedMonths = months.value.map(m => {
    try {
      const date = new Date(m + '-01');
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return m;
    }
  });

  // ✅ สร้าง hover text ที่มีรายละเอียด
  const hoverText = months.value.map(m => {
    const data = monthlyOverload[m];
    return `Month: ${m}<br>Overload: ${data.overload.toFixed(1)} hrs<br>Employees: ${data.employees}`;
  });

  const trace = {
    x: formattedMonths,
    y: overloads.value,
    type: 'bar',
    name: 'Monthly Overload',
    marker: { 
      color: overloads.value.map(v => {
        if (v >= 500) return '#c62828'; // Dark red
        if (v >= 200) return '#f44336'; // Red
        if (v >= 50) return '#ff9800';  // Orange
        return '#4caf50'; // Green
      })
    },
    text: overloads.value.map(v => v.toFixed(1) + ' hrs'),
    textposition: 'auto',
    hovertext: hoverText,
    hoverinfo: 'text',
  };

  const layout = {
    title: 'Monthly Overload (Over 240 Hours/Month per Employee)',
    xaxis: { 
      title: 'Month',
      tickangle: -45,
    },
    yaxis: { 
      title: 'Total Overload Hours',
      rangemode: 'tozero',
    },
    margin: { l: 60, r: 30, t: 50, b: 100 },
    plot_bgcolor: '#f9f9f9',
    paper_bgcolor: '#fff',
    height: 450,
    showlegend: false,
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
  };

  try {
    Plotly.newPlot('monthly-overload-chart', [trace], layout, config);
    console.log('✅ Chart rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering chart:', error);
    errorMessage.value = 'Failed to render chart';
  }
};

// ✅ Lifecycle
onMounted(() => {
  console.log('Component mounted');
  console.log('Initial filters:', props.filters);
  fetchWorkTimeData();
});

// ✅ watch filter → reload data + update chart
watch(() => props.filters, async () => {
  console.log('Filters changed:', props.filters);
  await fetchWorkTimeData();
}, { deep: true });
</script>

<style scoped>


#monthly-overload-chart {
  width: 100%;
  height: 100%;
}

.loading {
  text-align: center;
  padding: 150px 0;
  color: #666;
  font-size: 16px;
  font-style: italic;
}

.error-message {
  text-align: center;
  padding: 150px 20px;
  color: #c62828;
  font-size: 16px;
}

.no-data {
  text-align: center;
  color: #999;
  font-size: 16px;
  padding: 150px 0;
}
</style>