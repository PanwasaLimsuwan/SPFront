<template>
  <div class="dashboard-container">
    <h1 class="header">Manage Leader <Logout /></h1>

    <!-- ตารางแสดงข้อมูลพนักงาน -->
    <table v-if="employees.length > 0" class="employee-table">
      <thead>
  <tr>
    <th>#</th>
    <th>EmpID</th>
    <th>Name</th>
    <th>Email</th>
    <th>Division</th>
    <th>Department</th>
    <th>Section</th>
    <th>Biz</th>
    <th>Process</th>
    <th>Shift</th>
    <th>Position</th>
    <th>Action</th>
  </tr>
</thead>
      <tbody>
  <tr
    v-for="(employee, index) in sortedEmployees"
    :key="employee.empID"
    :class="{ 'row-registered': employee.isRegistered }"
  >
    <td class="idx">{{ index + 1 }}</td>
    <td><span class="empid-badge">{{ employee.empID }}</span></td>
    <td class="name-cell">
      <div class="avatar">{{ employee.firstName[0] }}</div>
      <div class="full-name">{{ employee.firstName }} {{ employee.lastName }}</div>
    </td>
    <td class="email-cell">{{ employee.email }}</td>
    <td><span class="tag tag-blue">{{ employee.division }}</span></td>
    <td>{{ employee.department }}</td>
    <td>{{ employee.section }}</td>
    <td>{{ employee.biz }}</td>
    <td>{{ employee.process }}</td>
    <td><span class="tag tag-gray">{{ employee.shiftCode }}</span></td>
    <td><span class="tag tag-purple">{{ employee.position }}</span></td>
    <td class="action-cell">
      <!-- ✅ ปุ่มเดิมทุกตัว ไม่แตะฟังก์ชัน -->
      <button
        class="btn-register"
        :disabled="employee.isRegistered"
        @click="registerLeader(employee)"
      >
        {{ employee.isRegistered ? 'Registered' : 'Register' }}
      </button>
      <button class="btn-edit" @click="openEditForm(employee)">Edit</button>
      <button class="btn-delete" @click="deleteEmployee(employee.empID)">Delete</button>
    </td>
  </tr>
</tbody>
    </table>

    <div v-else>
      <p class="no-employees">No employees found.</p>
    </div>

    <!-- ฟอร์มแก้ไขข้อมูล (Pop-up) -->
    <div v-if="isEditFormVisible" class="edit-form-overlay">
      <div class="edit-form-container">
        <button class="btn-close" @click="closeEditForm">✕</button>
        <h3>Edit Employee</h3>
        <form @submit.prevent="editEmployee" class="form-grid">

  <div class="form-group full">
    <label>EmpID</label>
    <input type="text" v-model="editData.empID" readonly />
  </div>

  <div class="form-group">
    <label>First Name</label>
    <input type="text" v-model="editData.firstName" required />
  </div>

  <div class="form-group">
    <label>Last Name</label>
    <input type="text" v-model="editData.lastName" required />
  </div>

  <div class="form-group full">
    <label>Email</label>
    <input type="email" v-model="editData.email" required />
  </div>

  <div class="form-group">
    <label>Biz</label>
    <input type="text" v-model="editData.biz" required />
  </div>

  <div class="form-group">
    <label>PlanID</label>
    <input type="text" v-model="editData.planID" required />
  </div>

  <div class="form-group">
    <label>Process</label>
    <input type="text" v-model="editData.process" required />
  </div>

  <div class="form-group">
    <label>Section</label>
    <input type="text" v-model="editData.section" required />
  </div>

  <div class="form-group">
    <label>Division</label>
    <input type="text" v-model="editData.division" required />
  </div>

  <div class="form-group">
    <label>JobGrade</label>
    <input type="text" v-model="editData.jobGrade" required />
  </div>

  <div class="form-group">
    <label>Position</label>
    <input type="text" v-model="editData.position" required />
  </div>

  <div class="form-group">
    <label>ShiftCode</label>
    <input type="text" v-model="editData.shiftCode" required />
  </div>

  <div class="form-group">
    <label>CostCenter</label>
    <input type="text" v-model="editData.costCenter" required />
  </div>

  <div class="form-group">
    <label>Department</label>
    <input type="text" v-model="editData.department" required />
  </div>

  <!-- ปุ่ม -->
  <div class="form-actions full">
    <button type="submit" class="btn-save">Save</button>
    <button type="button" class="btn-cancel" @click="closeEditForm">Cancel</button>
  </div>

</form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import Logout from "../views/Logout";

const employees = ref([]);
const isEditFormVisible = ref(false);
const editData = ref({
  empID: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'Leader',
  division: '',
  department: '',
  section: '',
  jobGrade: '',
  position: '',
  shiftCode: '',
  costCenter: '',
  biz: '',
  process: '',
  planID: '',
});

const sortedEmployees = computed(() => {
  return [...employees.value].sort((a, b) => {
    if (a.isRegistered && !b.isRegistered) return -1;
    if (!a.isRegistered && b.isRegistered) return 1;
    return 0;
  });
});

// ฟังก์ชันดึงข้อมูลพนักงานจาก API
// const getSupervisors = async () => {
//   try {
//     const response = await axios.get('http://localhost:5000/api/EmployeeInfo/get-supervisors');
//     if (response.data && response.data.length > 0) {
//       // ตรวจสอบว่าพนักงานแต่ละคนลงทะเบียนแล้วหรือยัง
//       employees.value = response.data.map(employee => ({
//         ...employee,
//         isRegistered: false // เริ่มต้นให้ไม่มีการลงทะเบียน
//       }));
      
//       // ตรวจสอบการลงทะเบียนใน API
//       for (const employee of employees.value) {
//         const isRegisteredResponse = await checkIfRegistered(employee.empID);
//         employee.isRegistered = isRegisteredResponse.isRegistered;
//       }
//     } else {
//       console.error("No supervisors found or invalid data");
//     }
//   } catch (error) {
//     console.error('Error fetching supervisors', error);
//   }
// };

// เปลี่ยนชื่อฟังก์ชันและเพิ่ม Role mapping
const getLeaders = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/EmployeeInfo/get-leaders');
    if (response.data && response.data.length > 0) {
      employees.value = response.data.map(employee => ({
        ...employee,
        // กำหนด Role ตาม Position
        role: employee.position === 'Supervisor' ? 'LeaderMFG' : 
              employee.position === 'Officer' ? 'LeaderHR' : 'Leader',
        isRegistered: false
      }));
      
      // ตรวจสอบการลงทะเบียน
      // for (const employee of employees.value) {
      //   const isRegisteredResponse = await checkIfRegistered(employee.empID);
      //   employee.isRegistered = isRegisteredResponse.isRegistered;
      // }
      await Promise.all(
  employees.value.map(async (employee) => {
    const res = await checkIfRegistered(employee.empID);
    employee.isRegistered = res.isRegistered;
  })
);
    } else {
      console.error("No leaders found or invalid data");
    }
  } catch (error) {
    console.error('Error fetching leaders', error);
  }
};

// ปรับฟังก์ชัน registerLeader ให้ส่ง Role ตาม Position
const registerLeader = async (employee) => {
  if (!employee || !employee.empID) {
    console.error("empID is undefined or invalid!");
    alert("Invalid employee data.");
    return;
  }

  if (!employee.firstName || !employee.lastName || !employee.email) {
    console.error("Incomplete employee data!");
    alert("Please complete the employee data.");
    return;
  }

  const defaultPassword = generateRandomPassword(12);
  
  // กำหนด Role ตาม Position
  const leaderRole = employee.position === 'Supervisor' ? 'LeaderMFG' : 
                     employee.position === 'Officer' ? 'LeaderHR' : 'Leader';
  
  try {
    const response = await axios.post('http://localhost:5000/api/admin/register-leader', {
      EmpID: employee.empID,
      FirstName: employee.firstName,
      LastName: employee.lastName,
      Email: employee.email,
      PasswordHash: defaultPassword,
      Role: leaderRole  // ส่ง Role ที่แยกแล้ว
    });
    
    if (response.status === 200) {
      alert(`ลงทะเบียนพนักงานสำเร็จ ${leaderRole}.`);
      employee.isRegistered = true;
    }
  } catch (error) {
    console.error("Error during registration:", error);
    alert('Error during registration.');
  }
};

// อย่าลืมเปลี่ยนใน onMounted
onMounted(() => {
  getLeaders();  // เปลี่ยนจาก getSupervisors()
});

const generateRandomPassword = (length = 8) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
};

// ฟังก์ชันตรวจสอบว่าพนักงานได้ลงทะเบียนหรือยัง
const checkIfRegistered = async (empID) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/admin/check-registration-leader?empID=${empID}`);
    return response.data;
  } catch (error) {
    console.error('Error checking registration:', error);
    return { isRegistered: false };
  }
};


// เปิดฟอร์มแก้ไข
const openEditForm = (employee) => {
  editData.value = { ...employee }; // คัดลอกข้อมูลพนักงานที่ต้องการแก้ไข
  if (!editData.value.empID) {
    alert("Invalid employee data!");
    return;
  }
  isEditFormVisible.value = true;
};


// ปิดฟอร์มแก้ไข
const closeEditForm = () => {
  isEditFormVisible.value = false;
};

// ฟังก์ชันการลงทะเบียนพนักงาน
// const registerLeader = async (employee) => {
//   if (!employee || !employee.empID) {
//     console.error("empID is undefined or invalid!");
//     alert("Invalid employee data.");
//     return;
//   }

//   if (!employee.firstName || !employee.lastName || !employee.email) {
//     console.error("Incomplete employee data!");
//     alert("Please complete the employee data.");
//     return;
//   }

//   // const defaultPassword = generateRandomPassword(12);
//   // console.log(`Generated Password: ${defaultPassword}`);

//   const defaultPassword = generateRandomPassword(12);
//   try {
//     const response = await axios.post('http://localhost:5000/api/admin/register-leader', {
//       EmpID: employee.empID,
//       FirstName: employee.firstName,
//       LastName: employee.lastName,
//       Email: employee.email,
//       PasswordHash: defaultPassword,
//       Role: "Leader"
//     });
//     if (response.status === 200) {
//       alert('Employee registered successfully.');
//       // getSupervisors();  // รีเฟรชข้อมูลพนักงานหลังจากการลงทะเบียน
//       // getRegisteredLeaders();  // ดึงข้อมูลจาก Admin มาแสดง

//     }
//   } catch (error) {
//     console.error("Error during registration:", error);
//     alert('Error during registration.');
//   }

//   // try {
//   //   const response = await axios.post('http://localhost:5000/api/admin/register-leader', {
//   //     EmpID: employee.empID,
//   //     FirstName: employee.firstName,
//   //     LastName: employee.lastName,
//   //     Email: employee.email,
//   //     PasswordHash: defaultPassword,
//   //     Role: "Leader"
//   //   });

//   //   if (response.status === 200) {
//   //     alert('Employee registered successfully.');
//   //     getSupervisors();  // รีเฟรชข้อมูลพนักงานหลังจากการลงทะเบียน
//   //   }
//   // } catch (error) {
//   //   console.error("Error during registration:", error);
//   //   alert('Error during registration.');
//   // }
// };

const getRegisteredLeaders = async () => {
  try {
    // ดึงข้อมูลจาก Admin หลังการลงทะเบียน
    const response = await axios.get('http://localhost:5000/api/admin/get-admins'); // ใช้ API ที่ดึงข้อมูลจาก Admin
    if (response.data && response.data.length > 0) {
      employees.value = response.data;
    } else {
      console.error("No registered leaders found or invalid data");
    }
  } catch (error) {
    console.error('Error fetching registered leaders from Admin', error);
  }
};


// ฟังก์ชันการแก้ไขพนักงาน
const editEmployee = async (employee) => {
  if (!editData.value.empID) {
    console.error("empID is undefined or invalid!");
    alert("Invalid EmpID.");
    return;
  }

  const updatedData = {
    // EmpID: editData.value.empID,  // ส่ง empID ไปด้วยใน body
    EmpID: parseInt(editData.value.empID),
  };

  // ตรวจสอบการเปลี่ยนแปลงของฟิลด์ firstName
  if (editData.value.firstName !== employee.firstName) {
    updatedData.FirstName = editData.value.firstName;
  }

  // ตรวจสอบการเปลี่ยนแปลงของฟิลด์ lastName
  if (editData.value.lastName !== employee.lastName) {
    updatedData.LastName = editData.value.lastName;
  }

  // ตรวจสอบการเปลี่ยนแปลงของฟิลด์ email
  if (editData.value.email !== employee.email) {
    updatedData.Email = editData.value.email;
  }
  
  if (editData.value.division !== employee.division) {
    updatedData.Division = editData.value.division;
  }

  if (editData.value.department !== employee.department) {
    updatedData.Department = editData.value.department;
  }

  if (editData.value.section !== employee.section) {
    updatedData.Section = editData.value.section;
  }

  if (editData.value.jobGrade !== employee.jobGrade) {
    updatedData.JobGrade = editData.value.jobGrade;
  }

  if (editData.value.position !== employee.position) {
    updatedData.Position = editData.value.position;
  }

  if (editData.value.shiftCode !== employee.shiftCode) {
    updatedData.ShiftCode = editData.value.shiftCode;
  }

  if (editData.value.costCenter !== employee.costCenter) {
    updatedData.CostCenter = editData.value.costCenter;
  }

  if (editData.value.biz !== employee.biz) {
    updatedData.Biz = editData.value.biz;
  }

  if (editData.value.process !== employee.process) {
    updatedData.Process = editData.value.process;
  }

  if (editData.value.planID !== employee.planID) {
    updatedData.PlanId = editData.value.planID;
  }

  // ตรวจสอบว่ามีการเปลี่ยนแปลงใด ๆ หรือไม่
  if (Object.keys(updatedData).length === 1) {  // เช็คเฉพาะการเปลี่ยนแปลง (empID จะอยู่ใน updatedData เสมอ)
    alert("No changes detected.");
    return;
  }

  console.log("Sending data with empID:", updatedData.EmpID);
  console.log("Updated data:", updatedData);

  try {
  // อัปเดตข้อมูลพนักงานใน admin
  const responseAdmin = await axios.put(
    `http://localhost:5000/api/admin/edit/${updatedData.EmpID}`, // URL สำหรับการอัปเดตข้อมูลใน admin
    updatedData,  // ข้อมูลที่ต้องการอัปเดต
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  // ตรวจสอบการตอบกลับจาก API
  if (responseAdmin.status === 200) {
    // อัปเดตข้อมูลพนักงานใน EmployeeInfo
    const responseEmployeeInfo = await axios.put(
      `http://localhost:5000/api/EmployeeInfo/edit/${updatedData.EmpID}`, // URL สำหรับการอัปเดตข้อมูลใน EmployeeInfo
      updatedData,  // ข้อมูลที่ต้องการอัปเดต
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (responseEmployeeInfo.status === 200) {
      alert("แก้ไขข้อมูลพนักงานสำเร็จ");
      // รีเฟรชข้อมูลที่เกี่ยวข้องหลังการแก้ไข
      // getSupervisors();  // ตัวเลือกสำหรับการรีเฟรชข้อมูล
      // getRegisteredLeaders();  // ตัวเลือกสำหรับการรีเฟรชข้อมูลจาก Admin
      closeEditForm();  // ปิดฟอร์มแก้ไข
    }
  }
} catch (error) {
  console.error("Error during edit:", error);
  alert("Error during edit. " + (error.response?.data || error.message));  // แสดงข้อความจากเซิร์ฟเวอร์
}

};

// const editEmployee = async (employee) => {
//   if (!editData.value.empID) {
//     console.error("empID is undefined or invalid!");
//     alert("Invalid EmpID.");
//     return;
//   }

//   const updatedData = {
//     EmpID: editData.value.empID,  // ส่ง empID ไปด้วยใน body
//     FirstName: editData.value.firstName,
//     LastName: editData.value.lastName,
//     Email: editData.value.email,
//   };

//   try {
//     // เริ่มต้นการอัปเดตทั้งสองตาราง
//     const responseEmployee = await axios.put(`http://localhost:5000/api/EmployeeInfo/edit/${updatedData.EmpID}`, updatedData);  // อัปเดตใน EmployeeInfo
//     if (responseEmployee.status === 200) {
//       const responseAdmin = await axios.put(`http://localhost:5000/api/admin/edit/${updatedData.EmpID}`, updatedData);  // อัปเดตใน Admin
//       if (responseAdmin.status === 200) {
//         alert("Employee information updated successfully.");
//         getSupervisors();  // รีเฟรชข้อมูลพนักงานหลังการอัปเดต
//         closeEditForm();  // ปิดฟอร์มแก้ไข
//       }
//     }
//   } catch (error) {
//     console.error("Error during edit:", error);
//     alert("Error during edit.");
//   }
// };

// ฟังก์ชันการลบพนักงาน
const deleteEmployee = async (empID) => {
  if (!empID) {
    console.error("Invalid EmpID!");
    return;
  }

  try {
    const response = await axios.delete(`http://localhost:5000/api/admin/delete/${empID}`);
    if (response.status === 200) {
      alert('ลบข้อมูลพนักงานสำเร็จ');
      // getSupervisors();  // รีเฟรชข้อมูลพนักงานหลังจากการลบ
      getLeaders();
    }
  } catch (error) {
    console.error("Error during delete:", error);
    alert('Error during delete.');
  }
};

onMounted(() => {
  // getSupervisors();
  getLeaders();
});
</script>

<style scoped>
* { box-sizing: border-box; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full {
  grid-column: span 2;
}

/* label */
.form-group label {
  font-size: 11px;
  font-weight: 700;
  color: #718096;
  margin-bottom: 4px;
}

/* input */
.form-group input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
}

/* buttons */
.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  grid-column: span 2;
}

.btn-save {
  flex: 1;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;   /* เพิ่ม */
  border: none;
  cursor: pointer;
}

.btn-save:hover {
  transform: translateY(-1px);
}

.btn-cancel {
  flex: 1;
  background: #edf2f7;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;   /* เพิ่ม */
  font-weight: 600;  /* เพิ่ม */
  color: #4a5568;    /* เพิ่ม */
  cursor: pointer;   /* เพิ่ม */
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e8edf5, #dce3ef);
  padding: 0;
  font-family: 'Segoe UI', sans-serif;
}

.header {
  background: white;
  margin: 0;
  padding: 18px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 22px;
  font-weight: 700;
  color: #1a202c;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.employee-table {
  width: calc(100% - 64px);
  margin: 32px auto;
  border-collapse: collapse;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

.employee-table th {
  background: #f7fafc;
  padding: 13px 16px;
  text-align: left;
  font-size: 16px;
  font-weight: 700;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 2px solid #e2e8f0;
}

.employee-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #f0f4f8;
  font-size: 16px;
  color: #2d3748;
  vertical-align: middle;
}

.employee-table tr:last-child td { border-bottom: none; }
.employee-table tr:hover td { background: #f7fafc; }

.row-registered td { background: #f0fff4; }
.row-registered:hover td { background: #e6ffed !important; }

.idx { color: #a0aec0; font-size: 12px; width: 32px; }

.empid-badge {
  background: #ebf4ff;
  color: #3182ce;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
}

.name-cell { display: flex; align-items: center; gap: 10px; }

.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.full-name { font-weight: 600; color: #2d3748; }
.email-cell { color: #718096; font-size: 13px; }

.tag { padding: 2px 10px; border-radius: 20px; font-size: 16px; font-weight: 600; }
.tag-blue { background: #ebf4ff; color: #3182ce; }
.tag-gray { background: #edf2f7; color: #4a5568; }

.action-cell { display: flex; gap: 6px; align-items: center; }

button { float: none !important; margin: 0; }

.btn-register {
  background: #48bb78; color: white;
  padding: 5px 12px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 16px; font-weight: 600;
  transition: background 0.2s; white-space: nowrap;
}
.btn-register:hover { background: #38a169; }
.btn-register:disabled { background: #c6f6d5; color: #276749; cursor: default; }

.btn-edit {
  background: #ed8936; color: white;
  padding: 5px 12px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 16px; font-weight: 600;
  transition: background 0.2s;
}
.btn-edit:hover { background: #dd6b20; }

.btn-delete {
  background: #fc8181; color: white;
  padding: 5px 12px; border: none; border-radius: 6px;
  cursor: pointer; font-size: 16px; font-weight: 600;
  transition: background 0.2s;
}
.btn-delete:hover { background: #e53e3e; }

.no-employees { text-align: center; color: #718096; font-size: 16px; padding: 60px; }

.edit-form-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; justify-content: center; align-items: center;
  z-index: 999; backdrop-filter: blur(2px);
}

.edit-form-container {
  background: white;
  padding: 32px;
  border-radius: 20px;
  width: 560px;           /* ขยายนิดนึงให้ 2 col สบาย */
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  position: relative;     /* เพิ่ม */
}

.btn-close {
  position: absolute;
  top: 14px;
  right: 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
  line-height: 1;
}

.btn-close:hover {
  background: #fee2e2;
  color: #e53e3e;
}

.edit-form-container h3 {
  font-size: 18px; font-weight: 700; color: #1a202c;
  margin-bottom: 20px; text-align: center;
}

.edit-form-container label {
  display: block; font-size: 11px; font-weight: 700;
  color: #718096; text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 5px; margin-top: 12px;
}

.edit-form-container input {
  width: 100%; padding: 9px 12px;
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 14px; transition: border 0.2s;
}
.edit-form-container input:focus { outline: none; border-color: #4299e1; }
.edit-form-container input[readonly] { background: #f7fafc; color: #a0aec0; }

</style>