<template>
  <div v-if="employee" class="employee-section">
    <h3>{{ employee.firstName }} {{ employee.lastName }}</h3>
    <div v-for="skill in skills" :key="skill">
      <p>{{ skill }}: Level {{ employee[skill] }}</p>
      <div
        class="skill-bar"
        :style="{ 
          background: `linear-gradient(to right, ${getSkillColor(employee[skill])} ${(employee[skill] / 3) * 100}%, #ddd ${(employee[skill] / 3) * 100}%)`,
          width: '100%'
        }"
      ></div>
    </div>
  </div>
  <p v-else>กรุณาเลือกพนักงาน</p>
</template>

<script>
export default {
  props: {
    // กำหนด array ของฟิลด์ที่ต้องการแสดง
    skills: {
      type: Array,
      required: true,
      default: () => ['material', 'operation', 'machine_SAB1', 'machine_SAB2', 'machine_SAB3', 'inspection']
    },
    employee: {
      type: Object,
      default: null,
    },
  },
  methods: {
    getSkillColor(level) {
      if (level === 3) return "green";  // ถ้าระดับ 3 สีเขียว
      if (level === 2) return "yellow"; // ถ้าระดับ 2 สีเหลือง
      if (level === 1) return "red";    // ถ้าระดับ 1 สีแดง
      if (level === 0) return "gray";   // ถ้าระดับ 0 สีเทา
      return "transparent"; // กรณีที่ไม่มีข้อมูล
    },
  },
};
</script>

<style scoped>
.employee-section {
  margin-top: 20px;
}

.skill-bar {
  height: 20px;
  margin-bottom: 10px;
  border-radius: 5px;
  background-color: gray; /* กำหนดสีพื้นฐาน */
}
</style>
