<template>
    <div class="DashboardMFG">
      <header class="header">
        <img src="logo.png" alt="Sony Logo" class="logo" />
        <div class="filters">
          <select>
            <option>Division : ALL</option>
          </select>
          <select>
            <option>Department : ALL</option>
          </select>
          <select>
            <option>Section : ALL</option>
          </select>
          <select>
            <option>Biz : ALL</option>
          </select>
          <select>
            <option>Process : ALL</option>
          </select>
          <input type="text" placeholder="Search" />
        </div>
      </header>
  
      <!-- สถิติ -->
      <section class="stats">
        <div class="stat-card" v-for="(card, index) in stats" :key="index">
          <div class="icon-container">
            <!-- ใช้ dot แทน icon -->
            <span
              v-if="card.dotColor"
              :style="{ backgroundColor: card.dotColor }"
              class="status-dot"
            ></span>
            <img v-else-if="card.icon" :src="card.icon" alt="Icon" class="icon" />
          </div>
          <div class="content">
            <!-- เปลี่ยนสีของตัวเลขเฉพาะช่องที่ label คือ 'ต้องการพนักงาน' -->
            <h3
              :style="{
                color: card.label === 'ต้องการพนักงาน' ? '#ff0000' : '#000',
              }"
            >
              {{ card.value }}
            </h3>
            <p>{{ card.label }}</p>
            <p v-if="card.subLabel" class="sub-label">{{ card.subLabel }}</p>
          </div>
        </div>
      </section>
  
      <!-- โซน Pie Chart และ Employee Table -->
      <section class="charts">
        <div class="chart">
          <button @click="resetFilters">
            <img src="refresh.png" alt="Refresh" class="refresh-icon" />
          </button>
          <PieChart :data="pieChartData" @filter="filterEmployeesByStatus" />
        </div>
        <div class="table">
          <EmployeeTable
            :employees="
              filteredEmployees.length > 0 ? filteredEmployees : sortedEmployees
            "
          />
        </div>
      </section>
  
      <!-- โซน Bar Chart และ EmployeeRecommendations -->
      <section class="charts">
        <div class="chart">
          <!-- <BarChart :data="barChartData" /> -->
          <BarChart :data="barChartData" @filterSkill="filterEmployeesBySkill1" />
        </div>
        <div class="table">
          <EmployeeRecommendations
            :employees="recommendedEmployees"
            :skills="skills"
            @selectEmployee="selectEmployee"
          />
        </div>
      </section>
    </div>
  
    <!-- โซน EmployeeSkillSection -->
    <section class="charts">
      <div class="table">
        <!-- ตารางพนักงานไม่ถูกฟิลเตอร์ -->
        <EmployeeSkillTable
          :employees="employees"
          :skills="skills"
          @selectEmployee="selectEmployee"
        />
      </div>
      <div class="table" ref="skillSection">
        <!-- แสดงข้อมูลพนักงานที่เลือก -->
        <EmployeeSkillSection
          v-if="selectedEmployee"
          :employee="selectedEmployee"
          :skills="skills"
        />
      </div>
    </section>
  
    <!-- โซน Pie Chart Skill Level และ EmployeeSkillTable -->
    <section class="charts">
      <div class="chart">
        <button @click="resetFilters">
          <img src="refresh.png" alt="Refresh" class="refresh-icon" />
        </button>
        <SkillLevelPieChart
          :data="skillDistribution"
          @filter="filterEmployeesBySkillLevel"
        />
      </div>
      <div class="table">
        <EmployeeSkillTable
          :employees="filteredSkillEmployees"
          :skills="skills"
          @selectEmployee="selectEmployee"
        />
      </div>
    </section>
  
    <section class="charts">
      <div class="chart">
        <button @click="resetFilters">
          <img src="refresh.png" alt="Refresh" class="refresh-icon" />
        </button>
        <fullySkilledPieChart
          :data="fullySkilled"
          @filter="filterEmployeesBySkill2"
        />
      </div>
      <div class="table">
        <EmployeeSkillTable
          :employees="filteredFullySkilled"
          :skills="skills"
          @selectEmployee="selectEmployee"
        />
      </div>
    </section>
  
    <!-- โซน WorkedTimeChart และ MonthlyWorkedTimeOverload -->
    <section class="charts">
      <div class="chart">
        <WorkedTimeChart :data="workedTimeData" />
      </div>
      <div class="chart">
        <MonthlyWorkedTimeOverload :data="monthlyData" />
      </div>
    </section>
  
    <!-- โซน WeeklyAbsentTrend และ ResourceAllocationSummary -->
    <section class="charts">
      <div class="chart">
        <WeeklyAbsentTrend :data="weeklyData" />
      </div>
      <div class="chart">
        <ResourceAllocationSummary :data="resourceData" />
      </div>
    </section>
  
    <!-- โซน ShiftRequireSupport และ ShiftcodeRequireSupport -->
    <section class="charts">
      <div class="chart">
        <!-- <ShiftcodeRequireSupport :data="shiftcodeData" /> -->
        <ShiftcodeRequireSupport
          :data="shiftcodeData"
          @filterShift="updateShiftFilter"
        />
      </div>
      <div class="chart">
        <!-- <ShiftRequireSupport :data="shiftData" /> -->
        <!-- <ShiftRequireSupport
          :data="shiftData"
          :selectedShiftcode="selectedShiftcode"
        /> -->
        <!-- กราฟ ShiftRequireSupport ที่ใช้ filteredShiftData -->
        <ShiftRequireSupport :data="filteredShiftData" />
      </div>
    </section>
  
    <section class="charts">
      <div class="chart">
        <WeeklyOvertime :data="overtimeData" />
      </div>
      <div class="chart">
        <HeadcountPlan :data="headcountData" />
      </div>
    </section>
  </template>
  
  <script>
  import PieChart from "./../components/PieChart.vue";
  import BarChart from "./../components/BarChart.vue";
  import EmployeeTable from "./../components/EmployeeTable.vue";
  import EmployeeRecommendations from "./../components/EmployeeRecommendations.vue";
  import EmployeeSkillTable from "./../components/EmployeeSkillTable.vue";
  import SkillLevelPieChart from "./../components/SkillLevelPieChart.vue";
  import EmployeeSkillSection from "./../components/EmployeeSkillSection.vue";
  import fullySkilledPieChart from "./../components/fullySkilledPieChart.vue";
  import WorkedTimeChart from "./../components/WorkedTimeChart.vue";
  import WeeklyAbsentTrend from "./../components/WeeklyAbsentTrend.vue";
  import MonthlyWorkedTimeOverload from "./../components/MonthlyWorkedTimeOverload.vue";
  import ResourceAllocationSummary from "./../components/ResourceAllocationSummary.vue";
  import ShiftRequireSupport from "./../components/ShiftRequireSupport.vue";
  import ShiftcodeRequireSupport from "./../components/ShiftcodeRequireSupport.vue";
  import WeeklyOvertime from "./../components/WeeklyOvertime.vue";
  import HeadcountPlan from "./../components/HeadcountPlan.vue";
  import axios from '@/axios/axios';
  
  export default {
    components: {
      PieChart,
      BarChart,
      EmployeeTable,
      EmployeeRecommendations,
      EmployeeSkillTable,
      SkillLevelPieChart,
      EmployeeSkillSection,
      fullySkilledPieChart,
      WorkedTimeChart,
      WeeklyAbsentTrend,
      MonthlyWorkedTimeOverload,
      ResourceAllocationSummary,
      ShiftRequireSupport,
      ShiftcodeRequireSupport,
      WeeklyOvertime,
      HeadcountPlan,
    },
    data() {
      return {
        stats: [
        { value: "7:15", label: "SHIFT : DAY", subLabel: "3/10/2024", icon: "clock.png" },
        { value: 0, label: "พนักงานทั้งหมด", subLabel: "คน" },
        { value: 0, label: "In Cleanroom", subLabel: "คน", dotColor: "#00cc66" },
        { value: 0, label: "Out Cleanroom", subLabel: "คน", dotColor: "#ffcc00" },
        { value: 0, label: "ขาดงาน", subLabel: "คน", dotColor: "#ff6666" },
        { value: 0, label: "ต้องการพนักงาน", subLabel: "คน" },
      ],
      pieChartData: {
        values: [0, 0, 0],
        labels: ["In Cleanroom", "Out Cleanroom", "ขาดงาน"],
        type: "pie",
      },
        barChartData: {
          x: ["ASSY", "MOKU", "CSAT", "JUNB"],
          y: [2, 3, 5, 1],
          type: "bar",
        },
        employees: [
          
          {
            EmpID: "202035",
            Firstname: "Patchara",
            Lastname: "Khuneept",
            Datetime: "2023-09-01 07:15:00",
            GateNo: "D01",
            Biz: "IS",
            Process: "ASSY",
            CourseGroup: "Injection",
            Status: "In Cleanroom",
            Material: 3,
            Operation: 3,
            "Machine:SAB#1": 3,
            "Machine:SAB#2": 3,
            "Machine:SAB#3": 3,
            Inspection: 3,
            WorkTime: "20/60 hrs", // Work Time
          },
          {
            EmpID: "202034",
            Firstname: "Tanwaruth",
            Lastname: "Papapai",
            Datetime: "2023-09-01 07:12:00",
            GateNo: "D02",
            Biz: "HTPS",
            Process: "CSAT",
            CourseGroup: "OJT",
            Status: "Out Cleanroom",
            Material: 3,
            Operation: 2,
            "Machine:SAB#1": 3,
            "Machine:SAB#2": 1,
            "Machine:SAB#3": 3,
            Inspection: 3,
            WorkTime: "50/60 hrs", // Work Time
          },
          {
            EmpID: "202033",
            Firstname: "Sudaporn",
            Lastname: "Sena",
            Datetime: "-",
            GateNo: "-",
            Biz: "MOLED",
            Process: "JUNB",
            CourseGroup: "OJT",
            Status: "ขาดงาน",
            Material: 3,
            Operation: 3,
            "Machine:SAB#1": 0,
            "Machine:SAB#2": 2,
            "Machine:SAB#3": 1,
            Inspection: 1,
            WorkTime: "40/60 hrs", // Work Time
          },
        ],
       
        skills: [
          "Material",
          "Operation",
          "Machine:SAB#1",
          "Machine:SAB#2",
          "Machine:SAB#3",
          "Inspection",
        ],
        skillDistribution: {
          values: [10, 15, 25, 45],
          labels: ["Not Trained", "Basic", "Medium", "Expert"],
        },
        fullySkilled: {
          values: [80, 20],
          labels: ["Fully Skilled", "Need Training"],
        },
        workedTimeData: [
          { firstname: "Patchara", lastname: "Khuneept", hours: 70 },
          { firstname: "Tanwaruth", lastname: "Papapai", hours: 55 },
          { firstname: "Sudaporn", lastname: "Sena", hours: 50 },
        ],
        monthlyData: {
          months: ["ASSY", "MOKU", "CSAT", "JUNB"],
          hours: [10, 15, 5, 7],
        },
        weeklyData: {
          days: ["MON", "TUE", "WED", "THR", "FRI"],
          absences: [20, 10, 17, 14, 12],
        },
        resourceData: {
          processes: ["ASSY", "MOKU", "CSAT", "JUNB"],
          resources: [10, 5, 10, 7],
        },
        shiftcodeData: {
          processes: ["ASSY", "MOKU", "CSAT", "JUNB"],
          shiftA: [5, 10, 15, 5],
          shiftB: [8, 6, 5, 10],
          shiftC: [8, 10, 5, 8],
        },
        shiftData: {
          A: {
            processes: ["ASSY", "MOKU", "CSAT", "JUNB"],
            dayShift: [3, 7, 10, 5],
            nightShift: [2, 3, 5, 4],
          },
          B: {
            processes: ["ASSY", "MOKU", "CSAT", "JUNB"],
            dayShift: [4, 5, 6, 7],
            nightShift: [2, 3, 5, 4],
          },
          C: {
            processes: ["ASSY", "MOKU", "CSAT", "JUNB"],
            dayShift: [3, 7, 10, 5],
            nightShift: [2, 3, 5, 4],
          },
        },
        overtimeData: {
          processes: ["ASSY", "MOKU", "CSAT", "JUNB"],
          overtime: [10, 30, 20, 25],
        },
        headcountData: {
          processes: ["ASSY", "MOKU", "CSAT", "JUNB"],
          headcount: [175, 225, 150, 195],
          plan: [200, 225, 150, 200],
        },
        // recommendedEmployees: [
        //   {
        //     EmpID: "202101",
        //     Firstname: "Nopparat",
        //     Lastname: "Chaiyong",
        //     Skill: "Material",
        //     WorkTime: "40/60 hrs",
        //   },
        //   {
        //     EmpID: "202102",
        //     Firstname: "Prakorn",
        //     Lastname: "Tangsit",
        //     Skill: "Inspection",
        //     WorkTime: "30/60 hrs",
        //   },
        // ],
        // selectedShiftcode: "A",
        recommendedEmployees: [], // เพิ่มส่วนนี้
        filteredEmployees: [],
        filteredSkillEmployees: [],
        filteredFullySkilled: [],
        selectedEmployee: null, // พนักงานที่ถูกเลือก
        // selectedSkill: null, // สกิลที่ถูกเลือก
        // selectedShiftcode: "A",
        filteredShiftData: {},
      };
    },
    methods: {
      sortEmployeesByStatus(employees) {
        // ระบุลำดับการจัดเรียงสถานะ
        const statusOrder = ["ขาดงาน", "Out Cleanroom", "In Cleanroom"];
  
        // ใช้ sort เพื่อจัดเรียงตามลำดับที่กำหนด
        return employees.slice().sort((a, b) => {
          const statusA = statusOrder.indexOf(a.Status);
          const statusB = statusOrder.indexOf(b.Status);
          return statusA - statusB; // เรียงลำดับตาม index ใน statusOrder
        });
      },
      filterEmployeesByStatus(status) {
        // console.log("Status Selected:", status); // ดูค่าที่ส่งมาจาก PieChart
        // กรองพนักงานที่มี Status ตรงกับที่เลือก
        this.filteredEmployees = this.employees.filter(
          (employee) => employee.Status === status
        );
        // console.log("Filtered Employees:", this.filteredEmployees); // ดูพนักงานที่กรองได้
      },
      filterEmployeesBySkillLevel(selectedLevel) {
        const levelMapping = {
          "Not Trained": 0,
          Basic: 1,
          Medium: 2,
          Expert: 3,
        };
  
        const levelValue = levelMapping[selectedLevel];
  
        if (levelValue === undefined) {
          console.error("Invalid skill level selected.");
          return;
        }
  
        this.filteredSkillEmployees = this.employees
          .map((employee) => {
            const filteredSkills = this.skills.reduce((result, skill) => {
              result[skill] =
                employee[skill] === levelValue ? employee[skill] : null;
              return result;
            }, {});
            return { ...employee, ...filteredSkills };
          })
          .filter((employee) =>
            this.skills.some((skill) => employee[skill] === levelValue)
          );
      },
      filterEmployeesBySkill1(skill) {
        console.log("Filtering employees by skill:", skill); // Debug
        const skillEmployees = this.employees
          .filter((employee) => employee[skill] >= 2) // กรองพนักงานที่มี skillLevel >= 2
          .map((employee) => ({
            ...employee,
            skillLevel: employee[skill], // เพิ่มระดับ Skill ลงใน Object
          }));
  
        skillEmployees.sort((a, b) => {
          if (b[skill] === a[skill]) {
            const workTimeA = parseInt(a.WorkTime.split("/")[0], 10);
            const workTimeB = parseInt(b.WorkTime.split("/")[0], 10);
            return workTimeA - workTimeB;
          }
          return b[skill] - a[skill];
        });
  
        this.recommendedEmployees = skillEmployees.slice(0, 5);
      },
      filterEmployeesBySkill2(label) {
        if (label === "Fully Skilled") {
          // กรองพนักงานที่มีทุก skill level เท่ากับ 3
          this.filteredFullySkilled = this.employees.filter((employee) =>
            this.skills.every((skill) => employee[skill] === 3)
          );
        } else if (label === "Need Training") {
          // กรองพนักงานที่มี skill level ใดๆ ต่ำกว่า 3
          this.filteredFullySkilled = this.employees.filter((employee) => {
            // นับจำนวนทักษะที่มีระดับ 0 หรือ 1
            const lowSkillsCount = this.skills.reduce((count, skill) => {
              return employee[skill] === 0 || employee[skill] === 1
                ? count + 1
                : count;
            }, 0);
  
            // เช็คว่ามีระดับทักษะ 0 หรือ 1 มากกว่า 2 ทักษะ
            return lowSkillsCount > 2;
          });
        }
      },
      updateShiftFilter(shiftcode) {
        this.selectedShiftcode = shiftcode;
        this.filterShiftData();
      },
      filterShiftData() {
        this.filteredShiftData = this.shiftData[this.selectedShiftcode];
      },
  
      onBarClick(eventData) {
        const selectedSkill = eventData.points[0].x; // Skill ที่เลือกจากแกน X ของกราฟ
        this.$emit("filterSkill", selectedSkill); // ส่ง Skill กลับไปยัง App.vue
      },
      resetFilters() {
        this.filteredSkillEmployees = this.employees; // รีเซ็ตข้อมูลกลับไปที่ทั้งหมด
        this.filteredFullySkilled = this.employees;
        this.filteredEmployees = [];
        // this.recommendedEmployees = [];
        // this.selectedEmployee = null;
        console.log("Filters reset. Showing all employees.");
      },
      selectEmployee(employee) {
        this.selectedEmployee = employee; // ตั้งค่าพนักงานที่ถูกเลือก
        console.log("Selected Employee:", employee);
        // console.log("Skills:", this.skillSection)
  
        // ดึงหน้าจอไปยังส่วนที่แสดงผลข้อมูล
        this.$nextTick(() => {
          const section = this.$refs.skillSection;
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      },
      async fetchCleanroomData() {
      try {
        const response = await axios.get("http://localhost:5000/api/CleanroomEntryCount");
        const data = response.data;

        // อัปเดตข้อมูลใน stats
        this.stats = [
          { value: "7:15", label: "SHIFT : DAY", subLabel: "3/10/2024", icon: "clock.png" },
          {value: data["Total Employees"], label: "พนักงานทั้งหมด", subLabel: "คน"},
          { value: data["In Cleanroom"], label: "In Cleanroom", subLabel: "คน", dotColor: "#00cc66" },
          { value: data["Out Cleanroom"], label: "Out Cleanroom", subLabel: "คน", dotColor: "#ffcc00" },
          { value: data["Absent"], label: "ขาดงาน", subLabel: "คน", dotColor: "#ff6666" },
          { value: data["Total Require"], label: "ต้องการพนักงาน", subLabel: "คน" },
        ];

        // อัปเดตข้อมูลใน Pie Chart
        this.pieChartData = {
          values: [data["In Cleanroom"], data["Out Cleanroom"], data["Absent"]],
          labels: ["In Cleanroom", "Out Cleanroom", "ขาดงาน"],
          type: "pie",
        };
      } catch (error) {
        console.error("Error fetching cleanroom data:", error);
      }
    },

    // resetFilters() {
    //   this.filteredEmployees = []; // รีเซ็ตข้อมูลกลับไปที่ทั้งหมด
    //   console.log("Filters reset. Showing all employees.");
    // },
  },

    computed: {
      sortedEmployees() {
        return this.sortEmployeesByStatus([...this.employees]);
      },
    },
  
    mounted() {
      this.filteredEmployees = []; // เริ่มต้นให้ว่างเพื่อเรียกใช้ sortedEmployees
      // this.filteredEmployees = this.employees; // เริ่มต้นแสดงพนักงานทั้งหมด
      this.filteredSkillEmployees = this.employees;
      this.filteredFullySkilled = this.employees;
      this.filterShiftData();
      this.fetchCleanroomData(); 
    },
  };
  </script>
  
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
  
  .stat-card {
    flex: 1;
    text-align: center;
    padding: 10px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
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
    /* background-color: #007bff; */
    color: white;
    float: right; /* ปุ่มอยู่ชิดขวา */
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
  
  /* .stat-card:hover {
    transform: translateY(-5px);
  } */
  
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
  
  /* สไตล์สำหรับจุดสี */
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
  </style>
  