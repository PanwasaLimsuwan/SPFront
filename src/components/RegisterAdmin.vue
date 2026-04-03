<template>
  <div class="dashboard-container">
    <h1 class="header">⚙️ Manage Admin <Logout /></h1>

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
          <td class="action-cell">
            <button
              class="btn-register"
              :disabled="employee.isRegistered"
              @click="registerAdmin(employee)"
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

    <!-- Edit Modal เดิม ไม่แตะ -->
    <div v-if="isEditFormVisible" class="edit-form-overlay">
      <div class="edit-form-container">
        <h3>Edit Employee</h3>
        <form @submit.prevent="editEmployee">
          <label>EmpID:</label>
          <input type="text" v-model="editData.empID" readonly />
          <label>First Name:</label>
          <input type="text" v-model="editData.firstName" required />
          <label>Last Name:</label>
          <input type="text" v-model="editData.lastName" required />
          <label>Email:</label>
          <input type="email" v-model="editData.email" required />
          <label>Biz:</label>
          <input type="text" v-model="editData.biz" required />
          <label>PlanID:</label>
          <input type="text" v-model="editData.planID" required />
          <label>Process:</label>
          <input type="text" v-model="editData.process" required />
          <label>Section:</label>
          <input type="text" v-model="editData.section" required />
          <label>Division:</label>
          <input type="text" v-model="editData.division" required />
          <label>JobGrade:</label>
          <input type="text" v-model="editData.jobGrade" required />
          <label>Position:</label>
          <input type="text" v-model="editData.position" required />
          <label>ShiftCode:</label>
          <input type="text" v-model="editData.shiftCode" required />
          <label>CostCenter:</label>
          <input type="text" v-model="editData.costCenter" required />
          <label>Department:</label>
          <input type="text" v-model="editData.department" required />
          <button type="submit">Save Changes</button>
          <button type="button" @click="closeEditForm">Cancel</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import Logout from "../views/Logout";

const employees = ref([]);
const isEditFormVisible = ref(false);
const editData = ref({
  empID: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'Admin',
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

// const getTechnicians = async () => {
//   try {
//     const response = await axios.get('http://localhost:5000/api/EmployeeInfo/get-technicians');
//     if (response.data && response.data.length > 0) {
//       employees.value = response.data;
//     }
//   } catch (error) {
//     console.error('Error fetching technicians', error);
//   }
// };

const getTechnicians = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/EmployeeInfo/get-technicians"
    );
    if (response.data && response.data.length > 0) {
      // ตรวจสอบว่าพนักงานแต่ละคนลงทะเบียนแล้วหรือยัง
      employees.value = response.data.map((employee) => ({
        ...employee,
        isRegistered: false, // เริ่มต้นให้ไม่มีการลงทะเบียน
      }));

      // ตรวจสอบการลงทะเบียนใน API
      for (const employee of employees.value) {
        const isRegisteredResponse = await checkIfRegistered(employee.empID);
        employee.isRegistered = isRegisteredResponse.isRegistered;
      }
    } else {
      console.error("No supervisors found or invalid data");
    }
  } catch (error) {
    console.error("Error fetching supervisors", error);
  }
};

const generateRandomPassword = (length = 8) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
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
    const response = await axios.get(
      `http://localhost:5000/api/admin/check-registration-admin?empID=${empID}`
    );
    return response.data;
  } catch (error) {
    console.error("Error checking registration:", error);
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

const registerAdmin = async (employee) => {
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
  try {
    const response = await axios.post("http://localhost:5000/api/admin/register-admin", {
      EmpID: employee.empID,
      FirstName: employee.firstName,
      LastName: employee.lastName,
      Email: employee.email,
      PasswordHash: defaultPassword,
      Role: "Admin",
    });
    if (response.status === 200) {
      alert("Employee registered successfully.");
      getTechnicians(); // รีเฟรชข้อมูลพนักงานหลังจากการลงทะเบียน
    }
  } catch (error) {
    console.error("Error during registration:", error);
    alert("Error during registration.");
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
      alert("Employee updated successfully.");
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

const deleteEmployee = async (empID) => {
  if (!empID) {
    console.error("Invalid EmpID!");
    return;
  }

  try {
    const response = await axios.delete(`http://localhost:5000/api/admin/delete/${empID}`);
    if (response.status === 200) {
      alert('Employee deleted successfully.');
      // getSupervisors();  // รีเฟรชข้อมูลพนักงานหลังจากการลบ
      getTechnicians();
    }
  } catch (error) {
    console.error("Error during delete:", error);
    alert('Error during delete.');
  }
};

onMounted(() => {
  getTechnicians();
});
</script>

<style scoped>
* { box-sizing: border-box; }

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
  background: white; padding: 32px;
  border-radius: 20px; width: 480px;
  max-height: 85vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
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

.edit-form-container button[type="submit"] {
  width: 100%; margin-top: 20px; padding: 11px;
  background: #4299e1; color: white; border: none;
  border-radius: 10px; font-size: 15px; font-weight: 700;
  cursor: pointer; float: none;
}
.edit-form-container button[type="submit"]:hover { background: #3182ce; }

.edit-form-container button[type="button"] {
  width: 100%; margin-top: 8px; padding: 11px;
  background: #edf2f7; color: #4a5568; border: none;
  border-radius: 10px; font-size: 15px; font-weight: 600;
  cursor: pointer; float: none;
}
.edit-form-container button[type="button"]:hover { background: #e2e8f0; }
</style>