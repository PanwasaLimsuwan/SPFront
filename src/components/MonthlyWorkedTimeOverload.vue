<template>
  <div class="chart-wrapper">
    <div v-show="loading" class="loading">⏳ Loading...</div>

    <div v-show="errorMessage && !loading" class="error-message">
      ❌ {{ errorMessage }}
    </div>

    <div v-show="!hasData && !loading && !errorMessage" class="no-data">
      No overload data to display
    </div>

    <div
      id="monthly-overload-chart"
      :style="{ display: hasData && !loading ? 'block' : 'none' }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import Plotly from "plotly.js";
import axios from "axios";

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
});

const months = ref([]);
const overloads = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const hasData = ref(false);

// ✅ build params
const buildParams = () => {
  const params = {};

  if (props.filters?.division !== "ALL") params.division = props.filters.division;
  if (props.filters?.department !== "ALL") params.department = props.filters.department;
  if (props.filters?.section !== "ALL") params.section = props.filters.section;
  if (props.filters?.biz !== "ALL") params.biz = props.filters.biz;
  if (props.filters?.process !== "ALL") params.process = props.filters.process;

  return params;
};

// ✅ fetch + aggregate รายเดือน
const fetchWorkTimeData = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    hasData.value = false;

    const response = await axios.get(
      "http://16.176.50.155:5000/api/EICCControl/MonthlySummary",
      { params: buildParams() }
    );

    const rawData = response.data;

    if (!rawData || rawData.length === 0) {
      errorMessage.value = "No data available";
      return;
    }

    // 🔥 รวมข้อมูลตามเดือน (yyyy-MM)
    // const monthlyMap = {};

    // rawData.forEach(d => {
    //   const month = d.month; // ✅ ใช้ตัวนี้แทน month

    //   if (!month) return;

    //   if (!monthlyMap[month]) {
    //     monthlyMap[month] = 0;
    //   }

    //   // ✅ เลือกใช้ overloadEmployees จะตรงโจทย์กว่า
    //   monthlyMap[month] += d.overloadEmployees;
    // });

    months.value = rawData.map(d => d.month);
overloads.value = rawData.map(d => d.overloadEmployees);

    // ✅ sort เดือน
    // const sortedMonths = Object.keys(monthlyMap).sort();

    // months.value = sortedMonths;
    // overloads.value = sortedMonths.map(m => monthlyMap[m]);

    hasData.value = overloads.value.length > 0;

    await nextTick();
    drawChart();

  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

// ✅ draw chart
const drawChart = () => {
  const el = document.getElementById("monthly-overload-chart");
  if (!el) return;

  // ✅ format เดือน
  const formattedMonths = months.value.map(m => {
    const date = new Date(m + "-01"); // m = yyyy-MM
    return date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  });

  const values = overloads.value;

  const trace = {
    x: formattedMonths,
    y: values,
    type: "bar",
    text: values.map(v => `${v} คน`),
    textposition: "auto",
    marker: {
      color: values.map(v =>
        v >= 100 ? "#7f0000" :
        v >= 50  ? "#b71c1c" :
        v >= 10  ? "#e53935" :
                   "#ef5350"
      ),
    },
    hovertemplate: "<b>%{x}</b><br>Overload: %{y} คน<extra></extra>"
  };

  const layout = {
    title: "Monthly Worktime Overload",
    xaxis: { title: "Month", tickangle: -45 },
    yaxis: { title: "จำนวนพนักงาน (คน)", rangemode: "tozero" },
    margin: { l: 60, r: 30, t: 60, b: 100 },
    plot_bgcolor: "#f9f9f9",
    paper_bgcolor: "#fff",
    height: 450,
  };

  Plotly.react(el, [trace], layout, {
    displayModeBar: false
  });
};

// lifecycle
onMounted(fetchWorkTimeData);

watch(() => props.filters, fetchWorkTimeData, { deep: true });
</script>

<style scoped>
.chart-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
}

#monthly-overload-chart {
  min-width: 600px;
  height: 450px;
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