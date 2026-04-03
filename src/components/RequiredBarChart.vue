<template>
  <div>
    <div class="chart-title">
      <h3>Manpower Requirement by Process and Skill Group</h3>
      <p v-if="workDate">Work Date: {{ formatDate(workDate) }}</p>
    </div>
    <div id="required-bar-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import axios from "axios";
import Plotly from "plotly.js";

const props = defineProps({ filters: Object });
const emit = defineEmits(["barClick"]);

const rawData = ref([]);
const workDate = ref(null);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "";

const drawChart = () => {
  if (!rawData.value.length) return;

  const processes = [...new Set(rawData.value.map((d) => d.process))];

  const aggregate = (process) => {
    const items = rawData.value.filter((d) => d.process === process);
    return Math.max(...items.map((i) => i.headcountShortage || 0), 0);
  };

  // ✅ FIX: กรองเฉพาะ process ที่ยังขาดจริง (headcountShortage > 0)
  const shortageProcesses = processes.filter((p) => aggregate(p) > 0);

  if (shortageProcesses.length === 0) {
    Plotly.purge("required-bar-chart");
    return;
  }

  const traces = [
    {
      x: shortageProcesses,
      y: shortageProcesses.map((p) => aggregate(p)),
      type: "bar",
      text: shortageProcesses.map((p) => String(aggregate(p))),
      textposition: "auto",
      name: "Headcount",
    },
  ];

  const layout = {
    title: { text: "⚠️ Process ที่ขาดแคลนคนวันนี้", font: { size: 16 } },
    height: 450,
    xaxis: { title: "Process", tickangle: -45, automargin: true },
    yaxis: { title: "จำนวนคนที่ขาด (คน)", dtick: 1, rangemode: "tozero" },
    colorway: ["#ef4444"],
    margin: { b: 120 },
  };

  Plotly.react("required-bar-chart", traces, layout, { responsive: true }).then(() => {
    const chart = document.getElementById("required-bar-chart");
    chart.removeAllListeners?.("plotly_click");
    chart.on("plotly_click", (event) => {
      if (!event.points || !event.points.length) return;
      const process = event.points[0].x;
      const items = rawData.value.filter((d) => d.process === process);
      if (!items.length) return;
      const headcount = Math.max(...items.map((i) => i.headcountShortage || 0), 0);
      const biz = items[0].biz ?? "";
      emit("barClick", {
        process,
        biz,
        workDate: workDate.value,
        headcountShortage: headcount || 1,
      });
    });
  });
};

const fetchData = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/ManpowerReq/latest", {
      params: {
        division:   props.filters.division   !== "ALL" ? props.filters.division   : undefined,
        department: props.filters.department !== "ALL" ? props.filters.department : undefined,
        section:    props.filters.section    !== "ALL" ? props.filters.section    : undefined,
        biz:        props.filters.biz        !== "ALL" ? props.filters.biz        : undefined,
        process:    props.filters.process    !== "ALL" ? props.filters.process    : undefined,
      },
    });

    if (!res.data || res.data.length === 0) {
      rawData.value = [];
      Plotly.purge("required-bar-chart");
      return;
    }

    rawData.value = res.data;
    workDate.value = res.data[0].workDate;
    await nextTick();
    drawChart();
  } catch (err) {
    console.error("❌ Error fetching manpower data:", err);
  }
};

// ✅ expose fetchData เพื่อให้ Dashboard เรียกได้
defineExpose({ refresh: fetchData });

watch(() => props.filters, fetchData, { deep: true });

onMounted(async () => {
  await fetchData();
  if (window.connection) {
    window.connection.on("ManpowerUpdated", fetchData);
  }
});
</script>

<style scoped>
.chart-title {
  margin-bottom: 10px;
}
.chart-title h3 {
  margin: 0;
}
.chart-title p {
  margin: 0;
  font-size: 13px;
  color: #666;
}
#required-bar-chart {
  width: 100%;
  height: 100%;
}
</style>