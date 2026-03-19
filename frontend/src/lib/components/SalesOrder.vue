<template>
  <div class="sales-order">
    <n-grid :cols="24" :x-gap="16" class="order-grid">
      <!-- 左侧：订单列表 -->
      <n-gi :span="17">
        <n-card title="销售订单" class="list-card">
          <template #header-extra>
            <n-space>
              <n-input v-model:value="searchText" placeholder="搜索订单..." clearable style="width: 160px" />
              <n-select v-model:value="statusFilter" placeholder="状态" :options="statusOptions" style="width: 120px" clearable />
              <n-button type="primary" size="small" @click="showCreateModal = true">
                <template #icon><n-icon><Plus /></n-icon></template>
                新建订单
              </n-button>
              <n-button size="small" @click="loadOrders">
                <template #icon><n-icon><RefreshCw /></n-icon></template>
              </n-button>
            </n-space>
          </template>
          
          <div class="table-wrapper">
            <vxe-table
              :data="filteredOrders"
              :loading="loading"
              stripe
              border
              show-overflow
              height="100%"
              :row-config="{ isHover: true }"
            >
              <vxe-column type="seq" width="60" />
              <vxe-column field="orderNo" title="订单号" width="150" />
              <vxe-column field="customerName" title="客户名称" min-width="120" />
              <vxe-column field="amount" title="金额" width="120">
                <template v-slot:default="{ row }">
                  <span class="amount">¥{{ formatAmount(row.amount) }}</span>
                </template>
              </vxe-column>
              <vxe-column field="status" title="状态" width="100">
                <template v-slot:default="{ row }">
                  <n-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </n-tag>
                </template>
              </vxe-column>
              <vxe-column field="createTime" title="创建时间" width="180" />
              <vxe-column title="操作" width="160">
                <template v-slot:default="{ row }">
                  <n-space>
                    <n-button size="small" type="info" @click.stop="viewOrder(row)">详情</n-button>
                    <n-button size="small" type="primary" @click.stop="handleApprove(row)" v-if="row.status === 'pending'">审批</n-button>
                  </n-space>
                </template>
              </vxe-column>
            </vxe-table>
          </div>
        </n-card>
      </n-gi>
      
      <!-- 右侧：统计 -->
      <n-gi :span="7">
        <n-card title="订单统计" class="stat-card">
          <n-space vertical :size="12">
            <div class="stat-item">
              <div class="stat-label">全部订单</div>
              <div class="stat-value">{{ orders.length }}</div>
            </div>
            <n-divider />
            <div class="stat-row">
              <div class="stat-cell">
                <div class="stat-num">{{ pendingCount }}</div>
                <div class="stat-label">待审批</div>
              </div>
              <div class="stat-cell">
                <div class="stat-num approved">{{ approvedCount }}</div>
                <div class="stat-label">已通过</div>
              </div>
            </div>
            <div class="stat-row">
              <div class="stat-cell">
                <div class="stat-num rejected">{{ rejectedCount }}</div>
                <div class="stat-label">已拒绝</div>
              </div>
              <div class="stat-cell">
                <div class="stat-num total">{{ totalAmount }}</div>
                <div class="stat-label">总金额</div>
              </div>
            </div>
          </n-space>
        </n-card>
        
        <n-card title="快捷操作" class="action-card" style="margin-top: 16px;">
          <n-space vertical :size="12">
            <n-button block type="primary" @click="showCreateModal = true">
              <template #icon><n-icon><Plus /></n-icon></template>
              新建订单
            </n-button>
            <n-button block @click="loadOrders">
              <template #icon><n-icon><RefreshCw /></n-icon></template>
              刷新列表
            </n-button>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
    
    <!-- 新建订单弹窗 -->
    <n-modal v-model:show="showCreateModal" preset="card" title="新建销售订单" :style="{ width: '600px' }" :mask-closable="false">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
        <n-form-item label="订单号" path="orderNo">
          <n-input v-model:value="formData.orderNo" placeholder="系统自动生成" disabled />
        </n-form-item>
        
        <n-form-item label="客户名称" path="customerName">
          <n-input v-model:value="formData.customerName" placeholder="请输入客户名称" />
        </n-form-item>
        
        <n-form-item label="订单金额" path="amount">
          <n-input-number v-model:value="formData.amount" :min="0" :precision="2" placeholder="请输入金额" style="width: 100%" />
        </n-form-item>
        
        <n-form-item label="订单日期">
          <n-date-picker v-model:value="formData.orderDate" type="date" style="width: 100%" />
        </n-form-item>
        
        <n-form-item label="备注">
          <n-input v-model:value="formData.remark" type="textarea" placeholder="请输入备注（选填）" :rows="3" />
        </n-form-item>
      </n-form>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="handleSubmit" :loading="submitting">提交</n-button>
        </n-space>
      </template>
    </n-modal>
    
    <!-- 订单详情弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" :title="'订单详情 - ' + (currentOrder?.orderNo || '')" :style="{ width: '700px' }">
      <n-descriptions label-placement="left" :column="2" size="small" bordered v-if="currentOrder">
        <n-descriptions-item label="订单号">{{ currentOrder.orderNo }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="getStatusType(currentOrder.status)" size="small">{{ getStatusText(currentOrder.status) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="客户名称">{{ currentOrder.customerName }}</n-descriptions-item>
        <n-descriptions-item label="订单金额">
          <span class="amount">¥{{ formatAmount(currentOrder.amount) }}</span>
        </n-descriptions-item>
        <n-descriptions-item label="订单日期">{{ formatDate(currentOrder.orderDate) }}</n-descriptions-item>
        <n-descriptions-item label="创建人">{{ currentOrder.creator }}</n-descriptions-item>
        <n-descriptions-item label="创建时间">{{ formatTime(currentOrder.createTime) }}</n-descriptions-item>
        <n-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</n-descriptions-item>
      </n-descriptions>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
          <n-button type="primary" @click="handleApprove(currentOrder)" v-if="currentOrder?.status === 'pending'">审批</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NGrid, NGi, NSpace, NButton, NIcon, NInput, NSelect, NTag, NModal, NForm, NFormItem, NInputNumber, NDatePicker, NDivider, NEmpty, useMessage } from 'naive-ui'
import { RefreshCw, Plus } from 'lucide-vue-next'
import type { User, WorkflowResponse } from '../types'

interface SalesOrder {
  id?: string
  orderNo: string
  customerName: string
  amount: number
  orderDate?: string
  status: string
  creator?: string
  remark?: string
  createTime?: string
}

const props = defineProps<{
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: User
}>()

const emit = defineEmits<{
  (e: 'error', error: { code: string, message: string }): void
}>()

const message = useMessage()

const TABLE_NAME = 't_SdOrder'

const loading = ref(false)
const submitting = ref(false)
const orders = ref<SalesOrder[]>([])
const searchText = ref('')
const statusFilter = ref<string | null>(null)
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const currentOrder = ref<SalesOrder | null>(null)
const formRef = ref()

const formData = ref({
  orderNo: '',
  customerName: '',
  amount: 0,
  orderDate: Date.now(),
  remark: ''
})

const rules = {
  customerName: { required: true, message: '请输入客户名称', trigger: 'blur' },
  amount: { required: true, type: 'number', message: '请输入订单金额', trigger: 'blur' }
}

const statusOptions = [
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

const filteredOrders = computed(() => {
  let result = orders.value
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(o => 
      (o.orderNo?.toLowerCase().includes(keyword)) ||
      (o.customerName?.toLowerCase().includes(keyword))
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(o => o.status === statusFilter.value)
  }
  
  return result
})

const pendingCount = computed(() => orders.value.filter(o => o.status === 'pending').length)
const approvedCount = computed(() => orders.value.filter(o => o.status === 'approved').length)
const rejectedCount = computed(() => orders.value.filter(o => o.status === 'rejected').length)
const totalAmount = computed(() => {
  const sum = orders.value.reduce((acc, o) => acc + (o.amount || 0), 0)
  return '¥' + formatAmount(sum)
})

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  loading.value = true
  try {
    const res = await props.apiRequest('queryOrders', { tableName: TABLE_NAME })
    if (res.success) {
      orders.value = (res.data || []).map(transformFromDb)
    } else {
      orders.value = []
    }
  } catch (e: any) {
    emit('error', { code: 'LOAD_ERROR', message: e.message })
  } finally {
    loading.value = false
  }
}

function transformFromDb(row: any): SalesOrder {
  return {
    id: row.ID_,
    orderNo: row.OrderNo_,
    customerName: row.CustomerName_,
    amount: row.Amount_ ? parseFloat(row.Amount_) : 0,
    orderDate: row.OrderDate_,
    status: row.Status_ || 'pending',
    creator: row.Creator_,
    remark: row.Remark_,
    createTime: row.CreateTime_
  }
}

function transformToDb(data: any): Record<string, any> {
  const result: Record<string, any> = {}
  if (data.customerName) result.CustomerName_ = data.customerName
  if (data.amount != null) result.Amount_ = data.amount
  if (data.orderDate) result.OrderDate_ = data.orderDate
  if (data.remark) result.Remark_ = data.remark
  if (data.status) result.Status_ = data.status
  if (data.creator) result.Creator_ = data.creator
  return result
}

function viewOrder(order: SalesOrder) {
  currentOrder.value = order
  showDetailModal.value = true
}

function handleApprove(order: SalesOrder | null) {
  if (!order) return
  currentOrder.value = order
  showDetailModal.value = false
  
  dialog.confirm({
    title: '审批订单',
    content: `确定要通过订单「${order.orderNo}」吗？`,
    positiveText: '通过',
    negativeText: '拒绝',
    onPositiveClick: () => approveOrder(order, 'approved'),
    onNegativeClick: () => approveOrder(order, 'rejected')
  })
}

async function approveOrder(order: SalesOrder, status: string) {
  try {
    const res = await props.apiRequest('approveOrder', {
      id: order.id,
      tableName: TABLE_NAME,
      status,
      approver: props.currentUser.name
    })
    if (res.success) {
      message.success(status === 'approved' ? '已通过' : '已拒绝')
      loadOrders()
    } else {
      message.error(res.message || '操作失败')
    }
  } catch (e: any) {
    message.error(e.message || '操作失败')
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  
  submitting.value = true
  try {
    const orderData = {
      customerName: formData.value.customerName,
      amount: formData.value.amount,
      orderDate: formData.value.orderDate ? new Date(formData.value.orderDate).toISOString() : null,
      remark: formData.value.remark,
      status: 'pending',
      creator: props.currentUser.name
    }
    
    const res = await props.apiRequest('createOrder', {
      tableName: TABLE_NAME,
      data: transformToDb(orderData)
    })
    
    if (res.success) {
      message.success('提交成功')
      showCreateModal.value = false
      loadOrders()
      resetForm()
    } else {
      message.error(res.message || '提交失败')
    }
  } catch (e: any) {
    message.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  formData.value = {
    orderNo: '',
    customerName: '',
    amount: 0,
    orderDate: Date.now(),
    remark: ''
  }
}

function formatAmount(amount?: number): string {
  if (amount == null) return '0.00'
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(date?: string): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function getStatusType(status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return map[status || ''] || 'default'
}

function getStatusText(status?: string): string {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status || ''] || status
}
</script>

<script lang="ts">
import { useDialog } from 'naive-ui'
const dialog = useDialog()
export default { name: 'SalesOrder' }
</script>

<style scoped>
.sales-order {
  padding: 24px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.order-grid {
  flex: 1;
  overflow: hidden;
}

.list-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-card :deep(.n-card__content) {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex: 1;
  min-height: 300px;
  margin-top: 16px;
}

.vxe-table {
  font-size: 14px;
}

.order-no {
  font-family: monospace;
  color: #2080f0;
}

.amount {
  font-weight: 600;
  color: #d03050;
}

.stat-card :deep(.n-card__content) {
  text-align: center;
}

.stat-item {
  text-align: center;
  padding: 8px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #2080f0;
}

.stat-row {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
}

.stat-cell {
  text-align: center;
}

.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #f0a020;
}

.stat-num.approved {
  color: #18a058;
}

.stat-num.rejected {
  color: #d03050;
}

.stat-num.total {
  color: #2080f0;
  font-size: 20px;
}

.action-card :deep(.n-card__content) {
  padding: 16px;
}
</style>
