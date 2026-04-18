<template>
  <button class="btn-logout" @click="doLogout">
    Log out
  </button>
</template>

<script setup>
function doLogout() {
  sessionStorage.clear();
  window.location.href = "/";
}
</script>

<style scoped>
.btn-logout {
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background-color: #e57373;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
.btn-logout:hover {
  background-color: #ef5350;
}
</style>