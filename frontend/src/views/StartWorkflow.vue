<template>
  <div class="approval-manager">
    <n-grid :cols="24" :x-gap="16" class="manager-grid">
      <!-- 左侧：审批列表 -->
      <n-gi :span="17">
        <n-card title="审批列表" class="list-card">
          <template #header-extra>
            <n-space>
              <n-select v-model:value="statusFilter" placeholder="状态" :options="statusOptions" style="width: 120px" clearable />
              <n-button @click="loadApprovals">
                <template #icon><n-icon><RefreshCw /></n-icon></template>
              </n-button>
            </n-space>
          </template>
          
          <n-space vertical :size="12">
            <n-empty v-if="!loading && approvals.length === 0" description="暂无审批记录" />
            
            <div v-else v-for="item in approvals" :key="item.ID_" class="approval-item" @click="viewDetail(item)">
              <div class="approval-info">
                <div class="approval-title">
                  <span>{{ item.TITLE_ || item.BUSINESS_TYPE_ }}</span>
                  <n-tag :type="getStatusType(item.STATUS_)" size="small">{{ getStatusText(item.STATUS_) }}</n-tag>
                </div>
                <div class="approval-desc">
                  <span>申请人：{{ item.APPLICANT_NAME_ || item.APPLICANT_ }}</span>
                  <span class="divider">|</span>
                  <span>业务Key：{{ item.BUSINESS_KEY_ || item.BUSINESS_TYPE_ }}</span>
                </div>
              </div>
              <div class="approval-time">
                {{ formatTime(item.CREATE_TIME_) }}
              </div>
            </div>
          </n-space>
        </n-card>
      </n-gi>
      
      <!-- 右侧：快捷操作 -->
      <n-gi :span="7">
        <n-card title="快捷操作" class="action-card">
          <n-space vertical :size="16">
            <n-button type="primary" block size="large" @click="showStartModal = true">
              <template #icon><n-icon><Plus /></n-icon></template>
              发起审批
            </n-button>
            
            <n-divider>我的统计</n-divider>
            
            <div class="stat-item">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待审批</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value">{{ stats.approved }}</div>
              <div class="stat-label">已审批</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value">{{ stats.myApply }}</div>
              <div class="stat-label">我的申请</div>
            </div>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
    
    <!-- 发起审批弹窗 -->
    <n-modal v-model:show="showStartModal" preset="card" title="发起审批" :style="{ width: '500px' }" :mask-closable="false">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80px">
        <n-form-item label="流程" path="bpmnKey">
          <n-select v-model:value="formData.bpmnKey" :options="flowOptions" placeholder="请选择流程" />
        </n-form-item>
        
        <n-form-item label="业务Key" path="businessKey">
          <n-input v-model:value="formData.businessKey" placeholder="请输入业务Key" />
        </n-form-item>
        
        <n-form-item label="名称" path="processName">
          <n-input v-model:value="formData.processName" placeholder="请输入流程名称" />
        </n-form-item>
        
        <n-form-item label="原因" path="reason">
          <n-input v-model:value="formData.reason" type="textarea" placeholder="请输入申请原因" :rows="2" />
        </n-form-item>
        
        <n-form-item label="金额" path="amount" v-if="showAmount">
          <n-input-number v-model:value="formData.amount" :min="0" :precision="2" placeholder="请输入金额" style="width: 100%" />
        </n-form-item>
      </n-form>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showStartModal = false">取消</n-button>
          <n-button type="primary" @click="handleSubmit" :loading="submitting">提交</n-button>
        </n-space>
      </template>
    </n-modal>
    
    <!-- 详情弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" title="审批详情" :style="{ width: '700px' }">
      <n-tabs type="line" v-if="currentApproval">
        <n-tab-pane name="info" tab="基本信息">
          <n-descriptions label-placement="left" :column="2" size="small">
            <n-descriptions-item label="流程名称">{{ currentApproval.TITLE_ }}</n-descriptions-item>
            <n-descriptions-item label="状态">
              <n-tag :type="getStatusType(currentApproval.STATUS_)" size="small">{{ getStatusText(currentApproval.STATUS_) }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="业务Key">{{ currentApproval.BUSINESS_KEY_ }}</n-descriptions-item>
            <n-descriptions-item label="申请人">{{ currentApproval.APPLICANT_NAME_ || currentApproval.APPLICANT_ }}</n-descriptions-item>
            <n-descriptions-item label="开始时间">{{ formatTime(currentApproval.CREATE_TIME_) }}</n-descriptions-item>
            <n-descriptions-item label="结束时间">{{ formatTime(currentApproval.UPDATE_TIME_) }}</n-descriptions-item>
          </n-descriptions>
        </n-tab-pane>
        
        <n-tab-pane name="history" tab="审批历史">
          <n-space vertical v-if="history.length">
            <div v-for="h in history" :key="h.ID_" class="history-item">
              <n-tag :type="getActionType(h.ACTION_)" size="small">{{ getActionText(h.ACTION_) }}</n-tag>
              <span class="history-user">{{ h.ASSIGNEE_ || h.ASSIGNEE_NAME_ }}</span>
              <span class="history-time">{{ formatTime(h.CREATE_TIME_) }}</span>
              <div v-if="h.COMMENT_" class="history-comment">意见：{{ h.COMMENT_ }}</div>
            </div>
          </n-space>
          <n-empty v-else description="暂无审批历史" />
        </n-tab-pane>
      </n-tabs>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NGrid, NGi, NSpace, NButton, NIcon, NSelect, NEmpty, NTag, NModal, NForm, NFormItem, NInput, NInputNumber, NDivider, useMessage } from 'naive-ui'
import { RefreshCw, Plus } from 'lucide-vue-next'
import { workflowApi, getCurrentUser, WfProcess, WfTaskHistory, getStatusText } from '@/services/workflow'

const message = useMessage()

const loading = ref(false)
const approvals = ref<WfProcess[]>([])
const statusFilter = ref<string | null>(null)
const showStartModal = ref(false)
const showDetailModal = ref(false)
const currentApproval = ref<WfProcess | null>(null)
const history = ref<WfTaskHistory[]>([])
const formRef = ref()
const submitting = ref(false)
const flowOptions = ref<{label: string, value: string}[]>([])

const formData = ref({
  bpmnKey: 'flow',
  businessKey: '',
  processName: '',
  reason: '',
  amount: 5000
})

const rules = {
  bpmnKey: { required: true, message: '请选择流程', trigger: 'change' },
  businessKey: { required: true, message: '请输入业务Key', trigger: 'blur' },
  processName: { required: true, message: '请输入流程名称', trigger: 'blur' }
}

const statusOptions = [
  { label: '新单', value: 'I' },
  { label: '审核中', value: 'A' },
  { label: '已完成', value: 'F' },
  { label: '已拒绝', value: 'N' }
]

const showAmount = computed(() => formData.value.bpmnKey === 'flow')

const stats = computed(() => ({
  pending: approvals.value.filter(a => a.STATUS_ === 'I' || a.STATUS_ === 'A').length,
  approved: approvals.value.filter(a => a.STATUS_ === 'F').length,
  myApply: approvals.value.length
}))

onMounted(() => {
  loadApprovals()
  loadFlowOptions()
})

async function loadApprovals() {
  loading.value = true
  try {
    const user = getCurrentUser()
    const res = await workflowApi.listMyApplications(user?.User_Id || '')
    if (res.success) {
      approvals.value = (res.data || []).filter((a: WfProcess) => {
        if (!statusFilter.value) return true
        return a.STATUS_ === statusFilter.value
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
}

async function loadFlowOptions() {
  try {
    const res = await workflowApi.listBpmn()
    if (res.success && res.data) {
      flowOptions.value = res.data.map((b: any) => ({
        label: b.name || b.id,
        value: b.id || b.bpmnKey
      }))
    }
    formData.value.businessKey = `biz_${Date.now()}`
  } catch (e) {
    console.error('加载流程列表失败:', e)
  }
}

function viewDetail(item: WfProcess) {
  currentApproval.value = item
  showDetailModal.value = true
  loadHistory(item)
}

async function loadHistory(item: WfProcess) {
  try {
    const res = await workflowApi.getProcessHistory(item.ID_ || item.id)
    if (res.success) {
      history.value = res.data || []
    }
  } catch (e) {
    console.error('加载历史失败:', e)
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch (e) {
    return
  }
  
  const user = getCurrentUser()
  if (!user) {
    message.warning('请先登录')
    return
  }
  
  submitting.value = true
  try {
    const res = await workflowApi.startWorkflow({
      bpmnKey: formData.value.bpmnKey,
      starterId: user.User_Id,
      businessKey: formData.value.businessKey,
      processName: formData.value.processName || '审批流程',
      variables: {
        amount: formData.value.amount,
        reason: formData.value.reason,
        applicant: user.UserName,
        _starterName: user.UserTrueName || user.UserName
      }
    })
    
    if (res.success) {
      message.success('提交成功')
      showStartModal.value = false
      loadApprovals()
      handleReset()
    } else {
      message.error(res.message || '提交失败')
    }
  } catch (e: any) {
    message.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formData.value = {
    bpmnKey: 'flow',
    businessKey: `biz_${Date.now()}`,
    processName: '',
    reason: '',
    amount: 5000
  }
}

function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function getStatusType(status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    F: 'success', C: 'default', N: 'error', I: 'info', A: 'warning', D: 'warning'
  }
  return map[status || ''] || 'default'
}

function getActionType(action?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    approve: 'success', reject: 'error', start: 'info'
  }
  return map[action || ''] || 'default'
}

function getActionText(action?: string): string {
  const map: Record<string, string> = { approve: '通过', reject: '拒绝', start: '发起' }
  return map[action || ''] || action
}
</script>

<style scoped>
.approval-manager {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.manager-grid {
  height: 100%;
}

.list-card {
  height: 100%;
}

.list-card :deep(.n-card__content) {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.approval-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.approval-item:hover {
  background: #f0f5ff;
}

.approval-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-bottom: 6px;
}

.approval-desc {
  font-size: 13px;
  color: #666;
}

.divider {
  margin: 0 8px;
  color: #ddd;
}

.approval-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.action-card {
  position: sticky;
  top: 0;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #2080f0;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.history-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.history-user {
  font-weight: 500;
  color: #2080f0;
  margin-left: 8px;
}

.history-time {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.history-comment {
  font-size: 13px;
  color: #666;
  margin-top: 6px;
}
</style>
