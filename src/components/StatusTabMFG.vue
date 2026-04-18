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
      <h3
        :style="{ color: card.label === 'ต้องการพนักงาน' ? '#ff0000' : '#000' }"
      >
        {{ card.value }}
      </h3>
      <p>{{ card.label }}</p>
      <p v-if="card.subLabel" class="sub-label">{{ card.subLabel }}</p>

      <div v-if="showBell && card.icon === 'clock.png'" class="bell-alert">
        <img src="/bell.png" alt="Notification" class="bell-icon" />
        <span class="bell-text">ถึงเวลาเปลี่ยนกะ!</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from "vue-toastification";

export default {
  props: {
    filters: Object,
  },

  data() {
    return {
      employees: [],
      selectedDate: null,
      selectedShift: null,
      currentTime: null,
      showBell: false,
      hasAlerted: false,
      toast: null,
      stats: [],
    };
  },

  watch: {
    filters: {
      handler() {
        this.refreshAll();
      },
      deep: true,
    },
  },

  methods: {
    async fetchFaceEntryData() {
      try {
        const response = await axios.get(
          "http://16.176.50.155:5000/api/Transactions/GetFaceEntry",
          {
            params: {
              division:
                this.filters.division !== "ALL"
                  ? this.filters.division
                  : undefined,
              department:
                this.filters.department !== "ALL"
                  ? this.filters.department
                  : undefined,
              section:
                this.filters.section !== "ALL"
                  ? this.filters.section
                  : undefined,
              biz: this.filters.biz !== "ALL" ? this.filters.biz : undefined,
              process:
                this.filters.process !== "ALL"
                  ? this.filters.process
                  : undefined,

              // shiftOverride: "B", // 🔵 บังคับกะเช้า
            },
          }
        );

        // ✅ รับข้อมูลจาก backend
        this.employees = response.data.data;
        this.selectedDate = response.data.selectedDate || response.data.workDate;
        this.selectedShift = response.data.shift;
        this.currentTime = response.data.currentTime;

        this.updateStats();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },

    updateStats() {
      const totalEmployees = this.employees.length;
      const inCleanroom = this.employees.filter(
        (e) => e.status === "status-in-cleanroom"
      ).length;
      const outCleanroom = this.employees.filter(
        (e) => e.status === "status-out-cleanroom"
      ).length;
      const missing = this.employees.filter(
        (e) => e.status === "status-missing"
      ).length;
      const getoff = this.employees.filter(
        (e) => e.status === "status-get-off"
      ).length;

      // const formattedDate = this.selectedDate
      //   ? new Date(this.selectedDate).toLocaleDateString("th-TH")
      //   : "-";
      const formattedDate = this.selectedDate
        ? (() => {
            const [year, month, day] = this.selectedDate.split("-");
            return `${day}/${month}/${year}`;
          })()
        : "-";

      this.stats = [
        {
          value: `SHIFT : ${this.selectedShift}`,
          // label: "ข้อมูลกะ",
          label: `เวลา ${this.currentTime}`,
          subLabel: formattedDate,
          icon: "clock.png",
        },
        { value: totalEmployees, label: "พนักงานทั้งหมด", subLabel: "คน" },
        {
          value: inCleanroom,
          label: "In Cleanroom",
          subLabel: "คน",
          dotColor: "#00cc66",
        },
        {
          value: outCleanroom,
          label: "Out Cleanroom",
          subLabel: "คน",
          dotColor: "#ffcc00",
        },
        {
          value: missing,
          label: "ขาดงาน",
          subLabel: "คน",
          dotColor: "#ff6666",
        },
        {
          value: getoff,
          label: "Get Off",
          subLabel: "คน",
          dotColor: "#3399ff",
        },
        // {
        //   value: missing,
        //   label: "ต้องการพนักงาน",
        //   subLabel: "คน",
        // },
      ];
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

    async refreshAll() {
      await this.fetchFaceEntryData();
      this.checkShiftAlert();
    },
  },

  mounted() {
    this.toast = useToast();
    this.refreshAll();

    // รีเฟรชทุก 10 วิ
    setInterval(() => {
      this.refreshAll();
    }, 10000);
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
