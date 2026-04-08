<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import Plotly from 'plotly.js'

const props = defineProps({
  filters: Object
})

const trainingData = ref([])

onMounted(async () => {
  await fetchTrainingData()
})

const fetchTrainingData = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/OJTandInspectionSkill', {
      params: {
        division: props.filters.division !== 'ALL' ? props.filters.division : undefined,
        department: props.filters.department !== 'ALL' ? props.filters.department : undefined,
        section: props.filters.section !== 'ALL' ? props.filters.section : undefined,
        biz: props.filters.biz !== 'ALL' ? props.filters.biz : undefined,
        process: props.filters.process !== 'ALL' ? props.filters.process : undefined
      }
    })

    trainingData.value = response.data.filter(item => item.active >= 2)
    drawChart()
  } catch (error) {
    console.error('Error fetching training data:', error)
  }
}

const drawChart = () => {
  const grouped = {}
  trainingData.value.forEach(item => {
    const key = item.process || 'Unknown'
    grouped[key] = (grouped[key] || 0) + 1
  })

  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1])
  const xLabels = sorted.map(([k]) => k)
  const yValues = sorted.map(([, v]) => v)
  // const xLabels = Object.keys(grouped)
  // const yValues = Object.values(grouped)

  const colorMapping = {
    'ASSY': '#FF5733', 'MOKU': '#33FF57', 'CSAT': '#3357FF',
    'JUNB': '#FFC300', 'BMS': '#8E44AD', 'BURN': '#FF6347',
    'CSAT3': '#F39C12', 'PCLN': '#1ABC9C', 'PA': '#D35400',
    'JIK': '#2980B9', 'MPK': '#2C3E50', 'KEN': '#7F8C8D',
    'PK': '#34495E', 'PCL': '#16A085', 'ELU1': '#2ECC71',
    'AG': '#8E44AD', 'HTH': '#F1C40F', 'TKA': '#9B59B6',
    'EGC': '#F39C12', 'LBL': '#1F618D', 'KOC': '#2E4053',
    'KSP': '#A569BD', 'KDU': '#F4D03F', 'INF': '#7D3C98',
    'PF': '#FF7F50', 'ELU2': '#F8C471', 'FC': '#85C1AE',
  }

  const colors = xLabels.map(name => colorMapping[name] || '#4caf50')

  // ✅ คำนวณความกว้างกราฟตามจำนวน process (อย่างน้อย 900px)
  const chartWidth = Math.max(900, xLabels.length * 65)

  const chartData = [{
    x: xLabels,
    y: yValues,
    type: 'bar',
    marker: {
      color: colors,
      line: { color: 'rgba(0,0,0,0.1)', width: 1 }
    },
    text: yValues.map(v => `${v} คน`),  // ✅ แสดงทุกแท่ง ไม่มีเงื่อนไข
    textposition: 'outside',
    textfont: { size: 12, color: '#333' },
    width: 0.6,
  }]

  const layout = {
    title: { text: 'Training Employee', font: { size: 18 } },
    width: chartWidth,  // ✅ กว้างตามจำนวน process
    xaxis: {
      title: { text: 'Process', standoff: 10 },
      tickangle: -45,   // ✅ หมุน label ให้ไม่ทับกัน
      tickfont: { size: 12 },
      automargin: true,
    },
    yaxis: {
      title: 'จำนวนพนักงาน',
      tickfont: { size: 12 },
      range: [0, Math.max(...yValues) * 1.35],  // ✅ เผื่อที่ว่างด้านบน label
      rangemode: 'tozero',
    },
    height: 480,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: '#fff',
    margin: { t: 60, l: 65, r: 30, b: 110 },
    bargap: 0.2,
  }

  Plotly.newPlot('training-chart', chartData, layout, {
    displayModeBar: false,
    responsive: false,  // ✅ ปิด responsive เพื่อให้ scroll ทำงานได้
  })
}

watch(() => props.filters, async () => {
  await fetchTrainingData()
}, { deep: true })
</script>

<template>
  <div class="training-employee-container">
    <!-- ✅ Wrapper สำหรับ scroll -->
    <div class="chart-wrapper">
      <div id="training-chart"></div>
    </div>
  </div>
</template>

<style scoped>
.training-employee-container {
  width: 100%;
  height: 100%;
  padding: 10px;
}

/* ✅ scroll ซ้าย-ขวาได้เมื่อกราฟกว้างเกิน */
.chart-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

#training-chart {
  min-width: 900px;
  height: 480px;
}
</style>