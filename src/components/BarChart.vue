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

    // ฟังก์ชันรวมพนักงานที่ซ้ำกันใน process และ skillGroup เดียวกัน
    aggregateData(process, skillGroup) {
      return this.chartData
        .filter(item => item.process === process && item.skillGroup === skillGroup)
        .reduce((sum, item) => sum + item.employeeCount, 0);
    },

    drawChart() {
      const xData = ["ASSY", "MOKU", "CSAT", "JUNB"]; // ค่า x-axis จากข้อมูล Process

      // รวมข้อมูลจำนวนพนักงานในแต่ละ skillGroup
      const materialData = xData.map(process => this.aggregateData(process, "Material"));
      const operationData = xData.map(process => this.aggregateData(process, "Operation"));
      const inspectionData = xData.map(process => this.aggregateData(process, "Inspection"));
      const MachineSAB1Data = xData.map(process => this.aggregateData(process, "Machine:SAB#1"));
      const MachineSAB2Data = xData.map(process => this.aggregateData(process, "Machine:SAB#2"));
      const MachineSAB3Data = xData.map(process => this.aggregateData(process, "Machine:SAB#3"));

      // ตรวจสอบข้อมูลในคอนโซล
      console.log('Material Data:', materialData);
      console.log('Operation Data:', operationData);
      console.log('Inspection Data:', inspectionData);
      console.log('Machine:SAB#1 Data:', MachineSAB1Data);
      console.log('Machine:SAB#2 Data:', MachineSAB2Data);
      console.log('Machine:SAB#3 Data:', MachineSAB3Data);

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
          y: MachineSAB1Data,
          name: "Machine:SAB#1",
          type: "bar",
          text: MachineSAB1Data,
          textposition: "auto",
          marker: { color: "#ffc107" },
        },
        {
          x: xData,
          y: MachineSAB2Data,
          name: "Machine:SAB#2",
          type: "bar",
          text: MachineSAB2Data,
          textposition: "auto",
          marker: { color: "#8bc34a" },
        },
        {
          x: xData,
          y: MachineSAB3Data,
          name: "Machine:SAB#3",
          type: "bar",
          text: MachineSAB3Data,
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
