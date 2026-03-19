<template>
  <div class="my-applications">
    <n-grid :cols="24" :x-gap="16" class="apps-grid">
      <!-- 左侧：申请列表 -->
      <n-gi :span="17">
        <n-card title="我的申请" class="app-card">
          <template #header-extra>
            <n-space>
              <n-select v-model:value="statusFilter" placeholder="状态筛选" :options="statusOptions" style="width: 120px" clearable />
              <n-input v-model:value="searchText" placeholder="搜索申请..." clearable style="width: 160px" />
              <n-button size="small" @click="loadApplications">
                <template #icon><n-icon><RefreshCw /></n-icon></template>
              </n-button>
            </n-space>
          </template>
          
          <n-space vertical :size="12">
            <n-empty v-if="!loading && filteredApplications.length === 0" description="暂无申请记录" />
            
            <div v-else v-for="app in filteredApplications" :key="app.ID_" class="app-item" @click="viewDetail(app)">
              <div class="app-info">
                <div class="app-header">
                  <span class="app-title">{{ app.TITLE_ || app.BUSINESS_TYPE_ }}</span>
                  <n-tag :type="getStatusType(app.STATUS_)" size="small">
                    {{ getStatusText(app.STATUS_) }}
                  </n-tag>
                </div>
                <div class="app-desc">{{ formatFormData(app.FORM_DATA_) }}</div>
                <div class="app-footer">
                  <span class="app-key">
                    <n-icon size="14"><Key /></n-icon>
                    {{ app.BUSINESS_KEY_ || app.BUSINESS_TYPE_ }}
                  </span>
                  <span class="app-time">
                    <n-icon size="14"><Clock /></n-icon>
                    {{ formatTime(app.CREATE_TIME_) }}
                  </span>
                  <span v-if="app.CURRENT_NODE_" class="app-node">
                    <n-icon size="14"><ArrowRight /></n-icon>
                    {{ app.CURRENT_NODE_ }}
                  </span>
                </div>
              </div>
              <div class="app-actions">
                <n-button size="small" type="info" @click.stop="viewDetail(app)">详情</n-button>
              </div>
            </div>
          </n-space>
        </n-card>
      </n-gi>
      
      <!-- 右侧：统计和操作 -->
      <n-gi :span="7">
        <n-card title="申请统计" class="stat-card">
          <n-space vertical :size="12">
            <div class="stat-item">
              <div class="stat-label">全部申请</div>
              <div class="stat-value">{{ applications.length }}</div>
            </div>
            <n-divider />
            <div class="stat-row">
              <div class="stat-cell">
                <div class="stat-num">{{ statusStats.pending }}</div>
                <div class="stat-label">待审核</div>
              </div>
              <div class="stat-cell">
                <div class="stat-num approved">{{ statusStats.approved }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
            <div class="stat-row">
              <div class="stat-cell">
                <div class="stat-num rejected">{{ statusStats.rejected }}</div>
                <div class="stat-label">已拒绝</div>
              </div>
              <div class="stat-cell">
                <div class="stat-num processing">{{ statusStats.processing }}</div>
                <div class="stat-label">审批中</div>
              </div>
            </div>
          </n-space>
        </n-card>
        
        <n-card title="快捷操作" class="action-card" style="margin-top: 16px;">
          <n-space vertical :size="12">
            <n-button block type="primary" @click="navigateToStart">
              <template #icon><n-icon><Plus /></n-icon></template>
              发起新申请
            </n-button>
            <n-button block @click="loadApplications">
              <template #icon><n-icon><RefreshCw /></n-icon></template>
              刷新列表
            </n-button>
              <n-button block type="info" @click="showTimeline">
                <template #icon><n-icon><Activity /></n-icon></template>
                申请时间线
              </n-button>
          </n-space>
        </n-card>
        
        <n-card title="最近动态" class="recent-card" style="margin-top: 16px;">
          <n-space vertical v-if="recentActivities.length">
            <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
              <div class="activity-dot" :class="activity.type"></div>
              <div class="activity-content">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </n-space>
          <n-empty v-else description="暂无最近动态" size="small" />
        </n-card>
      </n-gi>
    </n-grid>
    
    <!-- 详情弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" :title="'流程详情 - ' + (currentApp?.TITLE_ || '')" :style="{ width: '850px' }" :mask-closable="false">
      <n-tabs type="line" animated v-if="currentApp">
        <n-tab-pane name="info" tab="流程信息">
          <n-grid :cols="2" :x-gap="12" :y-gap="12">
            <n-gi>
              <div class="detail-item">
                <div class="detail-label">业务类型</div>
                <div class="detail-value">{{ currentApp.BUSINESS_TYPE_ }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="detail-item">
                <div class="detail-label">流程状态</div>
                <div class="detail-value">
                  <n-tag :type="getStatusType(currentApp.STATUS_)" size="small">{{ getStatusText(currentApp.STATUS_) }}</n-tag>
                </div>
              </div>
            </n-gi>
            <n-gi>
              <div class="detail-item">
                <div class="detail-label">业务Key</div>
                <div class="detail-value">{{ currentApp.BUSINESS_KEY_ || '-' }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="detail-item">
                <div class="detail-label">申请人</div>
                <div class="detail-value">{{ currentApp.APPLICANT_NAME_ || currentApp.APPLICANT_ }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="detail-item">
                <div class="detail-label">当前节点</div>
                <div class="detail-value">{{ currentApp.CURRENT_NODE_ || '-' }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="detail-item">
                <div class="detail-label">当前处理人</div>
                <div class="detail-value">{{ currentApp.CURRENT_ASSIGNEE_ || '-' }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="detail-item">
                <div class="detail-label">开始时间</div>
                <div class="detail-value">{{ formatTime(currentApp.CREATE_TIME_) }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="detail-item">
                <div class="detail-label">更新时间</div>
                <div class="detail-value">{{ formatTime(currentApp.UPDATE_TIME_) }}</div>
              </div>
            </n-gi>
          </n-grid>
          
          <n-divider>表单数据</n-divider>
          <div class="form-data">
            <pre>{{ formatFormDataPretty(currentApp.FORM_DATA_) }}</pre>
          </div>
        </n-tab-pane>
        
        <n-tab-pane name="history" tab="审批历史">
          <n-timeline v-if="history.length">
            <n-timeline-item
              v-for="(h, index) in history"
              :key="h.ID_"
              :type="getActionType(h.ACTION_)"
              :title="getActionText(h.ACTION_)"
            >
              <template #header>
                <div class="timeline-header">
                  <n-tag :type="getActionType(h.ACTION_)" size="small">{{ getActionText(h.ACTION_) }}</n-tag>
                  <span class="timeline-user">{{ h.ASSIGNEE_NAME_ || h.ASSIGNEE_ }}</span>
                  <span class="timeline-time">{{ formatTime(h.CREATE_TIME_) }}</span>
                </div>
              </template>
              <div v-if="h.TASK_NAME_" class="timeline-task">任务：{{ h.TASK_NAME_ }}</div>
              <div v-if="h.COMMENT_" class="timeline-comment">
                <n-icon size="14"><MessageSquare /></n-icon>
                {{ h.COMMENT_ }}
              </div>
            </n-timeline-item>
          </n-timeline>
          <n-empty v-else description="暂无审批历史" />
        </n-tab-pane>
        
        <n-tab-pane name="process" tab="流程图">
          <div class="process-viewer-container">
            <div v-if="!currentApp?.PROC_INST_ID_" class="no-instance">
              <n-result status="info" title="暂无流程实例" description="该申请尚未启动流程" />
            </div>
            <ProcessViewer
              v-else
              ref="processViewerRef"
              :proc-inst-id="currentApp.PROC_INST_ID_"
              :bpmn-xml="currentBpmnXml"
              :node-status="currentNodeStatus"
            />
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-modal>
    
    <!-- 时间线弹窗 -->
    <n-modal v-model:show="showTimelineModal" preset="card" title="申请时间线" :style="{ width: '600px' }">
      <n-timeline v-if="applications.length">
        <n-timeline-item
          v-for="app in sortedApplications"
          :key="app.ID_"
          :type="getStatusType(app.STATUS_)"
          :title="app.TITLE_ || app.BUSINESS_TYPE_"
        >
          <template #header>
            <div class="timeline-header">
              <span class="timeline-title">{{ app.TITLE_ || app.BUSINESS_TYPE_ }}</span>
              <n-tag :type="getStatusType(app.STATUS_)" size="small">{{ getStatusText(app.STATUS_) }}</n-tag>
            </div>
          </template>
          <div class="timeline-detail">
            <div>业务Key: {{ app.BUSINESS_KEY_ || '-' }}</div>
            <div>创建时间: {{ formatTime(app.CREATE_TIME_) }}</div>
            <div v-if="app.UPDATE_TIME_">完成时间: {{ formatTime(app.UPDATE_TIME_) }}</div>
          </div>
        </n-timeline-item>
      </n-timeline>
      <n-empty v-else description="暂无申请记录" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NGrid, NGi, NSpace, NEmpty, NButton, NIcon, NTag, NModal, NTabs, NTabPane, NTimeline, NTimelineItem, NSelect, NInput, NDivider, NAlert, NSpin, NResult, useMessage } from 'naive-ui'
import { RefreshCw, Clock, Key, ArrowRight, Plus, Activity, MessageSquare, CheckCircle, User, GitBranch, Wallet } from 'lucide-vue-next'
import ProcessViewer from './ProcessViewer.vue'
import type { User as UserType, WorkflowResponse, Approval, ApprovalHistory } from '../types'
import { workflowApi } from '@/services/workflow'

const props = defineProps<{
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: UserType
}>()

const emit = defineEmits<{
  (e: 'error', error: { code: string, message: string }): void
  (e: 'navigate', page: string): void
}>()

const message = useMessage()

const loading = ref(false)
const applications = ref<Approval[]>([])
const showDetailModal = ref(false)
const showTimelineModal = ref(false)
const currentApp = ref<Approval | null>(null)
const history = ref<ApprovalHistory[]>([])
const searchText = ref('')
const statusFilter = ref<string | null>(null)
const processViewerRef = ref<InstanceType<typeof ProcessViewer> | null>(null)
const currentBpmnXml = ref<string | null>(null)
const currentNodeStatus = ref<{ pending: string[]; completed: string[]; rejected: string[] } | null>(null)

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '新单', value: 'I' },
  { label: '审核中', value: 'A' },
  { label: '已完成', value: 'F' },
  { label: '已拒绝', value: 'N' }
]

const filteredApplications = computed(() => {
  let result = applications.value
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(a => 
      (a.TITLE_?.toLowerCase().includes(keyword)) ||
      (a.BUSINESS_TYPE_?.toLowerCase().includes(keyword)) ||
      (a.BUSINESS_KEY_?.toLowerCase().includes(keyword))
    )
  }
  
  if (statusFilter.value && statusFilter.value !== 'all') {
    result = result.filter(a => a.STATUS_ === statusFilter.value)
  }
  
  return result
})

const sortedApplications = computed(() => {
  return [...applications.value].sort((a, b) => {
    const timeA = new Date(a.CREATE_TIME_ || 0).getTime()
    const timeB = new Date(b.CREATE_TIME_ || 0).getTime()
    return timeB - timeA
  })
})

const statusStats = computed(() => ({
  pending: applications.value.filter(a => a.STATUS_ === 'I').length,
  approved: applications.value.filter(a => a.STATUS_ === 'F').length,
  rejected: applications.value.filter(a => a.STATUS_ === 'N').length,
  processing: applications.value.filter(a => a.STATUS_ === 'A' || a.STATUS_ === 'D' || a.STATUS_ === 'G').length
}))

const recentActivities = computed(() => {
  return history.value.slice(0, 5).map(h => ({
    text: `${h.ASSIGNEE_NAME_ || h.ASSIGNEE_} ${getActionText(h.ACTION_)}了申请`,
    time: formatTime(h.CREATE_TIME_),
    type: h.ACTION_
  }))
})

onMounted(() => {
  loadApplications()
})

async function loadApplications() {
  if (!props.currentUser) {
    emit('error', { code: 'NO_USER', message: '请先登录' })
    return
  }
  
  loading.value = true
  try {
    const res = await props.apiRequest('listMyApplications', { userId: props.currentUser.id })
    if (res.success) {
      applications.value = res.data || []
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

async function viewDetail(app: Approval) {
  currentApp.value = app
  showDetailModal.value = true
  
  try {
    const res = await props.apiRequest('getProcessHistory', { processId: app.ID_ })
    if (res.success) {
      history.value = res.data || []
    }
  } catch (e: any) {
    emit('error', { code: 'HISTORY_ERROR', message: e.message })
  }

  if (app.PROC_INST_ID_) {
    loadProcessDiagram(app)
  }
}

async function loadProcessDiagram(app: Approval) {
  currentBpmnXml.value = null
  currentNodeStatus.value = null
  
  try {
    const detailRes = await workflowApi.getProcessDetail(app.ID_)
    if (detailRes.success && detailRes.data?.approval?.BPMN_XML_) {
      currentBpmnXml.value = detailRes.data.approval.BPMN_XML_
    } else {
      const bpmnRes = await workflowApi.getBpmn(app.BUSINESS_TYPE_)
      if (bpmnRes.success && bpmnRes.data?.bpmnXml) {
        currentBpmnXml.value = bpmnRes.data.bpmnXml
      }
    }

    const statusRes = await workflowApi.getProcessNodeStatus(app.PROC_INST_ID_)
    if (statusRes.success && statusRes.data) {
      currentNodeStatus.value = statusRes.data
    }
  } catch (e: any) {
    console.error('Failed to load process diagram:', e)
  }
}

function navigateToStart() {
  emit('navigate', 'start')
}

function showTimeline() {
  showTimelineModal.value = true
}

function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function formatFormData(data?: string): string {
  if (!data) return '-'
  try {
    const obj = JSON.parse(data)
    return obj.reason || obj.title || JSON.stringify(obj).substring(0, 100)
  } catch {
    return data.substring(0, 100)
  }
}

function formatFormDataPretty(data?: string): string {
  if (!data) return '{}'
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
  }
}

function getStatusType(status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    F: 'success', C: 'default', N: 'error', I: 'info', A: 'warning', D: 'warning', G: 'warning'
  }
  return map[status || ''] || 'default'
}

function getStatusText(status?: string): string {
  const map: Record<string, string> = {
    F: '已完成', C: '已关闭', N: '已拒绝', I: '新单', A: '审核中', D: '部分审核', G: '执行中'
  }
  return map[status || ''] || status
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

function isNodeCompleted(nodeId: string): boolean {
  if (!currentApp.value || currentApp.value.STATUS_ === 'I' || currentApp.value.STATUS_ === 'A') {
    return false
  }
  return currentApp.value.STATUS_ === 'F'
}

function isNodeCurrent(nodeId: string): boolean {
  if (!currentApp.value) return false
  const current = currentApp.value.CURRENT_NODE_
  if (nodeId === 'Task_Manager' && (current?.includes('经理') || current?.includes('Manager'))) return true
  if (nodeId === 'Gateway' && current?.includes('判断')) return true
  if (nodeId === 'Task_Finance' && (current?.includes('财务') || current?.includes('Finance'))) return true
  if (nodeId === 'Task_Boss' && (current?.includes('总经理') || current?.includes('Boss'))) return true
  return false
}

function getCurrentNodeName(): string {
  if (!currentApp.value) return '-'
  if (currentApp.value.STATUS_ === 'F') return '完成'
  if (currentApp.value.STATUS_ === 'N') return '已拒绝'
  return currentApp.value.CURRENT_NODE_ || '审批'
}
</script>

<style scoped>
.my-applications {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.apps-grid {
  height: 100%;
}

.app-card {
  height: 100%;
}

.app-card :deep(.n-card__content) {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.app-item {
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

.app-item:hover {
  background: #f0f5ff;
  border-color: #2080f0;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.app-title {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.app-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.app-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.app-key, .app-time, .app-node {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-actions {
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
  color: #2080f0;
}

.stat-num.approved {
  color: #18a058;
}

.stat-num.rejected {
  color: #d03050;
}

.stat-num.processing {
  color: #f0a020;
}

.action-card :deep(.n-card__content) {
  padding: 16px;
}

.recent-card :deep(.n-card__content) {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  background: #2080f0;
}

.activity-dot.approve {
  background: #18a058;
}

.activity-dot.reject {
  background: #d03050;
}

.activity-dot.start {
  background: #2080f0;
}

.activity-text {
  font-size: 13px;
  color: #333;
}

.activity-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.detail-item {
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
}

.detail-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.form-data {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.form-data pre {
  margin: 0;
  font-size: 13px;
  color: #333;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-user {
  font-weight: 500;
  color: #2080f0;
}

.timeline-time {
  font-size: 12px;
  color: #999;
}

.timeline-title {
  font-weight: 500;
}

.timeline-task {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.timeline-comment {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.timeline-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

.process-info {
  padding: 16px;
}

.process-viewer-container {
  width: 100%;
  height: 500px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.no-instance {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.process-nodes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 8px;
  color: #999;
}

.node-item.completed {
  border-color: #18a058;
  color: #18a058;
}

.node-item.current {
  border-color: #2080f0;
  color: #2080f0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(32, 128, 240, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(32, 128, 240, 0); }
}

.node-arrow {
  color: #999;
  font-size: 20px;
}
</style>
