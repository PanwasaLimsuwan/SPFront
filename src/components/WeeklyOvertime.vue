<template>
  <div id="worktime-chart-container">
    <div class="filter-bar">
      <label for="week-select">Select Week:</label>
      <select 
        id="week-select" 
        v-model="selectedWeek" 
        @change="updateChart"
        :disabled="loading || weekOptions.length === 0"
      >
        <option v-if="weekOptions.length === 0" value="">No weeks available</option>
        <option v-for="week in weekOptions" :key="week" :value="week">
          Week {{ week }}
        </option>
      </select>
      <span v-if="loading" class="loading-text">⏳ Loading...</span>
    </div>
    
    <div class="chart-container">
    <div v-if="hasData" id="worktime-chart"></div>
    <div v-else class="no-data">
      {{ errorMessage || 'No data to display' }}
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import Plotly from 'plotly.js';

const props = defineProps({ 
  filters: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['filter']);

const workTimeData = ref([]);
const hasData = ref(true);
const weekOptions = ref([]);
const selectedWeek = ref(null);
const loading = ref(false);
const errorMessage = ref('');

// ✅ กำหนดสีตามชื่อ process
const colorMapping = {
  'ASSY': '#FF5733',    // สีแดง
  'MOKU': '#33FF57',    // สีเขียว
  'CSAT': '#3357FF',    // สีน้ำเงิน
  'JUNB': '#FFC300',    // สีเหลือง
  'BMS': '#8E44AD',     // สีม่วง
  'BURN': '#FF6347',    // สีมะเขือเทศ
  'CSAT3': '#F39C12',   // สีทอง
  'PCLN': '#1ABC9C',    // สีเขียวมิ้นท์
  'PA': '#D35400',      // สีส้ม
  'JIK': '#2980B9',     // สีฟ้า
  'MPK': '#2C3E50',     // สีน้ำเงินเข้ม
  'KEN': '#7F8C8D',     // สีเทาควันบุหรี่
  'PK': '#34495E',      // สีน้ำเงินกรมท่า
  'PCL': '#16A085',     // สีเขียวมรกต
  'ELU1': '#2ECC71',    // สีเขียวสด
  'AG': '#8E44AD',      // สีม่วง
  'HTH': '#F1C40F',     // สีทองเหลือง
  'TKA': '#9B59B6',     // สีม่วงอ่อน
  'EGC': '#F39C12',     // สีทอง
  'LBL': '#1F618D',     // สีน้ำเงินเข้ม
  'KOC': '#2E4053',     // สีเทาเข้ม
  'KSP': '#A569BD',     // สีม่วง
  'KDU': '#F4D03F',     // สีเหลือง
  'INF': '#7D3C98',     // สีม่วงเข้ม
  'PF': '#FF7F50',      // สีปะการัง
  'ELU2': '#F8C471',    // สีทองอ่อน
  'FC': '#85C1AE',      // สีเขียวฟ้า
};

// ✅ สร้าง params สำหรับ API
const buildParams = (includeWeekID = false) => {
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
  
  if (includeWeekID && selectedWeek.value) {
    params.weekID = selectedWeek.value;
  }
  
  return params;
};

// ✅ Fetch ข้อมูลหลัก
const fetchWorkTimeData = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';
    console.log('=== Fetching Weekly Overtime Data ===');
    
    // ✅ ดึงข้อมูลทั้งหมดเพื่อหา weeks
    const params = buildParams(false);
    console.log('Request params:', params);
    
    const response = await axios.get('http://localhost:5000/api/EICCControl', { params });
    
    console.log('Response data count:', response.data.length);
    
    if (!response.data || response.data.length === 0) {
      console.warn('⚠️ No data returned');
      workTimeData.value = [];
      weekOptions.value = [];
      hasData.value = false;
      errorMessage.value = 'No data available';
      return;
    }

    workTimeData.value = response.data;
    console.log('Sample data:', response.data.slice(0, 2));

    // ✅ ดึง weekID ที่ไม่ซ้ำกัน
    const weeks = [...new Set(workTimeData.value.map(item => item.weekID))]
      .filter(w => w != null)
      .sort((a, b) => a - b);
    
    weekOptions.value = weeks;
    console.log('Week options:', weekOptions.value);
    
    if (weeks.length > 0) {
      selectedWeek.value = weeks[weeks.length - 1]; // Default: Week ล่าสุด
      console.log('Selected week:', selectedWeek.value);
      updateChart();
    } else {
      hasData.value = false;
      errorMessage.value = 'No weeks found';
    }
  } catch (error) {
    console.error('❌ Error fetching work time data:', error);
    console.error('Error response:', error.response?.data);
    errorMessage.value = `Failed to load data: ${error.message}`;
    hasData.value = false;
  } finally {
    loading.value = false;
  }
};

// ✅ Update Chart
const updateChart = () => {
  console.log('=== Updating Chart ===');
  console.log('Selected week:', selectedWeek.value);
  
  if (!workTimeData.value.length) {
    hasData.value = false;
    Plotly.purge('worktime-chart');
    return;
  }

  // ✅ Filter ข้อมูลเฉพาะ week ที่เลือก และ status Active/Complete
  const validStatuses = ['Active', 'Complete'];
  const selectedData = workTimeData.value.filter(entry => 
    validStatuses.includes(entry.status) && entry.weekID === selectedWeek.value
  );

  console.log(`Filtered data for week ${selectedWeek.value}:`, selectedData.length, 'records');

  if (!selectedData.length) {
    hasData.value = false;
    errorMessage.value = `No data for Week ${selectedWeek.value}`;
    Plotly.purge('worktime-chart');
    return;
  }

  hasData.value = true;
  errorMessage.value = '';

  // ✅ Group ข้อมูลตาม process และรวม totalOT
  const processMap = {};
  selectedData.forEach(entry => {
    const key = entry.process || 'ไม่ระบุ';
    const ot = entry.totalOT ? Number(entry.totalOT) : 0;
    
    processMap[key] = (processMap[key] || 0) + ot;
  });

  console.log('Process map:', processMap);

  const processes = Object.keys(processMap).sort((a, b) => processMap[b] - processMap[a]);
  const otHours = processes.map(p => processMap[p]);

  // ✅ กำหนดสีตามชื่อ process
  const colors = processes.map(process => colorMapping[process] || '#4CAF50');

  const chartData = [{
    x: processes,
    y: otHours,
    name: 'OT Hours',
    type: 'bar',
    marker: {
      color: colors,
    },
    text: otHours.map(h => h.toFixed(1) + ' hrs'),
    textposition: 'auto',
  }];

  const chartWidth = Math.max(800, processes.length * 80);

  const layout = {
    title: `Weekly Overtime by Process (Week ${selectedWeek.value})`,
    width: chartWidth,
    xaxis: { 
      title: 'Process',
      tickangle: -45,
    },
    yaxis: { 
      title: 'Total OT Hours',
      rangemode: 'tozero',
    },
    paper_bgcolor: '#fff',
    plot_bgcolor: '#f9f9f9',
    height: 450,
    margin: { l: 60, r: 20, t: 50, b: 100 },
    showlegend: false,
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
  };

  Plotly.newPlot('worktime-chart', chartData, layout, config, {
  displayModeBar: false
}, { responsive: false }).then(() => {
    const chartElement = document.getElementById('worktime-chart');
    if (chartElement) {
      chartElement.on('plotly_click', onBarClick);
    }
  });

  console.log('✅ Chart rendered');
};

// ✅ Click event
const onBarClick = (eventData) => {
  if (eventData.points?.length) {
    const clickedProcess = eventData.points[0].x;
    console.log('Clicked on process:', clickedProcess);
    emit('filter', { week: selectedWeek.value, process: clickedProcess });
  }
};

// ✅ Lifecycle
onMounted(() => {
  console.log('Component mounted');
  console.log('Initial filters:', props.filters);
  fetchWorkTimeData();
});

watch(() => props.filters, () => {
  console.log('Filters changed:', props.filters);
  fetchWorkTimeData();
}, { deep: true });
</script>

<style scoped>
#worktime-chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 450px;
  padding: 15px;
  border-radius: 10px;
}

.filter-bar {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-bar label {
  font-weight: 600;
  color: #333;
}

.filter-bar select {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.filter-bar select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.loading-text {
  color: #666;
  font-style: italic;
  font-size: 14px;
}

#worktime-chart {
  width: 100%;
  height: 100%;
}

.no-data {
  text-align: center;
  color: #999;
  font-size: 16px;
  padding: 150px 0;
}

/* ✅ เพิ่ม wrapper ที่ scroll ได้ */
.chart-container {
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
}

#overtime-chart {
  min-width: 800px;
  height: 450px;
}
</style>