<script setup>
import {
  ref,
  markRaw,
  computed,
  onMounted,
  watch,
  defineComponent,
  h,
  nextTick,
} from "vue";
import axios from "axios";
import draggable from "vuedraggable";
import jwt_decode from "jwt-decode";

import HeadcountStatusHR from "../components/HeadcountStatusHR.vue";
import EmployeeSkillTable from "../components/EmployeeSkillTable.vue";
import EmployeeSkillSection from "../components/EmployeeSkillSection.vue";
import fullySkilledPieChart from "../components/fullySkilledPieChart.vue";
import HeadcountTransition from "../components/HeadcountTransition.vue";
import MonthlyOvertime from "../components/MonthlyOvertime.vue";
import MonthlyAbsentTrend from "./../components/MonthlyAbsentTrend.vue";
import HeadcountEmployee from "./../components/HeadcountEmployee.vue";
import EmployeeHeadcount from "./../components/EmployeeHeadcount.vue";
import TrainingEmployee from "./../components/TrainingEmployee.vue";
import EmployeeHeadcountHR from "@/components/EmployeeHeadcountHR.vue";
import StatusTabHR from "@/components/StatusTabHR.vue";
import InsightsWidget from "../components/InsightsWidget.vue";
import Logout from "../views/Logout";

const API_BASE = "http://localhost:5000/api";

// ✅ ตัวแปรหลัก
const employees = ref([]);
const selectedStatus = ref(null);
const selectedSkill = ref(null);
const selectedEmployee = ref(null);
const skills = ref([]);
const retrievedIds = ref([]);
const widgets = ref([]);
const availableWidgets = ref([]);

// ✅ Filter options
const filters = ref({
  division: "ALL",
  department: "ALL",
  section: "ALL",
  biz: "ALL",
  process: "ALL",
});

// ✅ Dynamic dropdown options
const divisions = computed(() => [
  ...new Set(employees.value.map((e) => e.division).filter(Boolean)),
]);
const departments = computed(() => [
  ...new Set(employees.value.map((e) => e.department).filter(Boolean)),
]);
const sections = computed(() => [
  ...new Set(employees.value.map((e) => e.section).filter(Boolean)),
]);
const bizs = computed(() => [
  ...new Set(employees.value.map((e) => e.biz).filter(Boolean)),
]);
const processes = computed(() => [
  ...new Set(employees.value.map((e) => e.process).filter(Boolean)),
]);

// ✅ Filter function
const filteredEmployees = computed(() => {
  return employees.value.filter((emp) => {
    const matchDivision =
      filters.value.division === "ALL" ||
      emp.division === filters.value.division;
    const matchDepartment =
      filters.value.department === "ALL" ||
      emp.department === filters.value.department;
    const matchSection =
      filters.value.section === "ALL" || emp.section === filters.value.section;
    const matchBiz =
      filters.value.biz === "ALL" || emp.biz === filters.value.biz;
    const matchProcess =
      filters.value.process === "ALL" || emp.process === filters.value.process;

    return (
      matchDivision &&
      matchDepartment &&
      matchSection &&
      matchBiz &&
      matchProcess
    );
  });
});

// ✅ Event handlers
const filterEmployeesByStatus = (status) => {
  selectedStatus.value = status;
};

const clearStatusFilter = () => {
  console.log("🔄 Dashboard clearing status filter");
  selectedStatus.value = null;
};

const filterEmployeesBySkill = (skill) => {
  selectedSkill.value = skill;
};

const clearSkillFilter = () => {
  console.log("🔄 [Dashboard] Clearing skill filter");
  selectedSkill.value = null;
};

const selectEmployee = (employee) => {
  selectedEmployee.value = employee;
};

// ✅ Skills Block Component
const SkillsBlock = defineComponent({
  name: "SkillsBlock",
  components: {
    FullySkilledPieChart: fullySkilledPieChart,
    EmployeeSkillTable,
    EmployeeSkillSection,
  },
  props: {
    filters: Object,
    selectedSkill: Number,
    selectedEmployee: Object,
    employees: Array,
    skills: Array,
  },
  emits: ["filter-skills", "clear-skill", "selectEmployee"],
  setup(props, { emit }) {
    console.log("🎨 [SkillsBlock] Setup");

    return () =>
      h("div", { class: "skills-block" }, [
        h("div", { class: "skills-left" }, [
          h(fullySkilledPieChart, {
            filters: props.filters,
            onFilterSkills: (skill) => {
              console.log(
                "🎯 [SkillsBlock] Pie clicked, emitting filter-skills:",
                skill
              );
              emit("filter-skills", skill);
            },
          }),
        ]),

        h("div", { class: "skills-right skill-section-container" }, [
          h("div", { class: "skill-table" }, [
            h(EmployeeSkillTable, {
              selectedSkillFilter: props.selectedSkill,
              employees: props.employees,
              selectedEmployee: props.selectedEmployee,
              filters: props.filters,
              onClearSkill: () => {
                console.log(
                  "🎯 [SkillsBlock] Table clear, emitting clear-skill"
                );
                emit("clear-skill");
              },
              onSelectEmployee: (e) => emit("selectEmployee", e),
            }),
          ]),
          props.selectedEmployee
            ? h("div", { class: "skill-detail" }, [
                h(EmployeeSkillSection, {
                  employee: props.selectedEmployee,
                  skills: props.skills,
                  filters: props.filters,
                }),
              ])
            : null,
        ]),
      ]);
  },
});

// ฟังก์ชันโหลด widget definitions
const fetchAvailableWidgets = async () => {
  try {
    const response = await axios.get(`${API_BASE}/AdminWidget`);
    availableWidgets.value = response.data.filter((w) => w.isActive);
    console.log("✅ Available widgets loaded:", availableWidgets.value);
  } catch (error) {
    console.error("❌ Error fetching widget definitions:", error);
  }
};

// Component mapping
const componentMap = {
  InsightsWidget: markRaw(InsightsWidget),
  HeadcountStatusHR: markRaw(HeadcountStatusHR),
  EmployeeHeadcountHR: markRaw(EmployeeHeadcountHR),
  SkillsBlock: markRaw(SkillsBlock),
  HeadcountEmployee: markRaw(HeadcountEmployee),
  EmployeeHeadcount: markRaw(EmployeeHeadcount),
  headcountTransition: markRaw(HeadcountTransition),
  TrainingEmployee: markRaw(TrainingEmployee),
  MonthlyAbsentTrend: markRaw(MonthlyAbsentTrend),
  MonthlyOvertime: markRaw(MonthlyOvertime),
};

// ฟังก์ชันสร้าง widgets จาก API definitions
const buildWidgetsFromDefinitions = () => {
  const builtWidgets = availableWidgets.value
    .map((def) => ({
      id: def.widgetId,
      title: def.displayName,
      comp: componentMap[def.componentName] || null,
      span2: def.span2,
      binds: () => {
        const baseBinds = {
          filters: filters.value || {
            division: "ALL",
            department: "ALL",
            section: "ALL",
            biz: "ALL",
            process: "ALL",
          },
        };

        switch (def.widgetId) {
          case "InsightsWidget":
            return baseBinds;
          case "HeadcountStatusHR":
            return baseBinds;

          case "EmployeeHeadcountHR":
            return {
              ...baseBinds,
              filterStatus: selectedStatus.value,
            };

          case "SkillsBlock":
            return {
              ...baseBinds,
              selectedSkill: selectedSkill.value,
              selectedEmployee: selectedEmployee.value,
              employees: filteredEmployees.value,
              skills: skills.value,
            };

          case "HeadcountEmployee":
            return baseBinds;

          case "EmployeeHeadcount":
            return {
              ...baseBinds,
              filterStatus: selectedStatus.value,
            };

          case "headcountTransition":
          case "TrainingEmployee":
          case "MonthlyAbsentTrend":
          case "MonthlyOvertime":
            return baseBinds;

          default:
            return baseBinds;
        }
      },
      on: () => {
        switch (def.widgetId) {
          case "HeadcountStatusHR":
            return { filterStatus: filterEmployeesByStatus };
          case "EmployeeHeadcountHR":
            return { clearStatus: clearStatusFilter };
          case "SkillsBlock":
            return {
              filterSkills: filterEmployeesBySkill,
              clearSkill: clearSkillFilter,
              selectEmployee,
            };
          default:
            return {};
        }
      },
    }))
    .filter((w) => w.comp !== null);

  return builtWidgets;
};

// ✅ Helper function to apply layout from IDs
function applyLayoutFromIds(ids) {
  if (!ids || ids.length === 0) return;
  
  const map = new Map(widgets.value.map((w) => [w.id, w]));
  const ordered = ids.map((id) => map.get(id)).filter(Boolean);
  const rest = widgets.value.filter((w) => !ids.includes(w.id));
  widgets.value = [...ordered, ...rest];
}

// ✅ Fetch widget settings
const fetchWidgetSettings = async () => {
  const token = localStorage.getItem("token");

  if (!token) return [];

  try {
    const decodedToken = jwt_decode(token);
    const userEmail = decodedToken.sub;

    if (!userEmail) return [];

    const response = await axios.get(
      `${API_BASE}/admin/get-user-id?email=${userEmail}`
    );
    const user_id = response.data.user_id;
    if (!user_id) return [];

    const widgetResponse = await axios.get(
      `${API_BASE}/widget/get-widget-settings/${user_id}`
    );

    if (!widgetResponse.data || !widgetResponse.data.widgets) return [];

    // ✅ Use .value for ref
    retrievedIds.value = widgetResponse.data.widgets.map((widget) => widget.id);

    // Apply layout if widgets are already initialized
    if (widgets.value.length > 0) {
      applyLayoutFromIds(retrievedIds.value);
    }

    // Apply visibility settings
    const settings = widgetResponse.data.widgets;
    if (Array.isArray(settings)) {
      widgets.value.forEach((widget) => {
        const widgetSetting = settings.find(
          (setting) => setting.id === widget.id
        );
        if (widgetSetting) {
          visibility.value[widget.id] = widgetSetting.visibility;
        }
      });
    }

    return retrievedIds.value;
  } catch (error) {
    console.error("Error fetching widget settings:", error);
    return [];
  }
};

// ✅ Save widget settings
const saveWidgetSettings = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found");
    return;
  }

  try {
    const decodedToken = jwt_decode(token);
    const userEmail = decodedToken.sub;

    if (!userEmail) {
      console.error("User email (sub) not found in token");
      return;
    }

    const response = await axios.get(
      `${API_BASE}/admin/get-user-id?email=${userEmail}`
    );
    const user_id = response.data.user_id;
    if (!user_id) {
      console.error("User ID not found in database");
      return;
    }

    const settings = {
      widgets: widgets.value.map((widget) => ({
        id: widget.id,
        visibility: visibility.value[widget.id],
      })),
    };

    const settingsJson = JSON.stringify(settings);

    await axios.post(`${API_BASE}/widget/save-widget-settings`, {
      user_id: user_id,
      settings: settingsJson,
    });

    console.log("✅ Widget settings saved");

    // Update retrievedIds to reflect current order
    retrievedIds.value = widgets.value.map((w) => w.id);
  } catch (error) {
    console.error("Error saving widget settings:", error);
  }
};

// ✅ Visibility
const panelOpen = ref(false);
const visibility = ref({});

const niceNames = computed(() => {
  const names = {};
  for (const def of availableWidgets.value) {
    names[def.widgetId] = def.displayName;
  }
  return names;
});

// Watch widgets changes to update visibility
watch(
  widgets,
  () => {
    const v = { ...visibility.value };
    for (const w of widgets.value) {
      if (typeof v[w.id] !== "boolean") v[w.id] = true;
    }
    for (const k of Object.keys(v)) {
      if (!widgets.value.find((w) => w.id === k)) delete v[k];
    }
    visibility.value = v;
  },
  { deep: true }
);

// ✅ Drag
const isDragging = ref(false);

const onDragEnd = async () => {
  console.log("🔄 Drag ended, saving widget order...");
  isDragging.value = false;
  await saveWidgetSettings();
};

// Watch visibility changes
watch(
  visibility,
  () => {
    if (!isDragging.value) {
      saveWidgetSettings();
    }
  },
  { deep: true }
);

// ✅ Init visibility default
function initVisibilityDefault() {
  const v = {};
  for (const w of widgets.value) v[w.id] = true;
  visibility.value = v;
}

// ✅ Main onMounted
onMounted(async () => {
  console.log("🚀 Dashboard mounting...");

  // 1. Load employee data
  try {
    const response = await axios.get(`${API_BASE}/EmployeeInfo`);
    employees.value = response.data;
    console.log("✅ Employees loaded:", employees.value.length);
  } catch (error) {
    console.error("❌ Error fetching employees:", error);
  }

  // 2. Load widget definitions from API
  await fetchAvailableWidgets();
  console.log("✅ Available widgets loaded:", availableWidgets.value.length);

  // 3. Build widgets from definitions
  const builtWidgets = buildWidgetsFromDefinitions();
  console.log("✅ Built widgets:", builtWidgets.length);

  // 4. Load user settings (order + visibility)
  const savedOrder = await fetchWidgetSettings();
  console.log("✅ Saved widget order:", savedOrder);

  // 5. Arrange widgets according to user settings or default order
  if (savedOrder && savedOrder.length > 0) {
    console.log("📌 Applying saved order");
    retrievedIds.value = savedOrder;

    const map = new Map(builtWidgets.map((w) => [w.id, w]));
    const ordered = savedOrder.map((id) => map.get(id)).filter(Boolean);
    const rest = builtWidgets.filter((w) => !savedOrder.includes(w.id));
    widgets.value = [...ordered, ...rest];
  } else {
    console.log("📌 Using default displayOrder");
    widgets.value = builtWidgets.sort((a, b) => {
      const defA = availableWidgets.value.find((d) => d.widgetId === a.id);
      const defB = availableWidgets.value.find((d) => d.widgetId === b.id);
      return (defA?.displayOrder || 999) - (defB?.displayOrder || 999);
    });
  }

  console.log("✅ Final widget order:", widgets.value.map((w) => w.id));

  // 6. Initialize visibility defaults
  initVisibilityDefault();

  // 7. Wait for DOM update before charts render
  await nextTick();
  console.log("✅ DOM updated, ready for chart rendering");
});

function showAll() {
  for (const id of Object.keys(visibility.value)) visibility.value[id] = true;
}

function hideAll() {
  for (const id of Object.keys(visibility.value)) visibility.value[id] = false;
}
</script>

<template>
  <div class="DashboardHR">
    <header class="header">
      <div class="logo-title">
        <a href="https://realtimemonitoring-dashboard.netlify.app/dashboard" class="logo">
          <img src="logo2.png" alt="Sony Logo" />
        </a>
        <h1>Real time monitoring dashboard for leader allocation</h1>
        <h1 style="color: red">For HR</h1>
      </div>
      <Logout />
      <div class="filters">
        <select v-model="filters.division">
          <option value="ALL">Division : ALL</option>
          <option
            v-for="division in divisions"
            :key="division"
            :value="division"
          >
            {{ division }}
          </option>
        </select>
        <select v-model="filters.department">
          <option value="ALL">Department : ALL</option>
          <option
            v-for="department in departments"
            :key="department"
            :value="department"
          >
            {{ department }}
          </option>
        </select>
        <select v-model="filters.section">
          <option value="ALL">Section : ALL</option>
          <option v-for="section in sections" :key="section" :value="section">
            {{ section }}
          </option>
        </select>
        <select v-model="filters.biz">
          <option value="ALL">Biz : ALL</option>
          <option v-for="biz in bizs" :key="biz" :value="biz">{{ biz }}</option>
        </select>
        <select v-model="filters.process">
          <option value="ALL">Process : ALL</option>
          <option v-for="process in processes" :key="process" :value="process">
            {{ process }}
          </option>
        </select>
      </div>
      <button
        class="btn-customize"
        @click="panelOpen = !panelOpen"
        title="Customize widgets"
      >
        ⚙️ Customize
      </button>
    </header>

    <section class="stats">
      <StatusTabHR :filters="filters" />
    </section>

    <!-- ✅ Draggable widgets -->
    <draggable
      v-model="widgets"
      item-key="id"
      @start="isDragging = true"
      @end="onDragEnd"
      class="grid-two-col"
      ghost-class="drag-ghost"
      handle=".drag-handle"
      :animation="200"
    >
      <template #item="{ element }">
        <div
          v-if="visibility[element.id] !== false"
          class="card"
          :class="{ 'span-2': element?.span2 }"
        >
          <div class="card-bar">
            <span class="drag-handle" title="ลากเพื่อย้าย">⠿</span>
            <button
              class="icon-btn eye-toggle"
              :aria-pressed="visibility[element.id] !== false"
              :title="
                visibility[element.id] === false ? 'Show widget' : 'Hide widget'
              "
              @click.stop="visibility[element.id] = !visibility[element.id]"
            >
              👁️
            </button>
          </div>

          <component
            :key="`${element.id}-${visibility[element.id]}`"
            :is="element.comp"
            v-bind="element.binds()"
            v-on="element.on()"
          />
        </div>
      </template>
    </draggable>

    <!-- ✅ Customize panel -->
    <aside
      class="customize-panel"
      :class="{ open: panelOpen }"
      @keydown.esc="panelOpen = false"
    >
      <div class="cp-head">
        <h3>แสดง / ซ่อน วิดเจ็ต</h3>
        <button class="cp-close" @click="panelOpen = false">✕</button>
      </div>

      <div class="cp-actions">
        <button class="cp-btn" @click="showAll()">Show all</button>
        <button class="cp-btn" @click="hideAll()">Hide all</button>
      </div>

      <ul class="cp-list">
        <li v-for="w in widgets" :key="w.id">
          <label class="cp-row">
            <input type="checkbox" v-model="visibility[w.id]" />
            <span class="cp-name">{{ niceNames[w.id] ?? w.id }}</span>
          </label>
        </li>
      </ul>
      <!-- <p class="cp-hint">การตั้งค่านี้จะถูกบันทึกถาวร</p> -->
    </aside>
    <div
      class="customize-backdrop"
      :class="{ show: panelOpen }"
      @click="panelOpen = false"
    ></div>
  </div>
</template>

<style>
.dashboard {
  font-family: Arial, sans-serif;
  padding: 20px;
  background-color: #f9f9f9;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 10px 20px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}
.btn-customize:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3),
              0 4px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-color: #2563eb;
}

/* เอฟเฟกต์เมื่อกด */
.btn-customize:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}
.cp-btn {
  padding: 10px 20px;
  border: 2px solid #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2),
              0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}
.cp-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3),
              0 4px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-color: #2563eb;
}
.cp-close {
  padding: 10px 20px;
  border: 2px solid #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2),
              0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}
.cp-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3),
              0 4px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-color: #2563eb;
}

.logo {
  width: 150px;
}

.filters select,
.filters input {
  margin-left: 10px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.stats {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  gap: 20px;
}

.charts {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  gap: 20px;
}

.chart {
  flex: 1;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

.table {
  flex: 1;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

button {
  color: white;
  float: right;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

button:hover {
  background-color: #0056b3;
}

.refresh-icon {
  width: 20px;
  height: 20px;
}

.stats {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  width: 180px;
  transition: transform 0.2s;
  justify-content: space-between;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-left: 20px;
}

.icon {
  width: 48px;
  height: 48px;
}

.status-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.content {
  text-align: right;
}

h3 {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

h3.red {
  color: #ff0000;
}

p {
  font-size: 14px;
  margin: 4px 0 0;
}

.sub-label {
  font-size: 16px;
  color: #888;
}

.skill-section-container {
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: flex-start;
}

.skill-table,
.skill-detail {
  flex: 1;
}
</style>