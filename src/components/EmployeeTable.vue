<template>
  <div class="employee-table">
    <h3>Head Count</h3>
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>EmpID</th>
          <th>Firstname</th>
          <th>Lastname</th>
          <th class="datetime-column">Date-time</th>
          <th>Gate No</th>
          <th>Division</th>
          <th>Department</th>
          <th>Biz</th>
          <th>Process</th>
          <th>CourseGroup</th>
          <th>WorkGroup</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(employee, index) in employees" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ employee.empID }}</td>
          <td>{{ employee.firstName }}</td>
          <td>{{ employee.lastName }}</td>
          <td class="datetime-column">{{ employee.checkInDateTime || '-' }}</td> <!-- แก้ไขเป็น checkInDateTime -->
          <td>{{ employee.gateNo || '-' }}</td> <!-- แก้ไขให้แสดงค่า "-" เมื่อไม่มีข้อมูล -->
          <td>{{ employee.division || '-' }}</td>
          <td>{{ employee.department || '-' }}</td>
          <td>{{ employee.biz || '-' }}</td>
          <td>{{ employee.process || '-' }}</td>
          <td>{{ employee.courseGroup || '-' }}</td>
          <td>{{ employee.workGroup || '-' }}</td>
          <td :class="getStatusClass(employee.cStatus)">
            {{ employee.cStatus || '-' }} <!-- เพิ่มการแสดงค่า "-" เมื่อไม่มีข้อมูล -->
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "EmployeeTable",
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
        const response = await axios.get("http://localhost:5000/api/EmployeeGateEntry");
        console.log("Data from API:", response.data);  // ดูข้อมูลที่ได้รับ
        this.employees = response.data;  // เก็บข้อมูลในตัวแปร employees
      } catch (error) {
        console.error("There was an error fetching the data:", error);
      }
    },
    getStatusClass(status) {
      return {
        "status-in-cleanroom": status === "IN",
        "status-out-cleanroom": status === "OUT",
        "status-missing": status === "ขาดงาน",
      };
    },
  },
};
</script>

<style scoped>
  .employee-table {
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

  .status-in-cleanroom {
    color: green;
  }

  .status-out-cleanroom {
    color: orange;
  }

  .status-missing {
    color: red;
  }

  .datetime-column {
    white-space: nowrap;
  }
</style>
