<template>
  <div class="dashboard">
    <!-- 顶部欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1>欢迎回来，{{ userName }}</h1>
        <p>您有 <span class="highlight">{{ pendingCount }}</span> 条待审批任务</p>
      </div>
      <div class="quick-actions">
        <n-button type="primary" @click="$router.push('/designer')">
          <template #icon>
            <n-icon><Plus /></n-icon>
          </template>
          发起审批
        </n-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <n-grid :cols="4" :x-gap="20" :y-gap="20" class="stats-grid">
      <n-gi>
        <n-card class="stat-card pending" @click="goToTab('pending')">
          <div class="stat-icon">
            <n-icon size="32"><Clock /></n-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-label">待审批</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card approved" @click="goToTab('approved')">
          <div class="stat-icon">
            <n-icon size="32"><CheckCircle /></n-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ approvedCount }}</div>
            <div class="stat-label">已审批</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card myApply" @click="goToTab('myApply')">
          <div class="stat-icon">
            <n-icon size="32"><FileText /></n-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ myApplyCount }}</div>
            <div class="stat-label">我的申请</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card completed" @click="goToTab('completed')">
          <div class="stat-icon">
            <n-icon size="32"><Archive /></n-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ completedCount }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 内容区域 -->
    <n-grid :cols="2" :x-gap="20" :y-gap="20" class="content-grid">
      <!-- 待办任务 -->
      <n-gi>
        <n-card title="待办任务" class="task-card">
          <template #header-extra>
            <n-button text @click="loadPendingTasks" size="small">
              <template #icon><n-icon><RefreshCw /></n-icon></template>
            </n-button>
          </template>
          <n-space vertical :size="12">
            <n-empty v-if="pendingTasks.length === 0" description="暂无待办任务" />
            <div v-else v-for="task in pendingTasks" :key="task.ID_" class="task-item" @click="openApprove(task)">
              <div class="task-info">
                <div class="task-title">{{ task.NAME_ || task.TASK_DEF_KEY_ }}</div>
                <div class="task-desc">{{ task.DESCRIPTION_ || '审批任务' }}</div>
              </div>
              <div class="task-meta">
                <n-tag :type="getPriorityType(task.PRIORITY_)" size="small">{{ task.PRIORITY_ || '普通' }}</n-tag>
                <span class="task-time">{{ formatTime(task.START_TIME_) }}</span>
              </div>
            </div>
            <n-button v-if="pendingTasks.length > 0" text type="primary" block @click="goToTab('pending')">
              查看全部 {{ pendingCount }} 条
            </n-button>
          </n-space>
        </n-card>
      </n-gi>

      <!-- 我的申请 -->
      <n-gi>
        <n-card title="我的申请" class="task-card">
          <template #header-extra>
            <n-button text @click="loadMyApplications" size="small">
              <template #icon><n-icon><RefreshCw /></n-icon></template>
            </n-button>
          </template>
          <n-space vertical :size="12">
            <n-empty v-if="myApplications.length === 0" description="暂无申请记录" />
            <div v-else v-for="app in myApplications" :key="app.ID_" class="task-item" @click="viewDetail(app)">
              <div class="task-info">
                <div class="task-title">{{ app.TITLE_ || app.BUSINESS_TYPE_ }}</div>
                <div class="task-desc">{{ formatFormData(app.FORM_DATA_) }}</div>
              </div>
              <div class="task-meta">
                <n-tag :type="getStatusType(app.STATUS_)" size="small">{{ getStatusText(app.STATUS_) }}</n-tag>
                <span class="task-time">{{ formatTime(app.CREATE_TIME_) }}</span>
              </div>
            </div>
            <n-button v-if="myApplications.length > 0" text type="primary" block @click="goToTab('myApply')">
              查看全部 {{ myApplyCount }} 条
            </n-button>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 最近动态 -->
    <n-card title="审批动态" class="activity-card">
      <n-timeline>
        <n-timeline-item v-for="item in activities" :key="item.ID_" :type="getActivityType(item.ACTION_)" :title="getActivityTitle(item)" :time="formatTime(item.CREATE_TIME_)">
          <div class="activity-content">
            <span class="activity-user">{{ item.ASSIGNEE_ || item.TASK_NAME_ }}</span>
            <span class="activity-action">{{ getActionText(item.ACTION_) }}</span>
            <span class="activity-task">{{ item.TASK_NAME_ }}</span>
            <div v-if="item.COMMENT_" class="activity-comment">意见：{{ item.COMMENT_ }}</div>
          </div>
        </n-timeline-item>
        <n-empty v-if="activities.length === 0" description="暂无审批动态" />
      </n-timeline>
    </n-card>

    <!-- 审批弹窗 -->
    <n-modal v-model:show="showApproveModal" preset="card" title="审批任务" :style="{ width: '500px' }" :mask-closable="false">
      <n-space vertical :size="12">
        <n-descriptions label-placement="left" :column="1" size="small">
          <n-descriptions-item label="任务名称">{{ currentTask?.NAME_ }}</n-descriptions-item>
          <n-descriptions-item label="流程实例">{{ currentTask?.PROC_INST_ID_ }}</n-descriptions-item>
          <n-descriptions-item label="开始时间">{{ formatTime(currentTask?.START_TIME_) }}</n-descriptions-item>
        </n-descriptions>
        <n-form-item label="审批意见">
          <n-input v-model:value="approveComment" type="textarea" placeholder="请输入审批意见" :rows="3" />
        </n-form-item>
      </n-space>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showApproveModal = false">取消</n-button>
          <n-button type="error" @click="handleReject">拒绝</n-button>
          <n-button type="primary" @click="handleApprove">通过</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  NButton, NCard, NGrid, NGi, NSpace, NIcon, NTag, NEmpty, NTimeline, NTimelineItem, 
  NModal, NDescriptions, NDescriptionsItem, NFormItem, NInput, useMessage 
} from 'naive-ui'
import { Plus, Clock, CheckCircle, FileText, Archive, RefreshCw } from 'lucide-vue-next'
import { workflowApi, getStatusText, getCurrentUser, WfTask, WfProcess, WfTaskHistory } from '@/services/workflow'

const message = useMessage()

const userName = ref('用户')
const pendingTasks = ref<WfTask[]>([])
const myApplications = ref<WfProcess[]>([])
const activities = ref<WfTaskHistory[]>([])
const showApproveModal = ref(false)
const currentTask = ref<WfTask | null>(null)
const approveComment = ref('')

const pendingCount = computed(() => pendingTasks.value.length)
const approvedCount = computed(() => activities.value.filter(a => a.ACTION_ === 'approve').length)
const myApplyCount = computed(() => myApplications.value.length)
const completedCount = computed(() => myApplications.value.filter(a => a.STATUS_ === 'F').length)

onMounted(() => {
  const user = getCurrentUser()
  if (user) {
    userName.value = user.UserName || user.User_Id || '用户'
  }
  loadPendingTasks()
  loadMyApplications()
  loadActivities()
})

async function loadPendingTasks() {
  try {
    const user = getCurrentUser()
    if (!user) return
    const res = await workflowApi.getUserTasks(user.User_Id, user.RoleName)
    if (res.success) {
      pendingTasks.value = (res.data || []).slice(0, 5)
    }
  } catch (e) {
    console.error('Load pending tasks failed:', e)
  }
}

async function loadMyApplications() {
  try {
    const user = getCurrentUser()
    if (!user) return
    const res = await workflowApi.listMyApplications(user.User_Id)
    if (res.success) {
      myApplications.value = (res.data || []).slice(0, 5)
    }
  } catch (e) {
    console.error('Load my applications failed:', e)
  }
}

async function loadActivities() {
  try {
    const res = await workflowApi.listApprovalHistory()
    if (res.success) {
      activities.value = (res.data || []).slice(0, 10)
    }
  } catch (e) {
    console.error('Load activities failed:', e)
  }
}

function goToTab(tab: string) {
  // 触发父组件切换标签
  window.dispatchEvent(new CustomEvent('switch-tab', { detail: tab }))
}

function openApprove(task: WfTask) {
  currentTask.value = task
  approveComment.value = ''
  showApproveModal.value = true
}

async function handleApprove() {
  if (!currentTask.value) return
  const user = getCurrentUser()
  if (!user) return
  try {
    const res = await workflowApi.approveTask({
      taskId: currentTask.value.ID_ || currentTask.value.id,
      userId: user.User_Id,
      comment: approveComment.value
    })
    if (res.success) {
      message.success('审批通过')
      showApproveModal.value = false
      loadPendingTasks()
      loadActivities()
    } else {
      message.error(res.message || '操作失败')
    }
  } catch (e: any) {
    message.error(e.message || '操作失败')
  }
}

async function handleReject() {
  if (!currentTask.value) return
  const user = getCurrentUser()
  if (!user) return
  try {
    const res = await workflowApi.rejectTask({
      taskId: currentTask.value.ID_ || currentTask.value.id,
      userId: user.User_Id,
      comment: approveComment.value
    })
    if (res.success) {
      message.success('已拒绝')
      showApproveModal.value = false
      loadPendingTasks()
      loadActivities()
    } else {
      message.error(res.message || '操作失败')
    }
  } catch (e: any) {
    message.error(e.message || '操作失败')
  }
}

function viewDetail(app: WfProcess) {
  window.dispatchEvent(new CustomEvent('view-process', { detail: app }))
}

function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function formatFormData(data?: string): string {
  if (!data) return '-'
  try {
    const obj = JSON.parse(data)
    return obj.reason || obj.title || JSON.stringify(obj).substring(0, 50)
  } catch {
    return data.substring(0, 50)
  }
}

function getPriorityType(priority?: number): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (priority === 1) return 'error'
  if (priority === 2) return 'warning'
  return 'default'
}

function getStatusType(status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    F: 'success', C: 'default', N: 'error', I: 'info', A: 'warning', D: 'warning', G: 'warning'
  }
  return map[status || ''] || 'default'
}

function getActivityType(action?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    approve: 'success', reject: 'error', start: 'info'
  }
  return map[action || ''] || 'default'
}

function getActivityTitle(item: WfTaskHistory): string {
  return item.TASK_NAME_ || '审批任务'
}

function getActionText(action?: string): string {
  const map: Record<string, string> = { approve: '审批通过', reject: '拒绝', start: '发起' }
  return map[action || ''] || action
}
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 32px;
  border-radius: 12px;
  margin-bottom: 24px;
  color: white;
}

.welcome-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.welcome-content p {
  margin: 0;
  opacity: 0.9;
}

.highlight {
  font-size: 24px;
  font-weight: bold;
}

.stats-grid {
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-card.pending { border-left: 4px solid #2080f0; }
.stat-card.approved { border-left: 4px solid #18a058; }
.stat-card.myApply { border-left: 4px solid #f0a020; }
.stat-card.completed { border-left: 4px solid #909399; }

.stat-card :deep(.n-card__content) {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-card.pending .stat-icon { background: #2080f0; }
.stat-card.approved .stat-icon { background: #18a058; }
.stat-card.myApply .stat-icon { background: #f0a020; }
.stat-card.completed .stat-icon { background: #909399; }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

.content-grid {
  margin-bottom: 24px;
}

.task-card :deep(.n-card__content) {
  padding: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: #f0f5ff;
}

.task-info {
  flex: 1;
}

.task-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.task-desc {
  font-size: 12px;
  color: #999;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-time {
  font-size: 12px;
  color: #999;
}

.activity-card :deep(.n-card__content) {
  padding: 16px;
}

.activity-content {
  font-size: 14px;
}

.activity-user {
  font-weight: 500;
  color: #2080f0;
}

.activity-action {
  margin: 0 4px;
}

.activity-task {
  color: #666;
}

.activity-comment {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
