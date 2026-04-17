<template>
  <div class="employee-skill-table">
    <h3>Employee Skill</h3>

    <!-- ✅ Legend/Filter Buttons แบบ EmployeeRecommendation -->
    <!-- <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap"> -->
      <button class="refresh-skill-btn" @click="resetFilter" title="รีเซต">
        <img src="refresh.png" alt="Refresh" class="icon" />
        <span>Refresh</span>
      </button>
    <!-- </div> -->
    <div class="legend">
  <button
    v-for="level in [0,1,2,3]"
    :key="level"
    class="legend-btn"
    :class="{ [`active-${level}`]: selectedSkillLevel === level }"
    @click="filterBySkillLevel(level)"
  >
    <span :class="'legend-dot dot-' + level"></span>
    {{ ['Not Trained','Basic','Medium','Expert'][level] }}
  </button>

  <!-- <button class="refresh-skill-btn" @click="selectedSkillLevel = null">
    รีเซต
  </button> -->
</div>

    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th rowspan="2">EmpID</th>
            <th rowspan="2">Firstname</th>
            <th rowspan="2">Lastname</th>
            <th colspan="6" style="background: #dbeafe; color: #1e40af">ระดับ Skill</th>
            <th rowspan="2">Select</th>
          </tr>
          <tr>
            <th style="background: #eff6ff" v-for="skill in skills" :key="skill">{{ skill }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredEmployees.length === 0">
            <td :colspan="3 + skills.length + 1" class="empty-msg">
              ไม่พบพนักงานที่ตรงกับเงื่อนไข
            </td>
          </tr>
          <tr v-for="employee in filteredEmployees" :key="employee.empID">
            <td>{{ employee.empID }}</td>
            <td>{{ employee.firstName }}</td>
            <td>{{ employee.lastName }}</td>
            <td
              v-for="skill in skills"
              :key="skill"
              class="skill-td"
            >
              <span
                v-if="selectedSkillLevel === null || employee[skill] === selectedSkillLevel"
                :class="skillCellClass(employee[skill])"
              >
                {{ getSkillLevel(employee[skill]) }}
              </span>
              <!-- ✅ Cell ที่ไม่ตรง filter จะ dim ลง -->
              <span v-else class="cell-dimmed">—</span>
            </td>
            <td>
              <button
                :class="{ 'active-button': employee.empID === selectedEmployee?.empID }"
                @click="selectEmployee(employee)"
                :title="employee.empID === selectedEmployee?.empID
                  ? 'กำลังดูข้อมูล ' + employee.firstName + ' ' + employee.lastName
                  : 'ดูข้อมูลสกิล'"
              >
                <img src="skill.png" alt="Skill" class="skill-icon" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  selectedEmployee: Object,
  selectedSkillFilter: [String, Number, null],
  filters: Object,
});

const emit = defineEmits(['selectEmployee', 'clear-skill']);

const employees = ref([]);
const selectedSkillLevel = ref(null);

const skills = [
  "material",
  "operation",
  "machineSAB1",
  "machineSAB2",
  "machineSAB3",
  "inspection",
];

const skillLevels = [
  { label: "Not Trained (0)", value: 0 },
  { label: "Basic (1)",       value: 1 },
  { label: "Medium (2)",      value: 2 },
  { label: "Expert (3)",      value: 3 },
];

// ✅ ฟังก์ชัน label เหมือน EmployeeRecommendation
const getSkillLevel = (level) =>
  ["Not Trained", "Basic", "Medium", "Expert"][level] ?? "Unknown";

// ✅ class cell เหมือน EmployeeRecommendation
const skillCellClass = (level) =>
  ["cell-level-0", "cell-level-1", "cell-level-2", "cell-level-3"][level] ?? "";

const filteredEmployees = computed(() => {
  let filtered = employees.value;

  if (props.selectedSkillFilter != null) {
    if (props.selectedSkillFilter === 3) {
      filtered = filtered.filter(emp => skills.every(s => emp[s] === 3));
    } else if (props.selectedSkillFilter === 0) {
      filtered = filtered.filter(emp => {
        const count = skills.reduce((c, s) => (emp[s] === 0 || emp[s] === 1 ? c + 1 : c), 0);
        return count > 2;
      });
    } else {
      filtered = filtered.filter(emp => skills.some(s => emp[s] === props.selectedSkillFilter));
    }
  }

  if (selectedSkillLevel.value !== null) {
    filtered = filtered.filter(emp =>
      skills.some(s => emp[s] === selectedSkillLevel.value)
    );
  }

  return filtered;
});

const fetchEmployeeSkills = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/Skill", {
      params: {
        division:   props.filters?.division   !== 'ALL' ? props.filters.division   : undefined,
        department: props.filters?.department !== 'ALL' ? props.filters.department : undefined,
        section:    props.filters?.section    !== 'ALL' ? props.filters.section    : undefined,
        biz:        props.filters?.biz        !== 'ALL' ? props.filters.biz        : undefined,
        process:    props.filters?.process    !== 'ALL' ? props.filters.process    : undefined,
      }
    });
    employees.value = response.data;
  } catch (error) {
    console.error("Error fetching employee skills:", error);
  }
};

const selectEmployee = (employee) => emit('selectEmployee', employee);

const filterBySkillLevel = (level) => {
  selectedSkillLevel.value = selectedSkillLevel.value === level ? null : level;
};

const resetFilter = () => {
  selectedSkillLevel.value = null;
  emit('clear-skill');
};

watch(() => props.filters, fetchEmployeeSkills, { deep: true });
onMounted(fetchEmployeeSkills);
</script>

<style scoped>
/* ✅ Legend Buttons (แบบ EmployeeRecommendation) */
.legend {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  align-items: center;
}

.legend-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1.5px solid #d1d5db;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  transition: all 0.2s;
  user-select: none;
}

.legend-btn:hover  { background: #e5e7eb; }
.legend-btn.active-0 { background: #d1d5db; border-color: #6b7280; color: #111827; }
.legend-btn.active-1 { background: #ef4444; border-color: #b91c1c; color: #fff; }
.legend-btn.active-2 { background: #eab308; border-color: #a16207; color: #fff; }
.legend-btn.active-3 { background: #16a34a; border-color: #15803d; color: #fff; }

.legend-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.dot-0 { background: #d1d5db; }
.dot-1 { background: #ef4444; }
.dot-2 { background: #eab308; }
.dot-3 { background: #16a34a; }

/* ✅ Skill Cells เหมือน EmployeeRecommendation */
.skill-td {
  padding: 0 !important;
  height: 1px;
}
.cell-level-0,
.cell-level-1,
.cell-level-2,
.cell-level-3 {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 36px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  box-sizing: border-box;
  padding: 8px 4px;  /* ✅ เพิ่ม padding */
}
.cell-level-0 { background: #d1d5db; color: #374151; }
.cell-level-1 { background: #ef4444; color: #fff; }
.cell-level-2 { background: #eab308; color: #fff; }
.cell-level-3 { background: #16a34a; color: #fff; }

.cell-dimmed {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  background: #f3f4f6;
  color: #d1d5db;
  font-size: 11px;
  font-weight: 600;
}

/* ✅ Refresh Button */
.refresh-skill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
  transition: background .2s, transform .2s;
  /* margin-left: auto; */
}
.refresh-skill-btn:hover { background: #0056b3; transform: scale(1.05); }
.refresh-skill-btn .icon { width: 16px; height: 16px; filter: invert(1); }

/* ✅ Table */
.employee-skill-table {  margin-top: 16px; }
.table-scroll { max-height: 420px; overflow: auto; border-radius: 10px; border: 1px solid #e5e7eb; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 7px 9px; text-align: center; border: 1px solid #e5e7eb; }
th { background: #f3f4f6; font-weight: 600; position: sticky; top: 0; z-index: 1; }
tr:hover { background: #f9fafb; }
.empty-msg { text-align: center; padding: 24px; color: #9ca3af; font-size: 14px; }

/* ✅ Select Button */
button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: transform .2s, box-shadow .2s;
}
button:hover { transform: scale(1.08); box-shadow: 0 0 5px rgba(0,123,255,.25); }
.active-button {
  background: #007bff;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 0 10px rgba(0,123,255,.45);
}
.skill-icon { width: 28px; height: 28px; }
</style>