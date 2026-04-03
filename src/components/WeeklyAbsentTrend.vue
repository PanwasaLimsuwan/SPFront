<template>
  <div id="weekly-absent-by-person">
    <div class="filter-bar">
      <label for="week-select">Select Week:</label>
      <select id="week-select" v-model="selectedWeek" @change="drawChart">
        <option v-for="week in weekOptions" :key="week" :value="week">
          {{ "Week " + week }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="no-data">⏳ กำลังโหลด...</div>
    <div v-show="hasData && !loading" id="absent-person-chart"></div>
    <div v-show="!hasData && !loading" class="no-data">ไม่พบข้อมูล</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import axios from "axios";
import Plotly from "plotly.js";

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
});

const selectedWeek = ref(null);
const weekOptions = ref([]);
const hasData = ref(false);
const loading = ref(false);
const now = new Date();

const API_BASE = "http://localhost:5000/api/Attendance";

const buildFilterParams = () => ({
  year: now.getFullYear(),
  division:   props.filters.division   !== "ALL" ? props.filters.division   : undefined,
  department: props.filters.department !== "ALL" ? props.filters.department : undefined,
  section:    props.filters.section    !== "ALL" ? props.filters.section    : undefined,
  biz:        props.filters.biz        !== "ALL" ? props.filters.biz        : undefined,
  process:    props.filters.process    !== "ALL" ? props.filters.process    : undefined,
});

const fetchWeekOptions = async () => {
  try {
    const res = await axios.get(`${API_BASE}/WeekOptions`, {
      params: buildFilterParams(),
    });
    weekOptions.value = res.data || [];
    if (weekOptions.value.length > 0) {
      selectedWeek.value = weekOptions.value[weekOptions.value.length - 1];
    } else {
      selectedWeek.value = null;
    }
  } catch (err) {
    console.error("❌ Error fetching week options:", err);
    weekOptions.value = [];
    selectedWeek.value = null;
  }
};

const drawChart = async () => {
  if (!selectedWeek.value) {
    hasData.value = false;
    return;
  }

  loading.value = true;
  hasData.value = false;

  try {
    const res = await axios.get(`${API_BASE}/WeeklyAbsent`, {
      params: {
        ...buildFilterParams(),
        week: selectedWeek.value,
      },
    });

    const data = res.data || [];

    if (data.length === 0) {
      hasData.value = false;
      loading.value = false;
      return;
    }

    hasData.value = true;
    loading.value = false;
    await nextTick();

    const colorMapping = {
      ASSY:  "#FF5733",
      MOKU:  "#33C157",
      CSAT:  "#3357FF",
      JUNB:  "#FFC300",
      BMS:   "#8E44AD",
      BURN:  "#FF6347",
      CSAT3: "#F39C12",
      PCLN:  "#1ABC9C",
      PA:    "#D35400",
      JIK:   "#2980B9",
      MPK:   "#2C3E50",
      KEN:   "#7F8C8D",
      PK:    "#34495E",
      PCL:   "#16A085",
      ELU1:  "#2ECC71",
      ELU2:  "#F8C471",
      AG:    "#8E44AD",
      HTH:   "#F1C40F",
      TKA:   "#9B59B6",
      EGC:   "#F39C12",
      LBL:   "#1F618D",
      KOC:   "#2E4053",
      KSP:   "#A569BD",
      KDU:   "#F4D03F",
      INF:   "#7D3C98",
      PF:    "#FF7F50",
      FC:    "#85C1AE",
    };

    const names  = data.map((d) => d.process);
    const counts = data.map((d) => d.absentCount);
    const colors = names.map((n) => colorMapping[n] || "#4caf50");

    const trace = {
      x: names,
      y: counts,
      type: "bar",
      marker: { color: colors },
      text: counts.map((v) => `${v} คน`),
      textposition: "inside",
      textfont: { color: "white", size: 13, family: "Arial" },
      insidetextanchor: "middle",
    };

    const layout = {
      title: `Weekly Absent/Late Trend (Week ${selectedWeek.value})`,
      height: 400,
      xaxis: { title: "Process", tickangle: -45 },
      margin: { l: 60, r: 20, t: 50, b: 100 },
      paper_bgcolor: "#fff",
      plot_bgcolor: "#f9f9f9",
    };

    Plotly.newPlot("absent-person-chart", [trace], layout, {
      displayModeBar: false,
    });
  } catch (err) {
    console.error("❌ Error fetching weekly absent:", err);
    hasData.value = false;
    loading.value = false;
  }
};

const fetchAll = async () => {
  await fetchWeekOptions();
  await drawChart();
};

onMounted(fetchAll);
watch(() => props.filters, fetchAll, { deep: true });
</script>

<style scoped>
#weekly-absent-by-person {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
.filter-bar {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-bar label {
  font-size: 14px;
}
.filter-bar select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}
.no-data {
  text-align: center;
  padding: 100px 0;
  color: #999;
  font-size: 14px;
}
</style>