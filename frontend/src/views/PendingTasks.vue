<template>
  <div class="pending-tasks">
    <n-card title="我的待办" class="task-card">
      <template #header-extra>
        <n-button size="small" @click="loadTasks">
          <template #icon><n-icon><RefreshCw /></n-icon></template>
          刷新
        </n-button>
      </template>
      
      <n-space vertical :size="12">
        <n-empty v-if="!loading && tasks.length === 0" description="暂无待办任务" />
        
        <div v-else v-for="task in tasks" :key="task.ID_" class="task-item" @click="openApprove(task)">
          <div class="task-info">
            <div class="task-title">{{ task.NAME_ || task.TASK_DEF_KEY_ }}</div>
            <div class="task-desc">{{ task.DESCRIPTION_ || '审批任务' }}</div>
          </div>
          <div class="task-meta">
            <n-tag :type="getPriorityType(task.PRIORITY_)" size="small">{{ task.PRIORITY_ || '普通' }}</n-tag>
            <span class="task-time">{{ formatTime(task.START_TIME_) }}</span>
          </div>
        </div>
      </n-space>
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
import { ref, onMounted } from 'vue'
import { NCard, NSpace, NEmpty, NButton, NIcon, NTag, NModal, NDescriptions, NDescriptionsItem, NFormItem, NInput, useMessage } from 'naive-ui'
import { RefreshCw } from 'lucide-vue-next'
import { workflowApi, getCurrentUser, WfTask } from '@/services/workflow'

const message = useMessage()

const loading = ref(false)
const tasks = ref<WfTask[]>([])
const showApproveModal = ref(false)
const currentTask = ref<WfTask | null>(null)
const approveComment = ref('')

onMounted(() => {
  loadTasks()
})

async function loadTasks() {
  const user = getCurrentUser()
  if (!user) {
    message.warning('请先登录')
    return
  }
  
  loading.value = true
  try {
    const res = await workflowApi.getUserTasks(user.User_Id, user.RoleName)
    if (res.success) {
      tasks.value = res.data || []
    } else {
      message.error(res.message || '加载失败')
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
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
      loadTasks()
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
      loadTasks()
    } else {
      message.error(res.message || '操作失败')
    }
  } catch (e: any) {
    message.error(e.message || '操作失败')
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
</script>

<style scoped>
.pending-tasks {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.task-card {
  max-width: 800px;
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
}

.task-item:hover {
  background: #f0f5ff;
}

.task-info {
  flex: 1;
}

.task-title {
  font-weight: 500;
  font-size: 15px;
  margin-bottom: 4px;
}

.task-desc {
  font-size: 13px;
  color: #666;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-time {
  font-size: 12px;
  color: #999;
}
</style>
