<template>
  <div class="pending-tasks">
    <n-grid :cols="24" :x-gap="16" class="tasks-grid">
      <!-- 左侧：待办列表 -->
      <n-gi :span="17">
        <n-card title="我的待办" class="task-card">
          <template #header-extra>
            <n-space>
              <n-input v-model:value="searchText" placeholder="搜索任务..." clearable style="width: 160px" />
              <n-button size="small" @click="loadTasks">
                <template #icon><n-icon><RefreshCw /></n-icon></template>
                刷新
              </n-button>
            </n-space>
          </template>
          
          <n-space vertical :size="12">
            <n-empty v-if="!loading && filteredTasks.length === 0" description="暂无待办任务" />
            
            <div v-else v-for="task in filteredTasks" :key="task.ID_" class="task-item" @click="openApprove(task)">
              <div class="task-info">
                <div class="task-header">
                  <span class="task-title">{{ task.NAME_ || task.TASK_DEF_KEY_ }}</span>
                  <n-tag :type="getPriorityType(task.PRIORITY_)" size="small">
                    {{ getPriorityText(task.PRIORITY_) }}
                  </n-tag>
                </div>
                <div class="task-desc">{{ task.DESCRIPTION_ || '审批任务' }}</div>
                <div class="task-footer">
                  <span class="task-flow">
                    <n-icon size="14"><GitBranch /></n-icon>
                    {{ task.PROC_DEF_KEY_ || '流程' }}
                  </span>
                  <span class="task-time">
                    <n-icon size="14"><Clock /></n-icon>
                    {{ formatTime(task.START_TIME_) }}
                  </span>
                </div>
              </div>
              <div class="task-actions">
                <n-button type="primary" size="small" @click.stop="openApprove(task)">审批</n-button>
              </div>
            </div>
          </n-space>
        </n-card>
      </n-gi>
      
      <!-- 右侧：统计和操作 -->
      <n-gi :span="7">
        <n-card title="任务统计" class="stat-card">
          <n-space vertical :size="12">
            <div class="stat-item">
              <div class="stat-label">待处理任务</div>
              <div class="stat-value">{{ tasks.length }}</div>
            </div>
            <n-divider />
            <div class="stat-item">
              <div class="stat-label">紧急任务</div>
              <div class="stat-value urgent">{{ urgentCount }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">今日到期</div>
              <div class="stat-value warning">{{ todayCount }}</div>
            </div>
          </n-space>
        </n-card>
        
        <n-card title="快捷操作" class="action-card" style="margin-top: 16px;">
          <n-space vertical :size="12">
            <n-button block @click="loadTasks">
              <template #icon><n-icon><RefreshCw /></n-icon></template>
              刷新列表
            </n-button>
            <n-button block @click="navigateToMyApply">
              <template #icon><n-icon><List /></n-icon></template>
              我的申请
            </n-button>
            <n-button block type="info" @click="showHistory">
              <template #icon><n-icon><History /></n-icon></template>
              审批历史
            </n-button>
          </n-space>
        </n-card>
        
        <n-card title="任务筛选" class="filter-card" style="margin-top: 16px;">
          <n-space vertical :size="8">
            <n-checkbox-group v-model:value="filterPriorities">
              <n-space vertical>
                <n-checkbox value="1" label="紧急" />
                <n-checkbox value="2" label="重要" />
                <n-checkbox value="3" label="普通" />
              </n-space>
            </n-checkbox-group>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
    
    <!-- 审批弹窗 -->
    <n-modal v-model:show="showApproveModal" preset="card" title="审批任务" :style="{ width: '550px' }" :mask-closable="false">
      <n-space vertical :size="16">
        <n-descriptions label-placement="left" :column="2" size="small" bordered>
          <n-descriptions-item label="任务名称">{{ currentTask?.NAME_ }}</n-descriptions-item>
          <n-descriptions-item label="优先级">
            <n-tag :type="getPriorityType(currentTask?.PRIORITY_)" size="small">
              {{ getPriorityText(currentTask?.PRIORITY_) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="流程实例ID">{{ currentTask?.PROC_INST_ID_ }}</n-descriptions-item>
          <n-descriptions-item label="流程定义">{{ currentTask?.PROC_DEF_KEY_ }}</n-descriptions-item>
          <n-descriptions-item label="开始时间">{{ formatTime(currentTask?.START_TIME_) }}</n-descriptions-item>
          <n-descriptions-item label="任务Key">{{ currentTask?.TASK_DEF_KEY_ }}</n-descriptions-item>
        </n-descriptions>
        
        <n-form-item label="审批意见" required>
          <n-input v-model:value="approveComment" type="textarea" placeholder="请输入审批意见（选填）" :rows="3" />
        </n-form-item>
        
        <n-form-item label="快捷意见">
          <n-space>
            <n-tag v-for="comment in quickComments" :key="comment" @click="setQuickComment(comment)" style="cursor: pointer;">
              {{ comment }}
            </n-tag>
          </n-space>
        </n-form-item>
      </n-space>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showApproveModal = false">取消</n-button>
          <n-button type="error" @click="handleReject" :loading="submitting">拒绝</n-button>
          <n-button type="primary" @click="handleApprove" :loading="submitting">通过</n-button>
        </n-space>
      </template>
    </n-modal>
    
    <!-- 审批历史弹窗 -->
    <n-modal v-model:show="showHistoryModal" preset="card" title="审批历史" :style="{ width: '700px' }">
      <n-tabs type="line" animated>
        <n-tab-pane name="pending" tab="我审批的">
          <n-space vertical v-if="approvalHistory.length">
            <div v-for="h in approvalHistory" :key="h.ID_" class="history-item">
              <div class="history-header">
                <n-tag :type="getActionType(h.ACTION_)" size="small">{{ getActionText(h.ACTION_) }}</n-tag>
                <span class="history-task">{{ h.TASK_NAME_ }}</span>
              </div>
              <div class="history-comment" v-if="h.COMMENT_">{{ h.COMMENT_ }}</div>
              <div class="history-time">{{ formatTime(h.CREATE_TIME_) }}</div>
            </div>
          </n-space>
          <n-empty v-else description="暂无审批历史" />
        </n-tab-pane>
        <n-tab-pane name="my" tab="我的申请">
          <n-empty description='查看我的申请请到"我的申请"页面' />
        </n-tab-pane>
      </n-tabs>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NGrid, NGi, NSpace, NEmpty, NButton, NIcon, NTag, NModal, NDescriptions, NDescriptionsItem, NFormItem, NInput, NInputGroup, NCheckbox, NCheckboxGroup, NDivider, NTabs, NTabPane, useMessage } from 'naive-ui'
import { RefreshCw, Clock, GitBranch, List, History, FileText, ArrowRight } from 'lucide-vue-next'
import type { User, WorkflowResponse, Task, ApprovalHistory } from '../types'

const props = defineProps<{
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: User
}>()

const emit = defineEmits<{
  (e: 'complete', data: any): void
  (e: 'error', error: { code: string, message: string }): void
  (e: 'navigate', page: string): void
}>()

const message = useMessage()

const loading = ref(false)
const submitting = ref(false)
const tasks = ref<Task[]>([])
const showApproveModal = ref(false)
const showHistoryModal = ref(false)
const currentTask = ref<Task | null>(null)
const approveComment = ref('')
const searchText = ref('')
const filterPriorities = ref<string[]>([])
const approvalHistory = ref<ApprovalHistory[]>([])

const quickComments = ['同意', '不同意', '请补充材料', '已阅']

const filteredTasks = computed(() => {
  let result = tasks.value
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(t => 
      (t.NAME_?.toLowerCase().includes(keyword)) ||
      (t.DESCRIPTION_?.toLowerCase().includes(keyword)) ||
      (t.PROC_DEF_KEY_?.toLowerCase().includes(keyword))
    )
  }
  
  if (filterPriorities.value.length > 0) {
    result = result.filter(t => filterPriorities.value.includes(String(t.PRIORITY_ || 3)))
  }
  
  return result
})

const urgentCount = computed(() => tasks.value.filter(t => t.PRIORITY_ === 1).length)
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return tasks.value.filter(t => t.START_TIME_?.split('T')[0] === today.split('T')[0]).length
})

onMounted(() => {
  loadTasks()
})

async function loadTasks() {
  if (!props.currentUser) {
    emit('error', { code: 'NO_USER', message: '请先登录' })
    return
  }
  
  loading.value = true
  try {
    const res = await props.apiRequest('getUserTasks', { 
      userId: props.currentUser.id,
      roleName: props.currentUser.roleName
    })
    if (res.success) {
      tasks.value = res.data || []
    } else {
      message.error(res.message || '加载失败')
      emit('error', { code: 'LOAD_ERROR', message: res.message || '加载失败' })
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
    emit('error', { code: 'LOAD_ERROR', message: e.message })
  } finally {
    loading.value = false
  }
}

function openApprove(task: Task) {
  currentTask.value = task
  approveComment.value = ''
  showApproveModal.value = true
}

function setQuickComment(comment: string) {
  approveComment.value = comment
}

async function handleApprove() {
  if (!currentTask.value || !props.currentUser) return
  
  submitting.value = true
  try {
    const res = await props.apiRequest('approve', {
      taskId: currentTask.value.ID_,
      userId: props.currentUser.id,
      comment: approveComment.value
    })
    if (res.success) {
      message.success('审批通过')
      emit('complete', { taskId: currentTask.value.ID_, result: 'approved' })
      showApproveModal.value = false
      loadTasks()
    } else {
      message.error(res.message || '操作失败')
      emit('error', { code: 'APPROVE_ERROR', message: res.message || '操作失败' })
    }
  } catch (e: any) {
    message.error(e.message || '操作失败')
    emit('error', { code: 'APPROVE_ERROR', message: e.message })
  } finally {
    submitting.value = false
  }
}

async function handleReject() {
  if (!currentTask.value || !props.currentUser) return
  
  submitting.value = true
  try {
    const res = await props.apiRequest('reject', {
      taskId: currentTask.value.ID_,
      userId: props.currentUser.id,
      comment: approveComment.value
    })
    if (res.success) {
      message.success('已拒绝')
      emit('complete', { taskId: currentTask.value.ID_, result: 'rejected' })
      showApproveModal.value = false
      loadTasks()
    } else {
      message.error(res.message || '操作失败')
      emit('error', { code: 'REJECT_ERROR', message: res.message || '操作失败' })
    }
  } catch (e: any) {
    message.error(e.message || '操作失败')
    emit('error', { code: 'REJECT_ERROR', message: e.message })
  } finally {
    submitting.value = false
  }
}

function navigateToMyApply() {
  emit('navigate', 'myApply')
}

async function showHistory() {
  showHistoryModal.value = true
  try {
    const res = await props.apiRequest('listApprovalHistory', {})
    if (res.success) {
      approvalHistory.value = res.data || []
    }
  } catch (e: any) {
    console.error('加载历史失败:', e)
  }
}

function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function getPriorityType(priority?: number): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (priority === 1) return 'error'
  if (priority === 2) return 'warning'
  return 'default'
}

function getPriorityText(priority?: number): string {
  if (priority === 1) return '紧急'
  if (priority === 2) return '重要'
  return '普通'
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
.pending-tasks {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.tasks-grid {
  height: 100%;
}

.task-card {
  height: 100%;
}

.task-card :deep(.n-card__content) {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
  border: 1px solid transparent;
}

.task-item:hover {
  background: #f0f5ff;
  border-color: #2080f0;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.task-title {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.task-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.task-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.task-flow, .task-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
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
  font-size: 28px;
  font-weight: bold;
  color: #2080f0;
}

.stat-value.urgent {
  color: #d03050;
}

.stat-value.warning {
  color: #f0a020;
}

.action-card :deep(.n-card__content) {
  padding: 16px;
}

.filter-card :deep(.n-card__content) {
  padding: 16px;
}

.history-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.history-task {
  font-weight: 500;
  color: #333;
}

.history-comment {
  font-size: 13px;
  color: #666;
  padding: 6px 0;
}

.history-time {
  font-size: 12px;
  color: #999;
}
</style>
