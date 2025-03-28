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
      chartData: [],  // เก็บข้อมูลที่ได้จาก API
    };
  },
  mounted() {
    this.fetchChartData();  // เรียกใช้งานฟังก์ชันเมื่อ component ถูก mount
  },
  methods: {
    async fetchChartData() {
      try {
        const response = await axios.get("http://localhost:5000/api/BarChart"); // เปลี่ยนเป็น URL ของ API
        this.chartData = response.data; // เก็บข้อมูลที่ได้จาก API
        this.drawChart(); // วาดกราฟ
      } catch (error) {
        console.error("There was an error fetching the data:", error);
      }
    },

    // ฟังก์ชันรวมพนักงานที่ซ้ำกันใน process และ skillGroup เดียวกัน
    aggregateData(process, skillGroup) {
      return this.chartData
        .filter(item => item.process === process && item.skillGroup === skillGroup)
        .reduce((sum, item) => sum + item.require, 0); // เปลี่ยนจาก employeeCount เป็น require
    },

    drawChart() {
      const xData = ["ASSY", "MOKU", "CSAT", "JUNB","BMS","BURN","CSAT3","PCLN","PA","JIK","MPK","PCL","ELU1","AG","HTH","TKA","EGC","LBL","KOC","KSP","KDU","INF","PF","ELU2","FC","PK"]; // ค่า x-axis จากข้อมูล Process

      // รวมข้อมูลจำนวนพนักงานในแต่ละ skillGroup
      const materialData = xData.map(process => this.aggregateData(process, "Material"));
      const operationData = xData.map(process => this.aggregateData(process, "Operation"));
      const inspectionData = xData.map(process => this.aggregateData(process, "Inspection"));
      const machineSAB1Data = xData.map(process => this.aggregateData(process, "Machine:SAB#1"));
      const machineSAB2Data = xData.map(process => this.aggregateData(process, "Machine:SAB#2"));
      const machineSAB3Data = xData.map(process => this.aggregateData(process, "Machine:SAB#3"));

      const chartData = [
        {
          x: xData,
          y: materialData,
          name: "Material",
          type: "bar",
          text: materialData,
          textposition: "auto",
          marker: { color: "#76c7c0" },
        },
        {
          x: xData,
          y: operationData,
          name: "Operation",
          type: "bar",
          text: operationData,
          textposition: "auto",
          marker: { color: "#ff9800" },
        },
        {
          x: xData,
          y: inspectionData,
          name: "Inspection",
          type: "bar",
          text: inspectionData,
          textposition: "auto",
          marker: { color: "#e91e63" },
        },
        {
          x: xData,
          y: machineSAB1Data,
          name: "Machine:SAB#1",
          type: "bar",
          text: machineSAB1Data,
          textposition: "auto",
          marker: { color: "#ffc107" },
        },
        {
          x: xData,
          y: machineSAB2Data,
          name: "Machine:SAB#2",
          type: "bar",
          text: machineSAB2Data,
          textposition: "auto",
          marker: { color: "#8bc34a" },
        },
        {
          x: xData,
          y: machineSAB3Data,
          name: "Machine:SAB#3",
          type: "bar",
          text: machineSAB3Data,
          textposition: "auto",
          marker: { color: "#2196f3" },
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

      Plotly.newPlot("bar-chart", chartData, layout);  // วาดกราฟ
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
