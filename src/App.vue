<template>
    <div id="app">
        <nav>
            <!-- ใช้ router-link เพื่อเปลี่ยนหน้า -->
            <router-link to="/mfg">Dashboard MFG</router-link> |
            <router-link to="/hr">Dashboard HR</router-link>  |
            <router-link to="/ts">Dashboard test</router-link>
        </nav>
        <router-view />
        <h1>{{ message }}</h1> <!-- แสดงข้อความจาก API -->
    </div>
</template>

<script>
    import api from "./services/api";

    export default {
        name: 'App',
        data() {
            return { message: "" };
        },
        async mounted() {
            try {
                const response = await api.getMessage();
                this.message = response.data.message;
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        },
    };
</script>

<style>
    body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
    }
</style>
