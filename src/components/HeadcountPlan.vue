<!-- <template>
    <div id="headcount-chart"></div>
  </template>
  
  <script>
  import Plotly from "plotly.js";
  
  export default {
    name: "HeadcountPlan",
    props: {
      data: Object,
    },
    mounted() {
      this.drawChart();
    },
    methods: {
      drawChart() {
        const { processes, headcount, plan } = this.data;
  
        const chartData = [
          {
            x: processes,
            y: headcount,
            type: "bar",
            name: "Headcount",
            marker: { color: "blue" },
          },
          {
            x: processes,
            y: plan,
            type: "bar",
            name: "Plan",
            marker: { color: "red" },
          },
        ];
  
        const layout = {
          title: "Headcount vs Plan",
          barmode: "group",
          height: 300,
          xaxis: { title: "Process" },
          yaxis: { title: "Count", range: [0, 250] },
          responsive: true,
        };
  
        Plotly.newPlot("headcount-chart", chartData, layout);
      },
    },
  };
  </script>
   -->