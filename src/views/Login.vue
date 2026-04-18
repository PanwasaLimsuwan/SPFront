<template>
  <div class="auth-page">
    <div class="card">
      <img src="/logo2.png" alt="Logo" class="logo" />
      <h2 v-if="isLogin">Sign in</h2>

      <!-- Login Form -->
      <form @submit.prevent="onSubmit">
        <div class="form-group">
          <label>Email</label>
          <input
            v-model.trim="email"
            type="email"
            placeholder="Enter email"
            autocomplete="email"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input
            v-model.trim="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter password"
            autocomplete="current-password"
            :disabled="loading"
          />
        </div>

        <div class="options">
          <label class="show-pass">
            <input type="checkbox" v-model="showPassword" />
            <span>Show password</span>
          </label>
          <!-- <label><input type="checkbox" v-model="remember" /> Remember me</label> -->
        </div>

        <button class="btn" type="submit" :disabled="loading">
          <span v-if="!loading">Login</span>
          <span v-else>Signing in...</span>
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <!-- <p class="hint">
        <span v-if="isLogin">Don't have an account?</span>
        <a href="#" @click.prevent="toggleAuthMode">Sign up</a>
      </p> -->
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login } from "../services/AuthService";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);

async function onSubmit() {
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "กรุณากรอกข้อมูล";
    return;
  }

  try {
    loading.value = true;

    const { role, mustChangePassword } = await login({
      email: email.value,
      password: password.value,
    });

    // 🔥 บังคับเปลี่ยนรหัส
    if (mustChangePassword) {
      router.push("/change-password");
      return;
    }

    // redirect ตาม role
    if (role === "Admin") router.push("/dashboard-admin");
    else if (role === "LeaderMFG") router.push("/dashboard-mfg");
    else if (role === "LeaderHR") router.push("/dashboard-hr");
    else router.push("/");
  } catch (e) {
    error.value = e.message;
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

.hint {
  margin-top: 16px;
  font-size: 0.85rem;
  color: #777;
  text-align: center;
}

.options .show-pass {
  display: inline-flex !important;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
</style>
