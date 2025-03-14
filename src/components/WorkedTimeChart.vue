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
    // ฟังก์ชันคำนวณเปอร์เซ็นต์และสี
    calculatePercentageAndColor(workTime) {
      const percentage = (workTime / 60) * 100;  // คำนวณเปอร์เซ็นต์จาก workTime
      let color = "#00ff00";  // สีเริ่มต้น

      // กำหนดสีตามเปอร์เซ็นต์
      if (percentage >= 90) {
        color = "#ff0000";  // สีแดงสำหรับ 90% ขึ้นไป
      } else if (percentage >= 80) {
        color = "#ffcc00";  // สีเหลืองสำหรับ 80%-89%
      }

      return { percentage, color };
    },

    drawChart() {
      const chartData = [
        {
          x: this.data.map(emp => {
            const { percentage } = this.calculatePercentageAndColor(emp.workTime);
            return percentage;  // ใช้เปอร์เซ็นต์ในการแสดงในแกน X
          }),
          y: this.data.map(emp => `${emp.firstname} ${emp.lastname}`),  // ชื่อพนักงาน
          type: "bar",
          orientation: "h",
          marker: {
            color: this.data.map(emp => {
              const { color } = this.calculatePercentageAndColor(emp.workTime);
              return color;  // สีที่คำนวณจากเปอร์เซ็นต์
            }),
          },
        },
      ];

      const layout = {
        title: "Worked Time (60hrs./week)",
        height: 300,
        margin: { l: 150, r: 20, t: 50, b: 50 },
        xaxis: { title: "Percentage", automargin: true, range: [0, 100] },  // กำหนดช่วงให้สูงสุดที่ 100%
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
