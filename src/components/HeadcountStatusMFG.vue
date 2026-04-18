<script setup>
import { ref, onMounted, watch, nextTick, inject } from "vue";
import axios from "axios";
import Plotly from "plotly.js";

const props = defineProps({
  filters: Object,
});

const emit = defineEmits(["filter-status"]);

const headcountData = ref([]);
const workDate = ref(null);
const isLoading = ref(false);
const chartRendered = ref(false);
const signalRConnection = inject("signalRConnection", null);
let interval = null;

// ===============================
// Fetch Headcount Data
// ===============================
const fetchHeadcountData = async () => {
  isLoading.value = true;

  try {
    const response = await axios.get(
      "http://16.176.50.155:5000/api/Transactions/GetFaceEntry",
      {
        params: {
          division:
            props.filters.division !== "ALL"
              ? props.filters.division
              : undefined,

          department:
            props.filters.department !== "ALL"
              ? props.filters.department
              : undefined,

          section:
            props.filters.section !== "ALL" ? props.filters.section : undefined,

          biz: props.filters.biz !== "ALL" ? props.filters.biz : undefined,

          process:
            props.filters.process !== "ALL" ? props.filters.process : undefined,

          // shiftOverride: "B"
        },
      }
    );

    const apiData = response.data;

    workDate.value = apiData.workDate || apiData.selectedDate;
    headcountData.value = apiData.data || [];
  } catch (error) {
    console.error("Error fetching headcount:", error);
  } finally {
    isLoading.value = false;

    await nextTick();

    drawChart();
  }
};

// ===============================
// Draw Pie Chart
// ===============================
const drawChart = () => {
  const chartElement = document.getElementById("headcount-pie-chart");

  if (!chartElement) return;

  if (!headcountData.value.length) return;

  const statusCounts = headcountData.value.reduce(
    (acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;

      return acc;
    },

    {
      "status-in-cleanroom": 0,
      "status-out-cleanroom": 0,
      "status-missing": 0,
    }
  );

  const data = [
    {
      labels: ["In Cleanroom", "Out Cleanroom", "Missing"],

      values: [
        statusCounts["status-in-cleanroom"],
        statusCounts["status-out-cleanroom"],
        statusCounts["status-missing"],
      ],

      type: "pie",

      marker: {
        colors: ["#2ECC71", "#F39C12", "#E74C3C"],
      },

      textinfo: "label+percent",

      hoverinfo: "label+value+percent",
    },
  ];

  const layout = {
    // title: 'Headcount Status',
    // title: `Headcount Status ${workDate.value ? "(" + workDate.value + ")" : ""}`,

    height: 500,

    width: 500,
  };

  Plotly.react(
    "headcount-pie-chart",
    data,
    layout,
    {
      responsive: true,
    },
    {
      displayModeBar: false,
    }
  );

  chartRendered.value = true;

  const chart = document.getElementById("headcount-pie-chart");

  chart.removeAllListeners("plotly_click");

  chart.on("plotly_click", (data) => {
    const clickedLabel = data.points[0].label;

    const labelToStatus = {
      "In Cleanroom": "status-in-cleanroom",

      "Out Cleanroom": "status-out-cleanroom",

      Missing: "status-missing",
    };

    const status = labelToStatus[clickedLabel];

    emit("filter-status", status);
  });
};

// ===============================
// Watch Filters
// ===============================
let fetchTimeout = null;

watch(
  () => props.filters,
  () => {
    clearTimeout(fetchTimeout);

    fetchTimeout = setTimeout(() => {
      chartRendered.value = false;

      fetchHeadcountData();
    }, 300);
  },
  { deep: true }
);

watch(signalRConnection, (conn, oldConn) => {
  if (oldConn) {
    oldConn.off("HeadcountUpdated", fetchHeadcountData);
  }

  if (conn) {
    conn.off("HeadcountUpdated", fetchHeadcountData); // กันซ้ำ
    conn.on("HeadcountUpdated", fetchHeadcountData);
  }
}, { immediate: true });

// ===============================
onMounted(async () => {
  await fetchHeadcountData();

  // ✅ auto refresh ทุก 10 วินาที
  interval = setInterval(() => {
    fetchHeadcountData();
  }, 10000);
});
</script>



<template>
  <div class="headcount-status-container">
    <h3>
      Headcount Status
      <!-- <span v-if="workDate" class="workdate">
        ({{ workDate }})
      </span> -->
    </h3>

    <div
      id="headcount-pie-chart"
      v-show="chartRendered || headcountData.length > 0"
    ></div>

    <div v-if="!chartRendered && headcountData.length === 0" class="loading">
      Loading chart...
    </div>
  </div>
</template>



<style scoped>
.headcount-status-container {
  width: 100%;
}

#headcount-pie-chart {
  width: 100%;
  max-width: 500px;
  margin: auto;
}

h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.workdate {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
}

.loading {
  text-align: center;
  font-weight: bold;
  color: #888;
  padding: 20px;
}
</style>