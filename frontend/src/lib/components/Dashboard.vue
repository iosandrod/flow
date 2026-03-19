<template>
  <div class="dashboard">
    <n-grid :cols="24" :x-gap="16" :y-gap="16">
      <n-gi :span="6">
        <n-card class="stat-card">
          <div class="stat-content">
            <n-icon size="40" color="#2080f0"><ClipboardList /></n-icon>
            <div class="stat-info">
              <div class="stat-number">{{ stats.pending }}</div>
              <div class="stat-text">待处理</div>
            </div>
          </div>
        </n-card>
      </n-gi>
      
      <n-gi :span="6">
        <n-card class="stat-card">
          <div class="stat-content">
            <n-icon size="40" color="#18a058"><CheckCircle /></n-icon>
            <div class="stat-info">
              <div class="stat-number">{{ stats.completed }}</div>
              <div class="stat-text">已完成</div>
            </div>
          </div>
        </n-card>
      </n-gi>
      
      <n-gi :span="6">
        <n-card class="stat-card">
          <div class="stat-content">
            <n-icon size="40" color="#f0a020"><Clock /></n-icon>
            <div class="stat-info">
              <div class="stat-number">{{ stats.processing }}</div>
              <div class="stat-text">审批中</div>
            </div>
          </div>
        </n-card>
      </n-gi>
      
      <n-gi :span="6">
        <n-card class="stat-card">
          <div class="stat-content">
            <n-icon size="40" color="#d03050"><FileText /></n-icon>
            <div class="stat-info">
              <div class="stat-number">{{ stats.rejected }}</div>
              <div class="stat-text">已拒绝</div>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
    
    <n-grid :cols="24" :x-gap="16" style="margin-top: 16px;">
      <n-gi :span="16">
        <n-card title="快捷入口" class="action-card">
          <n-space :size="16">
            <n-button type="primary" size="large" @click="$emit('navigate', 'start')">
              <template #icon><n-icon><Plus /></n-icon></template>
              发起审批
            </n-button>
            <n-button size="large" @click="$emit('navigate', 'pending')">
              <template #icon><n-icon><ClipboardList /></n-icon></template>
              我的待办
            </n-button>
            <n-button size="large" @click="$emit('navigate', 'myApply')">
              <template #icon><n-icon><ListChecks /></n-icon></template>
              我的申请
            </n-button>
          </n-space>
        </n-card>
      </n-gi>
      
      <n-gi :span="8">
        <n-card title="当前用户" class="user-card">
          <n-space vertical align="center">
            <n-avatar round size="large" :style="{ backgroundColor: currentUser?.avatarColor || '#2080f0', fontSize: '24px' }">
              {{ currentUser?.name?.charAt(0) || 'U' }}
            </n-avatar>
            <div class="user-name">{{ currentUser?.name || currentUser?.username }}</div>
            <n-tag v-if="currentUser?.roleName" type="info">{{ currentUser.roleName }}</n-tag>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NGrid, NGi, NCard, NIcon, NSpace, NButton, NAvatar, NTag } from 'naive-ui'
import { ClipboardList, CheckCircle, Clock, FileText, Plus, ListChecks } from 'lucide-vue-next'
import type { User, WorkflowResponse, Approval } from '../types'

const props = defineProps<{
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: User
}>()

defineEmits<{
  (e: 'navigate', page: string): void
  (e: 'error', error: { code: string, message: string }): void
}>()

const stats = ref({
  pending: 0,
  completed: 0,
  processing: 0,
  rejected: 0
})

onMounted(() => {
  loadStats()
})

async function loadStats() {
  if (!props.currentUser) return
  
  try {
    const res = await props.apiRequest('listMyApplications', { userId: props.currentUser.id })
    if (res.success && res.data) {
      const approvals: Approval[] = res.data
      stats.value = {
        pending: approvals.filter(a => a.STATUS_ === 'I').length,
        completed: approvals.filter(a => a.STATUS_ === 'F').length,
        processing: approvals.filter(a => a.STATUS_ === 'A' || a.STATUS_ === 'D').length,
        rejected: approvals.filter(a => a.STATUS_ === 'N').length
      }
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}
</script>

<style scoped>
.dashboard {
  padding: 24px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.stat-info {
  text-align: left;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-text {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.action-card :deep(.n-card__content) {
  padding: 24px;
}

.user-card {
  text-align: center;
}

.user-name {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}
</style>
