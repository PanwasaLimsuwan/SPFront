<template>
    <div>
      <h1>Employee List</h1>
      <ul>
        <li v-for="employee in employees" :key="employee.EmpID">
          {{ employee.FirstName }} {{ employee.LastName }} - {{ employee.Division }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        employees: []
      };
    },
    created() {
      this.getEmployees();
    },
    methods: {
      async getEmployees() {
        try {
          const response = await axios.get('http://localhost:5000/api/employee/all');
          this.employees = response.data;
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  /* ใส่สไตล์ของคุณที่นี่ */
  </style>
  