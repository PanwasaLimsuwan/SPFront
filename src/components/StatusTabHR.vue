<template>
  <div class="stat-card" v-for="(card, index) in stats" :key="index">
    <div class="icon-container">
      <span
        v-if="card.dotColor"
        :style="{ backgroundColor: card.dotColor }"
        class="status-dot"
      ></span>
      <img v-else-if="card.icon" :src="card.icon" alt="Icon" class="icon" />
    </div>
    <div class="content">
      <h3>
        {{ card.value }}
      </h3>
      <p>{{ card.label }}</p>
      <p v-if="card.subLabel" class="sub-label">{{ card.subLabel }}</p>
      <!-- <div v-if="showBell && card.icon === 'clock.png'" class="bell-alert">
          <img src="/bell.png" alt="Notification" class="bell-icon" />
          <span class="bell-text">ถึงเวลาเปลี่ยนกะ!</span>
        </div> -->
    </div>
  </div>
</template>
  
  <script>
import axios from "axios";
import { useToast } from "vue-toastification";

export default {
  props: {
    filters: Object, // ✅ รับ props filter เข้ามา
  },
  data() {
    return {
      employees: [],
      attendanceData: [], // ✅ add this
      // transactionsData: [], // ✅ add this
      shiftInfo: { shift: '?', shiftType: '', workDate: '' },
      showBell: false,
      hasAlerted: false,
      toast: null,
      stats: [],
    };
  },
  watch: {
    filters: {
      handler() {
        this.refreshAll(); // ✅ ถ้ามีการเปลี่ยน filter -> refresh ข้อมูล
      },
      deep: true,
    },
  },
  methods: {
    // ✅ ดึงข้อมูลจาก Attendance (Normal, Late)
    async fetchAttendanceData() {
  try {
    const response = await axios.get(
      'http://16.176.50.155:5000/api/Attendance/ByDate',
      {
        params: {
          division:   this.filters.division   !== 'ALL' ? this.filters.division   : undefined,
          department: this.filters.department !== 'ALL' ? this.filters.department : undefined,
          section:    this.filters.section    !== 'ALL' ? this.filters.section    : undefined,
          biz:        this.filters.biz        !== 'ALL' ? this.filters.biz        : undefined,
          process:    this.filters.process    !== 'ALL' ? this.filters.process    : undefined,
        },
      }
    );

    // ✅ แก้จาก response.data → response.data.data
    this.attendanceData = response.data.data ?? [];

    // ✅ เก็บ shift info
    this.shiftInfo = {
      shift:     response.data.shift     ?? '?',
      shiftType: response.data.shiftType ?? '',
      workDate:  response.data.workDate  ?? '',
    };
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    this.attendanceData = [];
  }
},

    // ✅ ดึงข้อมูลจาก Transactions (Total, Missing)
    // async fetchTransactionsData() {
    //   try {
    //     const response = await axios.get(
    //       "http://16.176.50.155:5000/api/Transactions/GetFaceEntry",
    //       {
    //         params: {
    //           division:
    //             this.filters.division !== "ALL"
    //               ? this.filters.division
    //               : undefined,
    //           department:
    //             this.filters.department !== "ALL"
    //               ? this.filters.department
    //               : undefined,
    //           section:
    //             this.filters.section !== "ALL"
    //               ? this.filters.section
    //               : undefined,
    //           biz: this.filters.biz !== "ALL" ? this.filters.biz : undefined,
    //           process:
    //             this.filters.process !== "ALL"
    //               ? this.filters.process
    //               : undefined,
    //         },
    //       }
    //     );
    //     // ✅ GetFaceEntry returns { workDate, shift, data: [...] } — extract the array
    //     this.transactionsData = response.data.data ?? [];
    //   } catch (error) {
    //     console.error("Error fetching transactions data:", error);
    //     this.transactionsData = []; // ✅ fallback so .filter() never crashes
    //   }
    // },

    updateStats() {
  const totalEmployees = this.attendanceData.length;

  const normal = this.attendanceData.filter(e => 
    e.status?.toLowerCase().trim() === "normal"
  ).length;

  const late = this.attendanceData.filter(e => 
    e.status?.toLowerCase().trim() === "late"
  ).length;

  const absent = this.attendanceData.filter(e => 
    e.status?.toLowerCase().trim() === "absent"
  ).length;

  const workDate = this.shiftInfo.workDate
    ? (() => {
        const [year, month, day] = this.shiftInfo.workDate.split("-");
        return `${day}/${month}/${year}`;
      })()
    : new Date().toLocaleDateString("th-TH");

  const currentTime = new Date();

  this.stats = [
    {
      value: `SHIFT : ${this.shiftInfo.shift ?? '?'}`,   // ✅ SHIFT ขึ้นก่อน
      label: `เวลา ${currentTime.toLocaleTimeString()}`, // ✅ เวลาอยู่ล่าง
      subLabel: workDate,
      icon: "clock.png",
    },
    { value: totalEmployees, label: "พนักงานทั้งหมด", subLabel: "คน" },
    {
      value: normal,
      label: "เข้างานปกติ",
      subLabel: "คน",
      dotColor: "#00cc66",
    },
    {
      value: late,
      label: "เข้างานสาย",
      subLabel: "คน",
      dotColor: "#ffcc00",
    },
    {
      value: absent,
      label: "ขาดงาน",
      subLabel: "คน",
      dotColor: "#ff6666",
    },
  ];

  this.updateShift(currentTime);
},

    updateShift(currentTime) {
  const { shift, shiftType } = this.shiftInfo;
  const shiftLabel = shift !== '?'
    ? `SHIFT : ${shift} (${shiftType})`   // "SHIFT : A (DAY)"
    : (currentTime.getHours() >= 7 && currentTime.getHours() < 19
        ? 'SHIFT : DAY' : 'SHIFT : NIGHT');
  this.stats[0].label = shiftLabel;
},

    startClock() {
  setInterval(() => {
    const now = new Date();
    if (this.stats.length > 0) {
      // ✅ แก้ให้ update label แทน value
      this.stats[0].label = `เวลา ${now.toLocaleTimeString()}`;
    }
  }, 1000);
},

    checkShiftAlert() {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      const inMorningShift = hour === 7 && minute >= 15 && minute <= 45;
      const inNightShift = hour === 19 && minute >= 15 && minute <= 45;

      const isShiftTime = inMorningShift || inNightShift;

      this.showBell = isShiftTime;

      if (isShiftTime && !this.hasAlerted) {
        this.hasAlerted = true;

        this.toast.warning("ถึงเวลาเปลี่ยนกะ กรุณาแจ้งพนักงาน!", {
          timeout: 5000,
          position: "top-right",
        });
      } else if (!isShiftTime) {
        this.hasAlerted = false;
      }
    },

    // async refreshAll() {
    //   await this.fetchGateEntryData();
    //   this.checkShiftAlert();
    // },
    async refreshAll() {
  await this.fetchAttendanceData();
  this.updateStats();
  this.checkShiftAlert();
}
  },

  mounted() {
    this.toast = useToast();
    this.refreshAll();
    this.startClock();

    setInterval(() => {
      this.checkShiftAlert();
      this.refreshAll();
    }, 10000); // ⏱️ 10 วินาทีพอ ไม่ต้องถี่ 1 วิครับ
  },
};
</script>
  
  <style scoped>
/* (style เดิมของคุณ ไม่มีเปลี่ยน) */
.bell-alert {
  display: flex;
  align-items: center;
  background-color: #fffbe6;
  border: 1px solid #ffcc00;
  border-radius: 8px;
  padding: 10px;
  margin: 10px auto;
  width: fit-content;
  box-shadow: 0 0 10px rgba(255, 204, 0, 0.4);
  animation: pulse 1s infinite;
}

.bell-icon {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.bell-text {
  font-weight: bold;
  color: #ff9900;
  font-size: 16px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.stat-card {
  flex: 1;
  text-align: center;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
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

p {
  font-size: 14px;
  margin: 4px 0 0;
}

.sub-label {
  font-size: 16px;
  color: #888;
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
.stat-get-off {
  color: blue;
}
</style>
  