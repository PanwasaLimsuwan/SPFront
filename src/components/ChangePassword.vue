<template>
  <div class="auth-page">
    <div class="card">
      <img src="/logo2.png" alt="Logo" class="logo" />
      <h2>Change Password</h2>

      <form @submit.prevent="handleChange">
        <div class="form-group">
          <label>New Password</label>
          <input
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter new password"
          />
        </div>

        <div class="form-group">
          <label>Confirm Password</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Confirm new password"
          />
        </div>

        <div class="options">
          <label class="show-pass">
            <input type="checkbox" v-model="showPassword" />
            <span>Show password</span>
          </label>
        </div>

        <button class="btn" type="submit" :disabled="loading">
          <span v-if="!loading">Change Password</span>
          <span v-else>Processing...</span>
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();

const newPassword = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const error = ref("");
const loading = ref(false);

async function handleChange() {
  error.value = "";

  if (!newPassword.value || !confirmPassword.value) {
    error.value = "กรอกให้ครบ";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = "Password ไม่ตรงกัน";
    return;
  }

  try {
    loading.value = true;

    await axios.post(
      "/api/admin/change-password",
      { newPassword: newPassword.value },
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      }
    );

    // reset flag
    sessionStorage.setItem("mustChangePassword", "false");

    const role = sessionStorage.getItem("role");

    if (role === "Admin") router.push("/dashboard-admin");
    else if (role === "LeaderMFG") router.push("/dashboard-mfg");
    else if (role === "LeaderHR") router.push("/dashboard-hr");
    else router.push("/");
  } catch (e) {
    error.value = "เปลี่ยนรหัสไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f6f7fb;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  padding: 28px 24px;
}

.logo {
  width: 90px;
  display: block;
  margin: 0 auto 8px;
}

h2 {
  text-align: center;
  margin-bottom: 18px;
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9dce3;
  border-radius: 8px;
  background: #fafafa;
  outline: none;
}

input:focus {
  border-color: #6c8cff;
  background: #fff;
}

.options {
  display: flex;
  font-size: 0.92rem;
  gap: 8px;
  margin: 8px 0 12px;
}

.options label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.btn {
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin-top: 10px;
  color: #d93025;
}
</style>