<template>
  <div class="my-applications">
    <n-card title="我的申请" class="app-card">
      <template #header-extra>
        <n-button size="small" @click="loadApplications">
          <template #icon><n-icon><RefreshCw /></n-icon></template>
          刷新
        </n-button>
      </template>
      
      <n-space vertical :size="12">
        <n-empty v-if="!loading && applications.length === 0" description="暂无申请记录" />
        
        <div v-else v-for="app in applications" :key="app.ID_" class="app-item" @click="viewDetail(app)">
          <div class="app-info">
            <div class="app-title">{{ app.TITLE_ || app.BUSINESS_TYPE_ }}</div>
            <div class="app-desc">{{ formatFormData(app.FORM_DATA_) }}</div>
          </div>
          <div class="app-meta">
            <n-tag :type="getStatusType(app.STATUS_)" size="small">{{ getStatusText(app.STATUS_) }}</n-tag>
            <span class="app-time">{{ formatTime(app.CREATE_TIME_) }}</span>
          </div>
        </div>
      </n-space>
    </n-card>
    
    <!-- 详情弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" title="流程详情" :style="{ width: '800px' }" :mask-closable="false">
      <n-tabs type="line" animated v-if="currentApp">
        <n-tab-pane name="info" tab="流程信息">
          <n-descriptions label-placement="left" :column="2" size="small">
            <n-descriptions-item label="流程名称">{{ currentApp.TITLE_ }}</n-descriptions-item>
            <n-descriptions-item label="流程状态">
              <n-tag :type="getStatusType(currentApp.STATUS_)" size="small">{{ getStatusText(currentApp.STATUS_) }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="业务Key">{{ currentApp.BUSINESS_KEY_ }}</n-descriptions-item>
            <n-descriptions-item label="申请人">{{ currentApp.APPLICANT_NAME_ || currentApp.APPLICANT_ }}</n-descriptions-item>
            <n-descriptions-item label="开始时间">{{ formatTime(currentApp.CREATE_TIME_) }}</n-descriptions-item>
            <n-descriptions-item label="结束时间">{{ formatTime(currentApp.UPDATE_TIME_) }}</n-descriptions-item>
          </n-descriptions>
        </n-tab-pane>
        
        <n-tab-pane name="history" tab="审批历史">
          <n-space vertical>
            <n-empty v-if="!history.length" description="暂无审批历史" />
            <div v-else v-for="h in history" :key="h.ID_" class="history-item">
              <div class="history-header">
                <n-tag :type="getActionType(h.ACTION_)" size="small">{{ getActionText(h.ACTION_) }}</n-tag>
                <span class="history-user">{{ h.ASSIGNEE_ || h.ASSIGNEE_NAME_ }}</span>
                <span class="history-time">{{ formatTime(h.CREATE_TIME_) }}</span>
              </div>
              <div v-if="h.COMMENT_" class="history-comment">意见：{{ h.COMMENT_ }}</div>
            </div>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NSpace, NEmpty, NButton, NIcon, NTag, NModal, NTabs, NTabPane, NDescriptions, NDescriptionsItem, useMessage } from 'naive-ui'
import { RefreshCw } from 'lucide-vue-next'
import { workflowApi, getCurrentUser, WfProcess, WfTaskHistory, getStatusText } from '@/services/workflow'

const message = useMessage()

const loading = ref(false)
const applications = ref<WfProcess[]>([])
const showDetailModal = ref(false)
const currentApp = ref<WfProcess | null>(null)
const history = ref<WfTaskHistory[]>([])

onMounted(() => {
  loadApplications()
})

async function loadApplications() {
  const user = getCurrentUser()
  if (!user) {
    message.warning('请先登录')
    return
  }
  
  loading.value = true
  try {
    const res = await workflowApi.listMyApplications(user.User_Id)
    if (res.success) {
      applications.value = res.data || []
    } else {
      message.error(res.message || '加载失败')
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function viewDetail(app: WfProcess) {
  currentApp.value = app
  showDetailModal.value = true
  
  // 加载审批历史
  try {
    const res = await workflowApi.getProcessHistory(app.id || app.ID_)
    if (res.success) {
      history.value = res.data || []
    }
  } catch (e) {
    console.error('加载历史失败:', e)
  }
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

function getStatusType(status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    F: 'success', C: 'default', N: 'error', I: 'info', A: 'warning', D: 'warning', G: 'warning'
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
.my-applications {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.app-card {
  max-width: 900px;
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
}

.app-item:hover {
  background: #f0f5ff;
}

.app-info {
  flex: 1;
}

.app-title {
  font-weight: 500;
  font-size: 15px;
  margin-bottom: 4px;
}

.app-desc {
  font-size: 13px;
  color: #666;
}

.app-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-time {
  font-size: 12px;
  color: #999;
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
}

.history-user {
  font-weight: 500;
  color: #2080f0;
}

.history-time {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.history-comment {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}
</style>
