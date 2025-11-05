<template>
  <div v-if="pendingCount > 0" class="notification-banner">
    <div class="notification-content">
      <span class="notification-icon">🔔</span>
      <span class="notification-text">
        You have {{ pendingCount }} pending assignment{{ pendingCount > 1 ? 's' : '' }} waiting for approval
      </span>
      <button class="btn-view" @click="showModal = true">
        View Details
      </button>
    </div>

    <!-- Modal แสดงรายการ Assignments -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Pending Assignments</h2>
          <button class="btn-close" @click="showModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading">Loading...</div>
          
          <div v-else-if="assignments.length === 0" class="no-data">
            No pending assignments
          </div>

          <div v-else class="assignments-list">
            <div 
              v-for="assignment in assignments" 
              :key="assignment.assignmentID"
              class="assignment-card"
            >
              <div class="assignment-info">
                <div class="info-row">
                  <span class="label">Employee:</span>
                  <span class="value">
                    {{ assignment.employee?.firstName }} {{ assignment.employee?.lastName }}
                    (ID: {{ assignment.empID }})
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">From:</span>
                  <span class="value">{{ assignment.fromProcess }} - {{ assignment.fromBiz }}</span>
                </div>
                <div class="info-row">
                  <span class="label">To:</span>
                  <span class="value highlight">{{ assignment.toProcess }} - {{ assignment.toBiz }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Request Date:</span>
                  <span class="value">{{ formatDate(assignment.requestDate) }}</span>
                </div>
              </div>

              <div class="assignment-actions">
                <button 
                  class="btn-approve" 
                  @click="approveAssignment(assignment.assignmentID)"
                  :disabled="processing"
                >
                  ✓ Approve
                </button>
                <button 
                  class="btn-reject" 
                  @click="rejectAssignment(assignment.assignmentID)"
                  :disabled="processing"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  userProcess: {
    type: String,
    required: true
  },
  filters: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['refresh']);

const showModal = ref(false);
const assignments = ref([]);
const pendingCount = ref(0);
const loading = ref(false);
const processing = ref(false);

// ✅ ดึงข้อมูล Pending Assignments
const fetchPendingAssignments = async () => {
  loading.value = true;
  try {
    const response = await axios.get('http://localhost:5000/api/Assignment/pending-for-supervisor', {
      params: {
        process: props.userProcess // ส่ง process ของ user ไปด้วย
      }
    });
    
    assignments.value = response.data;
    pendingCount.value = response.data.length;
    
    console.log(`📥 Loaded ${pendingCount.value} pending assignments`);
  } catch (error) {
    console.error('Error fetching pending assignments:', error);
    assignments.value = [];
    pendingCount.value = 0;
  } finally {
    loading.value = false;
  }
};

// ✅ อนุมัติ Assignment
const approveAssignment = async (assignmentId) => {
  if (!confirm('Are you sure you want to approve this assignment?')) return;
  
  processing.value = true;
  try {
    await axios.post(`http://localhost:5000/api/Assignment/approve/${assignmentId}`);
    
    alert('Assignment approved successfully!');
    
    // รีเฟรช
    await fetchPendingAssignments();
    emit('refresh'); // แจ้ง Dashboard ให้รีเฟรชข้อมูล
  } catch (error) {
    console.error('Error approving assignment:', error);
    alert('Failed to approve assignment. Please try again.');
  } finally {
    processing.value = false;
  }
};

// ✅ ปฏิเสธ Assignment
const rejectAssignment = async (assignmentId) => {
  const reason = prompt('Please provide a reason for rejection (optional):');
  if (reason === null) return; // ยกเลิก
  
  processing.value = true;
  try {
    await axios.post(`http://localhost:5000/api/Assignment/reject/${assignmentId}`, 
      JSON.stringify(reason),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    alert('Assignment rejected successfully!');
    
    // รีเฟรช
    await fetchPendingAssignments();
    emit('refresh');
  } catch (error) {
    console.error('Error rejecting assignment:', error);
    alert('Failed to reject assignment. Please try again.');
  } finally {
    processing.value = false;
  }
};

// ✅ Format วันที่
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// ✅ โหลดข้อมูลตอน mount
onMounted(() => {
  fetchPendingAssignments();
  
  // รีเฟรชทุก 30 วินาที
  setInterval(fetchPendingAssignments, 30000);
});

// ✅ Watch userProcess เปลี่ยน
watch(() => props.userProcess, () => {
  fetchPendingAssignments();
});
</script>

<style scoped>
.notification-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  margin: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-icon {
  font-size: 24px;
  animation: ring 2s infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
}

.notification-text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
}

.btn-view {
  background: white;
  color: #667eea;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-view:hover {
  transform: scale(1.05);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.btn-close {
  background: #f3f4f6;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assignment-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.assignment-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  gap: 12px;
}

.label {
  font-weight: 600;
  color: #6b7280;
  min-width: 120px;
}

.value {
  color: #1f2937;
}

.value.highlight {
  color: #667eea;
  font-weight: 600;
}

.assignment-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-approve, .btn-reject {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-2px);
}

.btn-approve:disabled, .btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>