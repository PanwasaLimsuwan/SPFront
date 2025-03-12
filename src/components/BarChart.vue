<template>
  <div id="bar-chart"></div>
</template>

<script>
import Plotly from "plotly.js";
import axios from 'axios';

export default {
  name: "BarChart",
  data() {
    return {
      chartData: [],
    };
  },
  mounted() {
    this.fetchChartData(); // เรียกใช้งานฟังก์ชันเมื่อ component ถูก mount
  },
  methods: {
    async fetchChartData() {
      try {
        const response = await axios.get("http://localhost:5000/api/BarChart");
        this.chartData = response.data; // เก็บข้อมูลที่ได้จาก API
        this.drawChart(); // วาดกราฟ
      } catch (error) {
        console.error("There was an error fetching the data:", error);
      }
    },
    drawChart() {
      const xData = ["ASSY", "MOKU", "CSAT", "JUNB"]; // ค่า x-axis จากข้อมูล Process
      const materialData = this.chartData.filter(item => item.skillGroup === "Material");
      const operationData = this.chartData.filter(item => item.skillGroup === "Operation");
      const inspectionData = this.chartData.filter(item => item.skillGroup === "Inspection");

      const chartData = [
        {
          x: xData,
          y: materialData.map(item => item.employeeCount),
          name: "Material",
          type: "bar",
          text: materialData.map(item => item.employeeCount),
          textposition: "auto",
          marker: { color: "#76c7c0" },
        },
        {
          x: xData,
          y: operationData.map(item => item.employeeCount),
          name: "Operation",
          type: "bar",
          text: operationData.map(item => item.employeeCount),
          textposition: "auto",
          marker: { color: "#ff9800" },
        },
        {
          x: xData,
          y: inspectionData.map(item => item.employeeCount),
          name: "Inspection",
          type: "bar",
          text: inspectionData.map(item => item.employeeCount),
          textposition: "auto",
          marker: { color: "#e91e63" },
        },
      ];

      const layout = {
        title: "Require Support (Process)",
        barmode: "stack",
        height: 400,
        width: 700,
        legend: { orientation: "v", x: 1.1, y: 1 },
        xaxis: { title: "Process" },
        yaxis: { title: "Employees" },
      };

      Plotly.newPlot("bar-chart", chartData, layout);
    },
  },
};
</script>

<style scoped>
#bar-chart {
  width: 100%;
  height: 100%;
}
</style>
