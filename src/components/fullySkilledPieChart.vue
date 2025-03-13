<template>
  <div id="fully-skilled-pie-chart"></div>
</template>

<script>
import Plotly from "plotly.js";
import axios from "axios";

export default {
  name: "FullySkilledPieChart",
  data() {
    return {
      pieData: {
        values: [],
        labels: ["Fully Skilled", "Need Training"],
      },
    };
  },
  mounted() {
    this.fetchSkillData();
  },
  methods: {
    async fetchSkillData() {
      try {
        const response = await axios.get('http://localhost:5000/api/FullySkill'); // เปลี่ยน URL ตามที่ API ของคุณใช้งาน
        const data = response.data;

        // กำหนดค่าที่ดึงมาให้กับ Pie Chart
        this.pieData.values = [data["3"], data["Other"]];
        this.drawChart();
      } catch (error) {
        console.error("Error fetching skill data:", error);
      }
    },
    drawChart() {
      const chartData = [
        {
          values: this.pieData.values, // ค่าใน Pie Chart
          labels: this.pieData.labels, // Labels เช่น "Fully Skilled", "Need Training"
          type: "pie",
          marker: {
            colors: ["green", "red"], // สีสำหรับแต่ละส่วน
          },
        },
      ];

      const layout = {
        title: "Skill Competency Overview", // ชื่อกราฟ
        height: 450,
        width: 450,
        paper_bgcolor: 'rgba(0,0,0,0)', // พื้นหลังเป็น transparent
      };

      Plotly.newPlot("fully-skilled-pie-chart", chartData, layout).then(() => {
        document
          .getElementById("fully-skilled-pie-chart")
          .on("plotly_click", this.onSliceClick);
      });
    },
    onSliceClick(eventData) {
      if (eventData.points && eventData.points.length > 0) {
        const sliceLabel = eventData.points[0].label; // ดึง label (ชื่อของ slice)
        this.$emit("filter", sliceLabel); // ส่ง label ไปยัง parent component
      }
    },
  },
};
</script>

<style scoped>
#fully-skilled-pie-chart {
  width: 100%;
  height: 100%;
}
</style>
