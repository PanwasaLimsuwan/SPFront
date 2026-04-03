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
import { ref, onMounted, watch, nextTick } from "vue";
import Plotly from "plotly.js";
import axios from "axios";

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
const errorMessage = ref("");
const hasData = ref(false);
const monthlyOverloadEmployees = {};

// ✅ สร้าง params สำหรับ API
const buildParams = () => {
  const params = {};

  if (props.filters?.division && props.filters.division !== "ALL") {
    params.division = props.filters.division;
  }
  if (props.filters?.department && props.filters.department !== "ALL") {
    params.department = props.filters.department;
  }
  if (props.filters?.section && props.filters.section !== "ALL") {
    params.section = props.filters.section;
  }
  if (props.filters?.biz && props.filters.biz !== "ALL") {
    params.biz = props.filters.biz;
  }
  if (props.filters?.process && props.filters.process !== "ALL") {
    params.process = props.filters.process;
  }

  return params;
};

const fetchWorkTimeData = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";
    hasData.value = false;

    const params = buildParams();
    const response = await axios.get("http://localhost:5000/api/EICCControl", { params });

    if (!response.data || response.data.length === 0) {
      errorMessage.value = "No data available from API";
      return;
    }

    const data = response.data;

    // ✅ ย้ายมาประกาศในนี้แทน ล้างข้อมูลเก่าทุกครั้ง
    const monthlyOverloadEmployees = {};

    data.forEach((entry) => {
      if (!entry.weekStart) return;
      const monthKey = entry.weekStart.substring(0, 7);
      const empID = entry.empID;
      const total = Number(entry.totalHours || 0) + Number(entry.totalOT || 0);

      if (!monthlyOverloadEmployees[monthKey])
        monthlyOverloadEmployees[monthKey] = {};
      if (!monthlyOverloadEmployees[monthKey][empID])
        monthlyOverloadEmployees[monthKey][empID] = { overloadWeeks: 0, overloadHours: 0 };

      if (total > 60) {
        monthlyOverloadEmployees[monthKey][empID].overloadWeeks += 1;
        monthlyOverloadEmployees[monthKey][empID].overloadHours += total - 60;
      }
    });

    // ✅ สรุปรายเดือน
    const monthlyOverload = {};
    for (const month in monthlyOverloadEmployees) {
      let employeeCount = 0;
      let overloadHours = 0;
      for (const empID in monthlyOverloadEmployees[month]) {
        const emp = monthlyOverloadEmployees[month][empID];
        if (emp.overloadWeeks >= 1) {
          employeeCount++;
          overloadHours += emp.overloadHours;
        }
      }
      monthlyOverload[month] = { employeeCount, overloadHours };
    }

    const sortedMonths = Object.keys(monthlyOverload).sort();
    months.value = sortedMonths;
    overloads.value = sortedMonths.map((m) => monthlyOverload[m].employeeCount);

    const totalOverload = overloads.value.reduce((sum, v) => sum + v, 0);
    hasData.value = totalOverload > 0;

    if (hasData.value) {
      await nextTick();
      drawChart(monthlyOverload);
    }
  } catch (error) {
    errorMessage.value = `Failed to load data: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

const drawChart = (monthlyOverload) => {
  const chartElement = document.getElementById("monthly-overload-chart");
  if (!chartElement) return;

  const formattedMonths = months.value.map((m) => {
    try {
      const date = new Date(m + "-01");
      return date.toLocaleString("en-US", { month: "short", year: "numeric" });
    } catch { return m; }
  });

  const employeeCounts = months.value.map(m => monthlyOverload[m].employeeCount);

  // ✅ สีแดงอย่างเดียว ความเข้มตามจำนวน
  const colors = employeeCounts.map(count => {
    if (count >= 100) return "#7f0000";
    if (count >= 50)  return "#b71c1c";
    if (count >= 10)  return "#c62828";
    if (count >= 6)   return "#e53935";
    return "#ef5350";
  });

  const hoverText = months.value.map(m => {
    const d = monthlyOverload[m];
    const avg = d.employeeCount > 0
      ? (d.overloadHours / d.employeeCount).toFixed(1) : 0;
    return `เดือน: ${m}<br>` +
           `พนักงานที่มีสัปดาห์เกิน 60h: ${d.employeeCount} คน<br>` +
           `ชั่วโมงที่เกินรวม: ${d.overloadHours.toFixed(1)} h<br>` +
           `เฉลี่ย: ${avg} h/คน`;
  });

  const trace = {
    x: formattedMonths,
    y: employeeCounts,
    type: "bar",
    marker: { color: colors },
    text: employeeCounts.map(v => `${v} คน`),
    textposition: "auto",
    hovertext: hoverText,
    hoverinfo: "text",
    width: 0.5, // ✅ แท่งแคบลง
  };

  // ✅ คำนวณความกว้างกราฟตามจำนวนเดือน (อย่างน้อย 600px)
  const chartWidth = Math.max(600, months.value.length * 100);

  const layout = {
    title: "Monthly Overload — พนักงานที่ทำงานเกิน 60h/สัปดาห์",
    width: chartWidth, // ✅ กว้างตามข้อมูล
    xaxis: { title: "Month", tickangle: -45, automargin: true },
    yaxis: { title: "จำนวนพนักงาน (คน)", rangemode: "tozero", dtick: 10 },
    margin: { l: 60, r: 30, t: 60, b: 120 },
    plot_bgcolor: "#f9f9f9",
    paper_bgcolor: "#fff",
    height: 450,
    showlegend: false,
  };

  Plotly.react("monthly-overload-chart", [trace], layout, { responsive: false }, {
  displayModeBar: false
}); // ✅ false เพื่อให้ scroll ได้
};

// ✅ Lifecycle
onMounted(() => {
  console.log("Component mounted");
  console.log("Initial filters:", props.filters);
  fetchWorkTimeData();
});

// ✅ watch filter → reload data + update chart
watch(
  () => props.filters,
  async () => {
    console.log("Filters changed:", props.filters);
    await fetchWorkTimeData();
  },
  { deep: true }
);
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

.chart-wrapper {
  overflow-x: auto;  /* ✅ เพิ่ม scroll แนวนอน */
  overflow-y: hidden;
  width: 100%;
}

#monthly-overload-chart {
  min-width: 600px;  /* ✅ กำหนด min-width */
  height: 450px;
}
</style>