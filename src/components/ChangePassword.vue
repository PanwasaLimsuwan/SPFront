<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const password = ref("");
const confirmPassword = ref("");
const router = useRouter();

async function changePassword() {
  if (password.value !== confirmPassword.value) {
    alert("Password not match");
    return;
  }

  await axios.post("/api/Admin/change-password", {
    newPassword: password.value,
  });

  localStorage.setItem("isFirstLogin", false);
  alert("Password updated");
  router.push("/dashboard-admin");
}
</script>

<template>
  <div>
    <h2>Change Password</h2>
    <input v-model="password" type="password" placeholder="New password" />
    <input v-model="confirmPassword" type="password" placeholder="Confirm password" />
    <button @click="changePassword">Save</button>
  </div>
</template>