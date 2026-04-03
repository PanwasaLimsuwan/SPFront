<template>
  <div class="chart-container">
    <div class="filter-bar">
      <label for="week-select">Select Week:</label>
      <select 
        id="week-select" 
        v-model="selectedWeekID" 
        @change="onWeekChange" 
        :disabled="loading || weekOptions.length === 0"
      >
        <option v-if="weekOptions.length === 0" value="">No weeks available</option>
        <option v-for="week in weekOptions" :key="week" :value="week">Week {{ week }}</option>
      </select>
      <span v-if="loading" class="loading-indicator">⏳ Loading...</span>
    </div>
    
    <div v-if="errorMessage" class="error-message">
      ❌ {{ errorMessage }}
    </div>
    
    <div id="worked-time-chart" class="scrollable-chart"></div>
  </div>
</template>

<script>
import Plotly from "plotly.js";
import axios from "axios";

export default {
  name: "WorkedTimeChart",
  props: {
    filters: {
      type: Object,
      default: () => ({})
    },
  },
  data() {
    return {
      worktime: [],
      employeeInfo: [],
      combinedData: [],
      weekOptions: [],
      selectedWeekID: null,
      loading: false,
      errorMessage: "",
    };
  },
  async mounted() {
    console.log("=== Component Mounted ===");
    console.log("Filters:", this.filters);
    await this.initialize();
  },
  watch: {
    filters: {
      handler(newVal) {
        console.log("=== Filters Changed ===", newVal);
        this.initialize();
      },
      deep: true,
    },
  },
  methods: {
    async initialize() {
      try {
        this.errorMessage = "";
        await this.fetchWeekOptions();
        
        if (this.weekOptions.length > 0) {
          this.selectedWeekID = this.weekOptions[this.weekOptions.length - 1];
          console.log("Selected week:", this.selectedWeekID);
          await this.refreshChart();
        } else {
          this.errorMessage = "No week data available";
          this.drawChart();
        }
      } catch (error) {
        console.error("Initialization error:", error);
        this.errorMessage = `Initialization failed: ${error.message}`;
      }
    },

    buildParams(includeWeekID = false) {
      const params = {};
      
      // ✅ ส่งเฉพาะ filter ที่ไม่ใช่ 'ALL'
      if (this.filters?.division && this.filters.division !== 'ALL') {
        params.division = this.filters.division;
      }
      if (this.filters?.department && this.filters.department !== 'ALL') {
        params.department = this.filters.department;
      }
      if (this.filters?.section && this.filters.section !== 'ALL') {
        params.section = this.filters.section;
      }
      if (this.filters?.biz && this.filters.biz !== 'ALL') {
        params.biz = this.filters.biz;
      }
      if (this.filters?.process && this.filters.process !== 'ALL') {
        params.process = this.filters.process;
      }
      
      // ✅ ส่ง weekID เฉพาะตอนที่ต้องการ
      if (includeWeekID && this.selectedWeekID) {
        params.weekID = this.selectedWeekID;
      }
      
      return params;
    },

    async fetchWeekOptions() {
      try {
        this.loading = true;
        console.log("=== Fetching Week Options ===");
        
        // ✅ ไม่ส่ง weekID เพื่อดึงทุกสัปดาห์
        const params = this.buildParams(false);
        console.log("Request params:", params);
        
        const response = await axios.get("http://localhost:5000/api/EICCControl", { params });
        
        console.log("Response data count:", response.data.length);
        console.log("Sample data:", response.data.slice(0, 3));
        
        if (!response.data || response.data.length === 0) {
          console.warn("⚠️ No data returned from API");
          this.weekOptions = [];
          return;
        }
        
        // ✅ ดึง weekID ทั้งหมดที่ไม่ซ้ำกัน
        const weeks = [...new Set(response.data.map(item => item.weekID))]
          .filter(w => w != null) // กรอง null/undefined
          .sort((a, b) => a - b);
        
        this.weekOptions = weeks;
        console.log("✅ Week options:", this.weekOptions);
        
      } catch (error) {
        console.error("❌ Error fetching weeks:", error);
        console.error("Error response:", error.response?.data);
        this.errorMessage = `Failed to fetch weeks: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },

    onWeekChange() {
      console.log("=== Week Changed ===", this.selectedWeekID);
      this.refreshChart();
    },

    async refreshChart() {
      try {
        this.errorMessage = "";
        await this.fetchData();
        this.prepareData();
        await this.$nextTick();
        this.drawChart();
      } catch (error) {
        console.error("❌ Refresh chart error:", error);
        this.errorMessage = `Chart refresh failed: ${error.message}`;
      }
    },

    async fetchData() {
      try {
        this.loading = true;
        console.log("=== Fetching Chart Data ===");
        
        // ✅ ส่ง weekID ไปด้วย
        const params = this.buildParams(true);
        console.log("Request params with weekID:", params);

        const [workRes, empRes] = await Promise.all([
          axios.get("http://localhost:5000/api/EICCControl", { params }),
          axios.get("http://localhost:5000/api/EmployeeInfo"),
        ]);
        
        this.worktime = workRes.data;
        this.employeeInfo = empRes.data;
        
        console.log("✅ Worktime records:", this.worktime.length);
        console.log("✅ Employee records:", this.employeeInfo.length);
        
        if (this.worktime.length > 0) {
          console.log("Sample worktime record:", this.worktime[0]);
        }
        
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        this.errorMessage = `Failed to fetch data: ${error.message}`;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    prepareData() {
      console.log("=== Preparing Data ===");
      const groupedByEmp = {};

      // ✅ ตรวจสอบ status ทั้ง "Active" และ "Complete"
      const validStatuses = ["Active", "Complete"];
      const filteredRecords = this.worktime.filter(w => 
        validStatuses.includes(w.status)
      );
      
      console.log(`Filtered records (${validStatuses.join('/')}):`, filteredRecords.length);

      filteredRecords.forEach(w => {
        const empID = w.empID;
        
        // ✅ แปลง totalHours จาก Backend (อาจเป็น decimal/number/string)
        const worked = w.totalHours ? Number(w.totalHours) : 0;

        console.log(`EmpID: ${empID}, Status: ${w.status}, TotalHours: ${w.totalHours} (${typeof w.totalHours}), Parsed: ${worked}`);

        if (!groupedByEmp[empID]) {
          groupedByEmp[empID] = { totalWorked: 0 };
        }

        groupedByEmp[empID].totalWorked += worked;
      });

      console.log("Grouped by employee:", groupedByEmp);
      console.log("Total employees:", Object.keys(groupedByEmp).length);

      // ✅ สร้าง employee map
      const employeeMap = this.employeeInfo.reduce((map, e) => {
        map[e.empID] = e;
        return map;
      }, {});

      // ✅ รวมข้อมูล
      this.combinedData = Object.keys(groupedByEmp).map(empID => {
        const emp = employeeMap[empID];
        const name = emp ? `${emp.firstName} ${emp.lastName}` : `Emp ${empID}`;

        const total = groupedByEmp[empID].totalWorked;
        const percent = (total / 60) * 100;

        let color = "#4caf50"; // Green
        if (percent >= 100) color = "#f44336"; // Red
        else if (percent >= 80) color = "#ffc107"; // Yellow

        return { name, total, percent, color };
      });

      // ✅ เรียงตามสี แล้วตาม %
      this.combinedData.sort((a, b) => {
        const getRank = (color) => {
          if (color === "#f44336") return 1; // Red
          if (color === "#ffc107") return 2; // Yellow
          return 3; // Green
        };

        const rankA = getRank(a.color);
        const rankB = getRank(b.color);

        return rankA !== rankB ? rankA - rankB : b.percent - a.percent;
      });

      console.log("✅ Combined data ready:", this.combinedData.length, "employees");
    },

    drawChart() {
      const container = document.getElementById("worked-time-chart");
      
      if (!container) {
        console.error("❌ Chart container not found!");
        return;
      }

      if (this.combinedData.length === 0) {
        console.log("⚠️ No data to display");
        Plotly.newPlot("worked-time-chart", [], {
          title: `No data for Week ${this.selectedWeekID || 'N/A'}`,
          xaxis: { visible: false },
          yaxis: { visible: false },
          annotations: [{
            text: "No data available",
            xref: "paper",
            yref: "paper",
            x: 0.5,
            y: 0.5,
            showarrow: false,
            font: { size: 16, color: "#888" },
          }],
        }, {
  displayModeBar: false
});
        return;
      }

      const chartData = [{
        x: this.combinedData.map(emp => emp.percent),
        y: this.combinedData.map(emp => emp.name),
        type: "bar",
        orientation: "h",
        marker: {
          color: this.combinedData.map(emp => emp.color),
        },
        text: this.combinedData.map(emp => `${emp.percent.toFixed(1)}% (${emp.total.toFixed(1)}h)`),
        textposition: "auto",
        hovertemplate: "<b>%{y}</b><br>Hours: %{customdata:.1f}<br>Percentage: %{x:.1f}%<extra></extra>",
        customdata: this.combinedData.map(emp => emp.total),
      }];

      const layout = {
        title: `Worked Time - Week ${this.selectedWeekID} (Target: 60 hrs/week)`,
        height: Math.max(400, this.combinedData.length * 40),
        margin: { l: 200, r: 20, t: 50, b: 50 },
        xaxis: { 
          title: "Percentage (%)", 
          range: [0, Math.max(120, Math.max(...this.combinedData.map(e => e.percent)) * 1.1)],
          showgrid: true,
        },
        yaxis: { 
          automargin: true, 
          autorange: "reversed",
        },
        plot_bgcolor: "#f9f9f9",
        paper_bgcolor: "#fff",
        showlegend: false,
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
      };

      Plotly.newPlot("worked-time-chart", chartData, layout, config, {
  displayModeBar: false
});
      console.log("✅ Chart rendered successfully");
    },
  },
};
</script>

<style scoped>
.chart-container {
  max-height: 500px;
  overflow-y: auto;
  padding: 15px;
  border-radius: 10px;
}

.filter-bar {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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

.filter-bar select:hover:not(:disabled) {
  border-color: #888;
}

.loading-indicator {
  color: #666;
  font-style: italic;
  font-size: 14px;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid #c62828;
}

#worked-time-chart {
  width: 100%;
  min-height: 400px;
}

.scrollable-chart::-webkit-scrollbar {
  width: 8px;
}

.scrollable-chart::-webkit-scrollbar-thumb {
  background-color: rgba(100, 100, 100, 0.3);
  border-radius: 4px;
}

.scrollable-chart::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 100, 100, 0.5);
}
</style>