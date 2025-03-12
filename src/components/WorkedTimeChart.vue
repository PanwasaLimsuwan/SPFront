<template>
  <div id="worked-time-chart"></div>
</template>

<script>
import Plotly from "plotly.js";
import axios from "axios";

export default {
  name: "WorkedTimeChart",
  data() {
    return {
      data: [],
    };
  },
  mounted() {
    this.fetchWorkedTimeData();  // เรียกใช้ฟังก์ชันเพื่อดึงข้อมูลเมื่อ component ถูก mount
  },
  methods: {
    async fetchWorkedTimeData() {
      try {
        const response = await axios.get("http://localhost:5000/api/WorkedTimeChart");
        this.data = response.data;  // เก็บข้อมูลจาก API
        this.drawChart();
      } catch (error) {
        console.error("Error fetching worked time data:", error);
      }
    },
    drawChart() {
      const chartData = [
        {
          x: this.data.map(emp => emp.hours),  // นำค่าจำนวนชั่วโมงจากข้อมูล
          y: this.data.map(emp => `${emp.firstname} ${emp.lastname}`),  // นำชื่อพนักงานจากข้อมูล
          type: "bar",
          orientation: "h",
          marker: {
            color: this.data.map(emp => (emp.hours > 60 ? "red" : "yellow")),  // กำหนดสีตามจำนวนชั่วโมง
          },
        },
      ];

      const layout = {
        title: "Worked Time (60hrs./week)",
        height: 300,
        margin: { l: 150, r: 20, t: 50, b: 50 },
        xaxis: { title: "Hours", automargin: true },
        yaxis: { automargin: true },
        responsive: true,
      };

      Plotly.newPlot("worked-time-chart", chartData, layout);
    },
  },
};
</script>

<style scoped>
#worked-time-chart {
  width: 100%;
  height: 100%;
}
</style>
