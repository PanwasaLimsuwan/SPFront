<template>
  <div class="admin-widget-manager">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <h1>🎛️ Widget Management</h1>
        <p class="subtitle">Manage all dashboard widgets and features</p>
      </div>
      <div class="header-right">
        <button class="btn-primary" @click="openAddModal">
          ➕ Add New Widget
        </button>
        <button class="btn-secondary" @click="goBack">
          ← Back to Dashboard
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading widgets...</p>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-banner">
      <span>❌ {{ errorMessage }}</span>
      <button @click="errorMessage = ''">✕</button>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-banner">
      <span>✅ {{ successMessage }}</span>
      <button @click="successMessage = ''">✕</button>
    </div>

    <!-- Widgets Table -->
    <div v-if="!loading" class="table-container">
      <table class="widgets-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Display Name</th>
            <th>Component</th>
            <th>Span 2 Cols</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="widgets.length === 0">
            <td colspan="7" class="no-data">No widgets found</td>
          </tr>
          <tr v-for="widget in widgets" :key="widget.id">
            <td><code>{{ widget.id }}</code></td>
            <td>
              <strong>{{ widget.displayName || widget.id }}</strong>
            </td>
            <td>
              <span class="component-tag">{{ widget.componentName }}</span>
            </td>
            <td>
              <span 
                class="badge" 
                :class="widget.span2 ? 'badge-success' : 'badge-gray'"
              >
                {{ widget.span2 ? 'Yes' : 'No' }}
              </span>
            </td>
            <td>
              <span 
                class="badge" 
                :class="widget.isActive ? 'badge-success' : 'badge-danger'"
              >
                {{ widget.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>{{ formatDate(widget.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button 
                  class="btn-icon btn-edit" 
                  @click="openEditModal(widget)"
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  class="btn-icon btn-toggle"
                  @click="toggleWidgetStatus(widget)"
                  :title="widget.isActive ? 'Deactivate' : 'Activate'"
                >
                  {{ widget.isActive ? '👁️' : '👁️‍🗨️' }}
                </button>
                <button 
                  class="btn-icon btn-delete" 
                  @click="openDeleteModal(widget)"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ isEditMode ? '✏️ Edit Widget' : '➕ Add New Widget' }}</h2>
          <button class="btn-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="widgetId">Widget ID *</label>
            <input
              id="widgetId"
              v-model="formData.id"
              type="text"
              placeholder="e.g., myNewWidget"
              :disabled="isEditMode"
              required
            />
            <small>Unique identifier (cannot be changed after creation)</small>
          </div>

          <div class="form-group">
            <label for="displayName">Display Name *</label>
            <input
              id="displayName"
              v-model="formData.displayName"
              type="text"
              placeholder="e.g., My New Widget"
              required
            />
          </div>

          <div class="form-group">
            <label for="componentName">Component Name *</label>
            <input
              id="componentName"
              v-model="formData.componentName"
              type="text"
              placeholder="e.g., MyNewWidget"
              required
            />
            <small>Vue component file name (must exist in components/)</small>
          </div>

          <div class="form-group">
            <label for="componentPath">Component Path</label>
            <input
              id="componentPath"
              v-model="formData.componentPath"
              type="text"
              placeholder="e.g., ../components/MyNewWidget.vue"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData.span2"
              />
              <span>Span 2 columns (wide widget)</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData.isActive"
              />
              <span>Active (visible to users)</span>
            </label>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="3"
              placeholder="Widget description..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn-primary" @click="saveWidget">
            {{ isEditMode ? 'Save Changes' : 'Create Widget' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>🗑️ Delete Widget</h2>
          <button class="btn-close" @click="closeDeleteModal">✕</button>
        </div>

        <div class="modal-body">
          <p>Are you sure you want to delete this widget?</p>
          <div class="delete-info">
            <strong>{{ widgetToDelete?.displayName || widgetToDelete?.id }}</strong>
            <code>{{ widgetToDelete?.id }}</code>
          </div>
          <p class="warning-text">
            ⚠️ This action cannot be undone. All user configurations for this widget will be lost.
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">Delete Widget</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_BASE = 'http://16.176.50.155:5000/api';

// State
const widgets = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Modal state
const showModal = ref(false);
const showDeleteModal = ref(false);
const isEditMode = ref(false);
const widgetToDelete = ref(null);

// Form data
const formData = ref({
  id: '',
  displayName: '',
  componentName: '',
  componentPath: '',
  span2: false,
  isActive: true,
  description: '',
});

// Fetch all widgets
const fetchWidgets = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    const response = await axios.get(`${API_BASE}/Widget`);
    widgets.value = response.data;

    console.log('✅ Widgets loaded:', widgets.value.length);
  } catch (error) {
    console.error('❌ Error fetching widgets:', error);
    errorMessage.value = `Failed to load widgets: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

// Open Add Modal
const openAddModal = () => {
  isEditMode.value = false;
  formData.value = {
    id: '',
    displayName: '',
    componentName: '',
    componentPath: '',
    span2: false,
    isActive: true,
    description: '',
  };
  showModal.value = true;
};

// Open Edit Modal
const openEditModal = (widget) => {
  isEditMode.value = true;
  formData.value = { ...widget };
  showModal.value = true;
};

// Close Modal
const closeModal = () => {
  showModal.value = false;
  formData.value = {
    id: '',
    displayName: '',
    componentName: '',
    componentPath: '',
    span2: false,
    isActive: true,
    description: '',
  };
};

// Save Widget (Create or Update)
const saveWidget = async () => {
  try {
    // Validation
    if (!formData.value.id || !formData.value.displayName || !formData.value.componentName) {
      errorMessage.value = 'Please fill in all required fields';
      return;
    }

    loading.value = true;
    errorMessage.value = '';

    if (isEditMode.value) {
      // Update
      await axios.put(`${API_BASE}/Widget/${formData.value.id}`, formData.value);
      successMessage.value = `Widget "${formData.value.displayName}" updated successfully`;
    } else {
      // Create
      await axios.post(`${API_BASE}/Widget`, formData.value);
      successMessage.value = `Widget "${formData.value.displayName}" created successfully`;
    }

    closeModal();
    await fetchWidgets();

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('❌ Error saving widget:', error);
    errorMessage.value = `Failed to save widget: ${error.response?.data?.message || error.message}`;
  } finally {
    loading.value = false;
  }
};

// Toggle Widget Active Status
const toggleWidgetStatus = async (widget) => {
  try {
    loading.value = true;
    errorMessage.value = '';

    const updatedWidget = {
      ...widget,
      isActive: !widget.isActive,
    };

    await axios.put(`${API_BASE}/Widget/${widget.id}`, updatedWidget);
    
    successMessage.value = `Widget "${widget.displayName}" ${updatedWidget.isActive ? 'activated' : 'deactivated'}`;
    
    await fetchWidgets();

    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('❌ Error toggling widget status:', error);
    errorMessage.value = `Failed to update widget status: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

// Open Delete Modal
const openDeleteModal = (widget) => {
  widgetToDelete.value = widget;
  showDeleteModal.value = true;
};

// Close Delete Modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  widgetToDelete.value = null;
};

// Confirm Delete
const confirmDelete = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    await axios.delete(`${API_BASE}/Widget/${widgetToDelete.value.id}`);
    
    successMessage.value = `Widget "${widgetToDelete.value.displayName}" deleted successfully`;
    
    closeDeleteModal();
    await fetchWidgets();

    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('❌ Error deleting widget:', error);
    errorMessage.value = `Failed to delete widget: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// Go back to dashboard
const goBack = () => {
  window.location.href = '/dashboard';
};

// Lifecycle
onMounted(() => {
  fetchWidgets();
});
</script>

<style scoped>
.admin-widget-manager {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 28px;
  color: #1a202c;
}

.subtitle {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* Buttons */
.btn-primary {
  background: #4299e1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #edf2f7;
  color: #2d3748;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-danger {
  background: #f56565;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #e53e3e;
}

/* Loading */
.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Banners */
.error-banner,
.success-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.error-banner {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
}

.success-banner {
  background: #f0fff4;
  color: #2f855a;
  border: 1px solid #9ae6b4;
}

.error-banner button,
.success-banner button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: inherit;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.widgets-table {
  width: 100%;
  border-collapse: collapse;
}

.widgets-table thead {
  background: #f7fafc;
}

.widgets-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
}

.widgets-table td {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.widgets-table tbody tr:hover {
  background: #f7fafc;
}

.no-data {
  text-align: center;
  color: #a0aec0;
  padding: 40px !important;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success {
  background: #c6f6d5;
  color: #22543d;
}

.badge-danger {
  background: #fed7d7;
  color: #742a2a;
}

.badge-gray {
  background: #e2e8f0;
  color: #4a5568;
}

.component-tag {
  background: #edf2f7;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.btn-icon:hover {
  background: #f7fafc;
  transform: translateY(-1px);
}

.btn-edit:hover {
  border-color: #4299e1;
}

.btn-delete:hover {
  border-color: #f56565;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1a202c;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #a0aec0;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #4a5568;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4299e1;
}

.form-group input:disabled {
  background: #f7fafc;
  color: #a0aec0;
  cursor: not-allowed;
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: #718096;
  font-size: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

/* Delete Modal */
.delete-info {
  background: #f7fafc;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.delete-info strong {
  display: block;
  margin-bottom: 4px;
  color: #2d3748;
}

.delete-info code {
  background: #edf2f7;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.warning-text {
  color: #dd6b20;
  margin-top: 16px;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
  }

  .widgets-table {
    font-size: 14px;
  }

  .widgets-table th,
  .widgets-table td {
    padding: 12px 8px;
  }
}
</style>