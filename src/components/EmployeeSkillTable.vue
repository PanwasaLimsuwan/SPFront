<template>
  <div class="employee-skill-table">
    <h3>Employee Skill</h3>
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>EmpID</th>
          <th>Firstname</th>
          <th>Lastname</th>
          <th v-for="skill in skills" :key="skill">{{ skill }}</th>
          <th>Select</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(employee, index) in employees" :key="employee.empID">
          <td>{{ index + 1 }}</td>
          <td>{{ employee.empID }}</td>
          <td>{{ employee.firstName }}</td>
          <td>{{ employee.lastName }}</td>
          <td
            v-for="skill in skills"
            :key="skill"
            :class="getSkillLevelClass(employee[skill])"
          >
            {{ employee[skill] }}
          </td>
          <td>
            <button @click="selectEmployee(employee)">
              <img src="skill.png" alt="Skill" class="skill-icon" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "EmployeeSkillTable",
  data() {
    return {
      employees: [],  // รายการพนักงาน
      skills: [
        "material", "operation", "machine_SAB1", "machine_SAB2", "machine_SAB3", "inspection"
      ],  // รายการทักษะ
    };
  },
  methods: {
    async fetchEmployeeSkills() {
      try {
        const response = await axios.get("http://localhost:5000/api/EmployeeSkill");
        this.employees = response.data;  // เก็บข้อมูลจาก API
      } catch (error) {
        console.error("There was an error fetching the data:", error);
      }
    },
    selectEmployee(employee) {
      // Emit ข้อมูลพนักงานที่ถูกเลือกไปยังพ่อแม่คอมโพเนนต์
      this.$emit('selectEmployee', employee);
    },
    getSkillLevelClass(level) {
      return `level-${level}`;  // Dynamically assign class based on skill level
    },
  },
  mounted() {
    this.fetchEmployeeSkills();  // เมื่อ component ถูก mount ให้ดึงข้อมูลจาก API
  },
};
</script>

<style scoped>
.employee-skill-table {
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

.legend {
  margin-top: 10px;
  display: flex;
  justify-content: space-around;
}

.legend-dot {
  width: 15px;
  height: 15px;
  display: inline-block;
  border-radius: 50%;
  margin-right: 5px;
}

.level-0 {
  background: #ddd;
}

.level-1 {
  background: red;
}

.level-2 {
  background: yellow;
}

.level-3 {
  background: green;
}

button {
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.skill-icon {
  width: 30px;
  height: 30px;
}
</style>
