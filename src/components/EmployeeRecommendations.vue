<template>
  <div class="employee-recommendations">
    <h3>แนะนำพนักงาน</h3>
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>EmpID</th>
          <th>Firstname</th>
          <th>Lastname</th>
          <th>Work Time</th>
          <th>Skill</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(employee, index) in employees" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ employee.empID }}</td>
          <td>{{ employee.firstName }}</td>
          <td>{{ employee.lastName }}</td>
          <td>{{ employee.workedHours || '-' }}</td> <!-- แสดงค่า Work Time -->
          <td>{{ employee.skillGroup || '-' }}</td>  <!-- แสดงค่า SkillGroup -->
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "EmployeeRecommendations",
  data() {
    return {
      employees: []  // สร้างตัวแปร employees เพื่อเก็บข้อมูลจาก API
    };
  },
  mounted() {
    this.fetchEmployeeData();  // เมื่อ component ถูก mount ให้ดึงข้อมูลจาก API
  },
  methods: {
    // ฟังก์ชันในการดึงข้อมูลจาก API
    async fetchEmployeeData() {
      try {
        const response = await axios.get("http://localhost:5000/api/RecEmployee");  // ชื่อ API จาก Backend
        console.log("Data from API:", response.data);  // ดูข้อมูลที่ได้รับ
        this.employees = response.data;  // เก็บข้อมูลในตัวแปร employees
      } catch (error) {
        console.error("There was an error fetching the data:", error);
      }
    },
  },
};
</script>

<style scoped>
  .employee-recommendations {
    margin-top: 20px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 10px;
    text-align: center;
    border: 1px solid #ddd;
  }

  th {
    background-color: #f4f4f4;
  }

  .skill-icon {
    width: 30px;
    height: 30px;
    padding: 5px; /* เพิ่มระยะห่างรอบ ๆ ไอคอน */
  }
</style>
