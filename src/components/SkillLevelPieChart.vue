<template>
  <div id="skill-level-pie-chart"></div>
</template>

<script>
import Plotly from "plotly.js";
import axios from 'axios';

export default {
  name: "SkillLevelPieChart",
  data() {
    return {
      pieChartData: {
        values: [],
        labels: [],
        type: "pie",
        marker: {
          colors: ["gray", "red", "yellow", "green"],
        },
      }
    };
  },
  mounted() {
    this.fetchSkillLevelData(); // เรียกใช้งานฟังก์ชันดึงข้อมูล API เมื่อคอมโพเนนต์ถูกโหลด
  },
  methods: {
    async fetchSkillLevelData() {
      try {
        const response = await axios.get('http://localhost:5000/api/SkillLevelPiChart');
        const data = response.data;

        // จัดรูปแบบข้อมูลที่ได้จาก API เพื่อให้ตรงกับการแสดงผลใน Pie Chart
        this.pieChartData = {
          values: [data["3"], data["2"], data["1"], data["0"]],
          labels: ["3 (Expert)", "2 (Medium)", "1 (Basic)", "0 (Not Trained)"],
          type: "pie",
          marker: {
            colors: ["green", "yellow", "red", "gray"], // สีสำหรับแต่ละระดับ
          },
        };

        // แสดง Pie Chart ด้วย Plotly
        Plotly.newPlot("skill-level-pie-chart", [this.pieChartData], {
          title: "Skill Level Distribution",
          height: 450,
          width: 450,
        }).then(() => {
          document
            .getElementById("skill-level-pie-chart")
            .on("plotly_click", this.onSliceClick);
        });
      } catch (error) {
        console.error("Error fetching skill level data:", error);
      }
    },
    onSliceClick(eventData) {
      if (eventData.points && eventData.points.length > 0) {
        const sliceLabel = eventData.points[0].label; // ดึง label (ชื่อ skill level)
        console.log("Emitting Skill Level Label:", sliceLabel);
        this.$emit("filter", sliceLabel); // ส่ง label ไปยัง parent component
      } else {
        console.error("Invalid Plotly Event Data:", eventData);
      }
    },
  },
};
</script>

<style scoped>
#skill-level-pie-chart {
  width: 100%;
  height: 100%;
}
</style>
