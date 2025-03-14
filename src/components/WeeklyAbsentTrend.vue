<template>
  <div id="weekly-absent-trend"></div>
</template>

<script>
import Plotly from "plotly.js";
import axios from "axios"; // ใช้ axios ในการดึงข้อมูล

export default {
  name: "WeeklyAbsentTrend",
  data() {
    return {
      data: {
        Week: [],  // ใส่ข้อมูล WeekNumber
        absences: [],  // ใส่ข้อมูล Absences
      },
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        // ดึงข้อมูลจาก API
        const response = await axios.get("http://localhost:5000/api/WeeklyAbsent");
        const dataFromApi = response.data;

        // แยกข้อมูลเป็น days (WeekNumber) และ absences
        this.data.Week = dataFromApi.map(item => item.WeekNumber);
        this.data.absences = dataFromApi.map(item => item.absences);

        // วาดกราฟหลังจากข้อมูลถูกดึง
        this.drawChart();
      } catch (error) {
        console.error("There was an error fetching the data:", error);
      }
    },

    drawChart() {
      const chartData = [
        {
          x: this.data.days,
          y: this.data.absences,
          type: "scatter",
          mode: "lines+markers",
          line: { color: "red" },
        },
      ];

      const layout = {
        title: "Weekly Absent Trend",
        height: 300,
        margin: { l: 50, r: 20, t: 50, b: 50 },
        xaxis: { title: "Week Number", automargin: true },
        yaxis: {
          title: "Absences",
          range: [0, 50], // กำหนดช่วงแกน y
          tick0: 0,
          dtick: 10, // ให้แสดง tick ทุก 10 หน่วย
        },
        responsive: true,
      };

      Plotly.newPlot("weekly-absent-trend", chartData, layout);
    },
  },
};
</script>

<style scoped>
#weekly-absent-trend {
  width: 100%;
  height: 100%;
}
</style>
