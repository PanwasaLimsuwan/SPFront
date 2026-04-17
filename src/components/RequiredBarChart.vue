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
import { ref, onMounted, watch, nextTick, inject, computed } from "vue";
import axios from "axios";
import Plotly from "plotly.js";
import jwt_decode from "jwt-decode";

const props = defineProps({ filters: Object });
const emit = defineEmits(["barClick"]);

const rawData = ref([]);
const workDate = ref(null);
const selectedProcessFromParent = inject("selectedProcess", ref(null));
const signalRConnection = inject("signalRConnection", ref(null));

// ✅ JWT claims สำหรับเช็ค permission
const currentUser = computed(() => {
  try {
    return jwt_decode(localStorage.getItem("token") || "");
  } catch {
    return {};
  }
});
const userRole = computed(() => currentUser.value?.role ?? "");
const userBizJwt = computed(() => currentUser.value?.biz ?? "");
const userProcessJwt = computed(() => currentUser.value?.process ?? "");
const isAdmin = computed(() => userRole.value === "Admin");

// ✅ ฟังก์ชันเช็คว่า user มีสิทธิ์ process นี้ไหม
const canAccessProcess = (biz, process) => {
  if (isAdmin.value) return true;
  const bizOk = !userBizJwt.value || biz === userBizJwt.value;
  const procOk = !userProcessJwt.value || process === userProcessJwt.value;
  return bizOk && procOk;
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "";

const drawChart = async () => {
  if (!rawData.value.length) return;

  await nextTick(); // รอให้ DOM render เสร็จก่อน

  const el = document.getElementById("required-bar-chart");
  if (!el) return; // ยังไม่มี DOM → ออก

  const processes = [...new Set(rawData.value.map((d) => d.process))];
  const shortageProcesses = processes.filter((p) => {
    const items = rawData.value.filter((d) => d.process === p);
    return Math.max(...items.map((i) => i.headcountShortage || 0), 0) > 0;
  });

  if (shortageProcesses.length === 0) {
    Plotly.purge("required-bar-chart");
    return;
  }

  const selectedProc = selectedProcessFromParent?.value ?? null;

  // ✅ สีแท่ง: grey ถ้าไม่มีสิทธิ์, เขียวถ้า selected, แดงปกติ
  const colors = shortageProcesses.map((p) => {
    const item = rawData.value.find((d) => d.process === p);
    const biz = item?.biz ?? "";
    if (!canAccessProcess(biz, p)) return "#d1d5db"; // grey = no permission
    if (p === selectedProc) return "#0F6E56";         // selected = green
    return "#ef4444";                                  // default = red
  });

  // ✅ hovertemplate: แสดง 🔒 warning ถ้าไม่มีสิทธิ์
  const hoverTemplates = shortageProcesses.map((p) => {
    const item = rawData.value.find((d) => d.process === p);
    const biz = item?.biz ?? "";
    if (!canAccessProcess(biz, p)) {
      return `<b>%{x}</b><br>🔒 ไม่มีสิทธิ์ Assign Process นี้<br><span style='color:#9ca3af'>คุณดูแล: ${userBizJwt.value || "?"}/${userProcessJwt.value || "?"}</span><extra></extra>`;
    }
    return `<b>%{x}</b><br>ขาด <b>%{y}</b> คน<extra></extra>`;
  });

  const traces = [
    {
      x: shortageProcesses,
      y: shortageProcesses.map((p) => {
        const items = rawData.value.filter((d) => d.process === p);
        return Math.max(...items.map((i) => i.headcountShortage || 0), 0);
      }),
      type: "bar",
      text: shortageProcesses.map((p) => {
        const items = rawData.value.filter((d) => d.process === p);
        return String(Math.max(...items.map((i) => i.headcountShortage || 0), 0));
      }),
      textposition: "auto",
      marker: { color: colors },
      hovertemplate: hoverTemplates,
      name: "Headcount",
    },
  ];

  const layout = {
    title: { text: "⚠️ Process ที่ขาดแคลนคนวันนี้", font: { size: 16 } },
    height: 300,
    xaxis: { title: "Process", tickangle: -45, automargin: true },
    yaxis: { title: "จำนวนคนที่ขาด (คน)", dtick: 1, rangemode: "tozero" },
    margin: { b: 80, t: 40 },
    plot_bgcolor: "transparent",
    paper_bgcolor: "transparent",
  };

  Plotly.react("required-bar-chart", traces, layout, { responsive: true }).then(() => {
    const chart = document.getElementById("required-bar-chart");
    chart.removeAllListeners?.("plotly_click");
    chart.on("plotly_click", (event) => {
      if (!event.points || !event.points.length) return;
      const process = event.points[0].x;
      const items = rawData.value.filter((d) => d.process === process);
      if (!items.length) return;

      const biz = items[0].biz ?? "";

      // ✅ block ทันทีถ้าไม่มีสิทธิ์ — ไม่ต้องรอให้ไปถึง EmployeeRecommendations
      if (!canAccessProcess(biz, process)) {
        alert(
          `🔒 ไม่มีสิทธิ์ Assign Process นี้\n\nคุณดูแล: ${userBizJwt.value || "?"}/${userProcessJwt.value || "?"}\nProcess ที่กด: ${biz}/${process}`
        );
        return;
      }

      const headcount = Math.max(...items.map((i) => i.headcountShortage || 0), 0);
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

    // ✅ แก้เป็น
rawData.value = res.data;
workDate.value = res.data[0].workDate;
await drawChart(); // ← ใช้ await เพราะ drawChart เป็น async แล้ว
  } catch (err) {
    console.error("❌ Error fetching manpower data:", err);
  }
};

// ✅ expose fetchData เพื่อให้ Dashboard เรียกได้
defineExpose({ refresh: fetchData });

watch(() => props.filters, fetchData, { deep: true });
watch(selectedProcessFromParent, () => drawChart());

onMounted(async () => {
  await fetchData();

  // Polling ทุก 10 วินาที เป็น fallback กรณี SignalR พลาด
  setInterval(fetchData, 10000);
});

// ✅ แก้ watch ให้ป้องกัน listener ซ้ำ
watch(signalRConnection, (conn, oldConn) => {
  if (oldConn) {
    oldConn.off("AssignmentUpdated", fetchData);
    oldConn.off("ManpowerUpdated", fetchData);
  }
  if (conn) {
    conn.off("AssignmentUpdated", fetchData); // ล้างก่อน
    conn.off("ManpowerUpdated", fetchData);
    conn.on("AssignmentUpdated", fetchData);
    conn.on("ManpowerUpdated", fetchData);
  }
}, { immediate: true });
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