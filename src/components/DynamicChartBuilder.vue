<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import Plotly from 'plotly.js';

const API_BASE = 'http://localhost:5000/api';

// ✅ Form Data
const formData = ref({
  tableName: '',
  xAxis: '',
  yAxis: [],
  aggregation: 'SUM',
  chartType: 'bar',
  filters: {},
  dateRange: { start: '', end: '' }
});

// ✅ Metadata from Backend
const metadata = ref({});
const availableTables = computed(() => Object.keys(metadata.value));
const availableColumns = computed(() => {
  return formData.value.tableName ? metadata.value[formData.value.tableName] || [] : [];
});

const numericColumns = computed(() => 
  availableColumns.value.filter(col => 
    ['int', 'decimal', 'float', 'numeric', 'bigint', 'real', 'money', 'smallint', 'tinyint'].includes(col.type.toLowerCase())
  )
);

const dateColumns = computed(() =>
  availableColumns.value.filter(col =>
    ['date', 'datetime', 'datetime2', 'smalldatetime', 'datetimeoffset'].includes(col.type.toLowerCase())
  )
);

// ✅ Chart Data
const chartData = ref([]);
const isLoading = ref(false);
const isLoadingMetadata = ref(true);
const error = ref(null);
const chartContainer = ref(null);

// ✅ Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B9D', '#C44569'];

// ✅ Fetch Metadata on Mount
onMounted(async () => {
  try {
    console.log('🔄 Loading metadata from:', `${API_BASE}/chart-metadata`);
    const response = await axios.get(`${API_BASE}/chart-metadata`);
    
    console.log('✅ Metadata response:', response.data);
    
    if (response.data && response.data.metadata) {
      metadata.value = response.data.metadata;
      console.log('📊 Tables available:', Object.keys(metadata.value));
    } else {
      throw new Error('Invalid metadata format');
    }
  } catch (err) {
    console.error('❌ Error fetching metadata:', err);
    error.value = `Failed to load table metadata: ${err.message}`;
  } finally {
    isLoadingMetadata.value = false;
  }
});

// ✅ Generate Chart
const generateChart = async () => {
  if (!formData.value.tableName || !formData.value.xAxis || formData.value.yAxis.length === 0) {
    error.value = 'กรุณาเลือกตาราง, แกน X และแกน Y อย่างน้อย 1 ตัว';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    console.log('📤 Sending request:', formData.value);
    const response = await axios.post(`${API_BASE}/dynamic-chart`, formData.value);
    
    console.log('📥 Response:', response.data);
    
    if (response.data && response.data.data) {
      chartData.value = response.data.data;
      
      // Render Plotly chart after DOM update
      await nextTick();
      renderPlotlyChart();
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('❌ Error generating chart:', err);
    error.value = err.response?.data?.error || err.message || 'Failed to generate chart';
  } finally {
    isLoading.value = false;
  }
};

// ✅ Render Plotly Chart
const renderPlotlyChart = () => {
  if (!chartContainer.value || chartData.value.length === 0) return;

  const xValues = chartData.value.map(d => d[formData.value.xAxis]);
  
  let traces = [];
  let layout = {
    title: {
      text: `${formData.value.chartType.toUpperCase()} Chart - ${formData.value.tableName}`,
      font: { size: 18, color: '#2c3e50' }
    },
    xaxis: { 
      title: formData.value.xAxis,
      tickangle: -45
    },
    yaxis: { 
      title: 'Value'
    },
    hovermode: 'closest',
    showlegend: true,
    legend: { 
      x: 1.02, 
      xanchor: 'left', 
      y: 1,
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: '#e0e0e0',
      borderwidth: 1
    },
    margin: { l: 60, r: 20, t: 60, b: 100 },
    paper_bgcolor: 'white',
    plot_bgcolor: '#f8f9fa'
  };

  if (formData.value.chartType === 'pie') {
    // Pie Chart
    traces = [{
      type: 'pie',
      labels: xValues,
      values: chartData.value.map(d => d[formData.value.yAxis[0]]),
      marker: {
        colors: COLORS
      },
      textinfo: 'label+percent',
      hoverinfo: 'label+value+percent',
      hole: 0.3
    }];
    
    layout = {
      title: {
        text: `${formData.value.tableName} - ${formData.value.yAxis[0]}`,
        font: { size: 18, color: '#2c3e50' }
      },
      showlegend: true,
      legend: { 
        orientation: 'v',
        x: 1.02,
        xanchor: 'left'
      },
      paper_bgcolor: 'white'
    };
  } else {
    // Bar, Line, Area Charts
    formData.value.yAxis.forEach((yField, index) => {
      const yValues = chartData.value.map(d => d[yField]);
      
      let trace = {
        x: xValues,
        y: yValues,
        name: yField,
        marker: { color: COLORS[index % COLORS.length] }
      };

      if (formData.value.chartType === 'bar') {
        trace.type = 'bar';
      } else if (formData.value.chartType === 'line') {
        trace.type = 'scatter';
        trace.mode = 'lines+markers';
        trace.line = { 
          color: COLORS[index % COLORS.length], 
          width: 3 
        };
        trace.marker = { 
          size: 8,
          color: COLORS[index % COLORS.length]
        };
      } else if (formData.value.chartType === 'area') {
        trace.type = 'scatter';
        trace.mode = 'lines';
        trace.fill = 'tozeroy';
        trace.line = { color: COLORS[index % COLORS.length] };
        trace.fillcolor = COLORS[index % COLORS.length] + '40';
      }

      traces.push(trace);
    });
  }

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: `chart_${formData.value.tableName}_${Date.now()}`,
      height: 600,
      width: 1000,
      scale: 2
    }
  };

  Plotly.newPlot(chartContainer.value, traces, layout, config);
};

// ✅ Reset Form
const resetForm = () => {
  formData.value = {
    tableName: '',
    xAxis: '',
    yAxis: [],
    aggregation: 'SUM',
    chartType: 'bar',
    filters: {},
    dateRange: { start: '', end: '' }
  };
  chartData.value = [];
  error.value = null;
  
  if (chartContainer.value) {
    Plotly.purge(chartContainer.value);
  }
};

// ✅ Watch table change to reset fields
watch(() => formData.value.tableName, () => {
  formData.value.xAxis = '';
  formData.value.yAxis = [];
  formData.value.filters = {};
});
</script>

<template>
  <div class="dynamic-chart-builder">
    <div class="builder-header">
      <h2>📊 Dynamic Chart Builder</h2>
      <p class="subtitle">สร้างกราฟจากข้อมูลในระบบแบบอัตโนมัติ (Powered by Plotly)</p>
    </div>

    <!-- Loading Metadata -->
    <div v-if="isLoadingMetadata" class="loading-state">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูลตาราง...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !chartData.length" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>เกิดข้อผิดพลาด</h3>
      <p>{{ error }}</p>
      <button @click="window.location.reload()" class="btn btn-primary">
        🔄 โหลดใหม่
      </button>
    </div>

    <!-- Form Section -->
    <div v-else class="form-section">
      <div class="form-grid">
        <!-- Table Selection -->
        <div class="form-group">
          <label>📋 เลือกตาราง</label>
          <select v-model="formData.tableName" class="form-control">
            <option value="">-- Select Table --</option>
            <option v-for="table in availableTables" :key="table" :value="table">
              {{ table }}
            </option>
          </select>
          <small v-if="availableTables.length === 0" class="text-warning">
            ⚠️ ไม่พบตารางในระบบ
          </small>
        </div>

        <!-- Chart Type -->
        <div class="form-group">
          <label>📈 ประเภทกราฟ</label>
          <select v-model="formData.chartType" class="form-control">
            <option value="bar">📊 Bar Chart</option>
            <option value="line">📈 Line Chart</option>
            <option value="area">📉 Area Chart</option>
            <option value="pie">🥧 Pie Chart</option>
          </select>
        </div>

        <!-- X-Axis -->
        <div class="form-group">
          <label>📍 แกน X (Dimension)</label>
          <select v-model="formData.xAxis" class="form-control" :disabled="!formData.tableName">
            <option value="">-- Select Column --</option>
            <option v-for="col in availableColumns" :key="col.name" :value="col.name">
              {{ col.name }} ({{ col.type }})
            </option>
          </select>
        </div>

        <!-- Y-Axis (Multiple) -->
        <div class="form-group">
          <label>📊 แกน Y (Metrics) - เลือกได้หลายตัว</label>
          <select v-model="formData.yAxis" class="form-control" multiple :disabled="!formData.tableName">
            <option v-for="col in numericColumns" :key="col.name" :value="col.name">
              {{ col.name }}
            </option>
          </select>
          <small>กด Ctrl/Cmd เพื่อเลือกหลายตัว</small>
          <small v-if="numericColumns.length === 0 && formData.tableName" class="text-warning">
            ⚠️ ไม่พบคอลัมน์ตัวเลขในตารางนี้
          </small>
        </div>

        <!-- Aggregation -->
        <div class="form-group">
          <label>🧮 การคำนวณ</label>
          <select v-model="formData.aggregation" class="form-control">
            <option value="">None (Raw Data)</option>
            <option value="SUM">SUM (รวม)</option>
            <option value="COUNT">COUNT (นับ)</option>
            <option value="AVG">AVG (เฉลี่ย)</option>
            <option value="MIN">MIN (ต่ำสุด)</option>
            <option value="MAX">MAX (สูงสุด)</option>
          </select>
        </div>

        <!-- Date Range (Optional) -->
        <div class="form-group" v-if="dateColumns.length > 0">
          <label>📅 ช่วงวันที่ (Optional)</label>
          <div class="date-range">
            <input type="date" v-model="formData.dateRange.start" class="form-control">
            <span>ถึง</span>
            <input type="date" v-model="formData.dateRange.end" class="form-control">
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="generateChart" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? '⏳ กำลังสร้างกราฟ...' : '✨ สร้างกราฟ' }}
        </button>
        <button @click="resetForm" class="btn btn-secondary">
          🔄 รีเซ็ต
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        ⚠️ {{ error }}
      </div>
    </div>

    <!-- ✅ Chart Display Section -->
    <div v-if="chartData.length > 0" class="chart-section">
      <div class="chart-header">
        <h3>📊 ผลลัพธ์</h3>
        <div class="chart-info">
          <span class="badge">{{ chartData.length }} รายการ</span>
          <span class="badge">{{ formData.chartType.toUpperCase() }}</span>
        </div>
      </div>
      
      <!-- Plotly Chart Container -->
      <div ref="chartContainer" class="plotly-chart"></div>

      <!-- Data Table -->
      <div class="data-table">
        <h4>📋 ข้อมูลดิบ</h4>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{{ formData.xAxis }}</th>
                <th v-for="yField in formData.yAxis" :key="yField">{{ yField }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in chartData" :key="index">
                <td>{{ row[formData.xAxis] }}</td>
                <td v-for="yField in formData.yAxis" :key="yField">
                  {{ typeof row[yField] === 'number' ? row[yField].toLocaleString() : row[yField] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && !isLoadingMetadata" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>ยังไม่มีกราฟ</h3>
      <p>กรุณาเลือกข้อมูลและกดปุ่ม "สร้างกราฟ" เพื่อแสดงผล</p>
      <div class="features">
        <div class="feature-item">
          <span>🔍</span>
          <p>Zoom & Pan</p>
        </div>
        <div class="feature-item">
          <span>💾</span>
          <p>Export PNG</p>
        </div>
        <div class="feature-item">
          <span>🎯</span>
          <p>Interactive</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dynamic-chart-builder {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.builder-header {
  margin-bottom: 24px;
  text-align: center;
}

.builder-header h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.95rem;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.error-state h3 {
  color: #c33;
  margin: 0 0 8px 0;
}

.error-state p {
  color: #666;
  margin: 0 0 24px 0;
}

.form-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-control {
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
}

.form-control:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-control[multiple] {
  min-height: 120px;
}

.date-range {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-range span {
  color: #7f8c8d;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  border-left: 4px solid #c33;
}

.chart-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #2c3e50;
}

.chart-info {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 6px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.plotly-chart {
  width: 100%;
  min-height: 450px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.data-table {
  margin-top: 32px;
}

.data-table h4 {
  margin-bottom: 16px;
  color: #2c3e50;
}

.table-wrapper {
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table tr:hover {
  background: #f8f9fa;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.empty-state > p {
  color: #7f8c8d;
  margin: 0 0 32px 0;
}

.features {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 32px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.feature-item span {
  font-size: 2rem;
}

.feature-item p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

small {
  color: #7f8c8d;
  font-size: 0.85rem;
  display: block;
  margin-top: 4px;
}

.text-warning {
  color: #f39c12;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .features {
    flex-direction: column;
    gap: 16px;
  }
}
</style>