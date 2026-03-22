<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <div class="approval-flow">
          <n-layout has-sider class="flow-layout">
            <!-- 侧边栏 -->
            <n-layout-sider
              bordered
              collapse-mode="width"
              :collapsed-width="64"
              :width="200"
              :collapsed="collapsed"
              show-trigger
              @collapse="collapsed = true"
              @expand="collapsed = false"
              :native-scrollbar="false"
              class="flow-sider"
            >
              <div class="logo">
                <n-icon size="20" color="#2080f0"><WorkflowIcon /></n-icon>
                <span v-if="!collapsed" class="logo-text">审批流程</span>
              </div>
              
              <n-menu
                :collapsed="collapsed"
                :collapsed-width="64"
                :collapsed-icon-size="22"
                :options="menuOptions"
                :value="currentPage"
                @update:value="handleMenuClick"
              />
              
              <div class="user-info">
                <n-dropdown trigger="click" :options="userOptions" @select="handleUserAction">
                  <n-space align="center" :size="8" class="user-trigger">
                    <n-avatar round size="small" :style="{ backgroundColor: currentUser?.avatarColor || '#2080f0' }">
                      {{ currentUser?.name?.charAt(0) || currentUser?.username?.charAt(0) || 'U' }}
                    </n-avatar>
                    <span v-if="!collapsed" class="user-name">{{ currentUser?.name || currentUser?.username }}</span>
                    <n-icon v-if="!collapsed" :size="12"><ChevronDown /></n-icon>
                  </n-space>
                </n-dropdown>
              </div>
            </n-layout-sider>

            <!-- 主内容区 -->
            <n-layout class="flow-main">
              <!-- 工作台 -->
              <Dashboard 
                v-if="currentPage === 'dashboard'"
                :api-request="apiRequest"
                :current-user="currentUser"
                @navigate="(page) => { currentPage = page; emit('navigate', page) }"
                @error="handleError"
              />
              
              <!-- 审批管理 -->
              <ApprovalManager 
                v-else-if="currentPage === 'start'"
                :api-request="apiRequest"
                :current-user="currentUser"
                @submit="handleSubmit"
                @complete="handleComplete"
                @error="handleError"
              />
              
              <!-- 我的待办 -->
              <PendingTasks 
                v-else-if="currentPage === 'pending'"
                :api-request="apiRequest"
                :current-user="currentUser"
                @navigate="(page) => { currentPage = page; emit('navigate', page) }"
                @complete="handleComplete"
                @error="handleError"
              />
              
              <!-- 我的申请 -->
              <MyApplications 
                v-else-if="currentPage === 'myApply'"
                :api-request="apiRequest"
                :current-user="currentUser"
                @navigate="(page) => { currentPage = page; emit('navigate', page) }"
                @error="handleError"
              />
              
              <!-- 流程管理 -->
              <FlowManager 
                v-else-if="currentPage === 'flowManage'"
                :api-request="apiRequest"
                :current-user="currentUser"
                @open-designer="handleOpenDesigner"
                @navigate="handleNavigate"
                @error="handleError"
              />
              
              <!-- 销售订单 -->
              <SalesOrder 
                v-else-if="currentPage === 'salesOrder'"
                :api-request="apiRequest"
                :current-user="currentUser"
                @error="handleError"
              />

              <!-- 审批设计器 -->
              <ApprovalDesigner 
                v-else-if="currentPage === 'approvalDesigner'"
                :api-request="apiRequest"
                :current-user="currentUser"
                :selected-flow="selectedFlowForDesigner"
                @error="handleError"
                @open-designer="handleOpenDesigner"
              />
            </n-layout>
          </n-layout>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, h, nextTick, defineComponent, PropType } from 'vue'
import { 
  NConfigProvider, NLayout, NLayoutSider, NMenu, NIcon, NAvatar, 
  NDropdown, NSpace, NMessageProvider, NDialogProvider 
} from 'naive-ui'
import { Home, Plus, Clock, ListChecks, Settings, Workflow as WorkflowIcon, User, LogOut, GitBranch, ShoppingCart, Users, ChevronDown, FileEdit } from 'lucide-vue-next'
import type { ApprovalFlowOptions, PageType, User as UserType, WorkflowResponse } from './types'

import Dashboard from './components/Dashboard.vue'
import ApprovalManager from './components/ApprovalManager.vue'
import PendingTasks from './components/PendingTasks.vue'
import MyApplications from './components/MyApplications.vue'
import FlowManager from './components/FlowManager.vue'
import SalesOrder from './components/SalesOrder.vue'
import ApprovalDesigner from './components/ApprovalDesigner.vue'

const props = defineProps<{
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: UserType
  defaultPage?: PageType
  theme?: 'light' | 'dark'
  debug?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'complete', data: any): void
  (e: 'error', error: { code: string, message: string }): void
  (e: 'navigate', page: PageType): void
  (e: 'openDesigner', data: { flow?: any, flowName?: string, flowKey?: string }): void
  (e: 'userChange', user: UserType): void
}>()

const collapsed = ref(false)
const currentPage = ref<PageType>(props.defaultPage || 'dashboard')
const selectedFlowForDesigner = ref<any>(null)

const mockUsers: UserType[] = [
  { id: 41, username: '19828395638', name: '徐菊芬', role: 'manager', avatarColor: '#2080f0' },
  { id: 1, username: 'admin', name: '管理员', role: 'admin', avatarColor: '#ed6c00' },
  { id: 2, username: 'manager01', name: '张经理', role: 'manager', avatarColor: '#52c41a' },
  { id: 3, username: 'finance01', name: '李财务', role: 'finance', avatarColor: '#722ed1' },
  { id: 4, username: 'boss01', name: '王总', role: 'boss', avatarColor: '#eb2f96' },
  { id: 5, username: 'hr01', name: '陈人事', role: 'hr', avatarColor: '#13c2c2' }
]

const menuOptions = computed(() => [
  { label: '工作台', key: 'dashboard', icon: () => h(Home) },
  { label: '审批管理', key: 'start', icon: () => h(Plus) },
  { label: '我的待办', key: 'pending', icon: () => h(Clock) },
  { label: '我的申请', key: 'myApply', icon: () => h(ListChecks) },
  { label: '流程管理', key: 'flowManage', icon: () => h(GitBranch) },
  { label: '审批设计器', key: 'approvalDesigner', icon: () => h(FileEdit) },
  { label: '销售订单', key: 'salesOrder', icon: () => h(ShoppingCart) }
])

const userOptions = computed(() => [
  { 
    label: '切换用户', 
    key: 'switch-user', 
    icon: () => h(Users),
    children: mockUsers.map(user => ({
      label: `${user.name} (${user.username})`,
      key: `user-${user.id}`,
      icon: () => h(User)
    }))
  },
  { type: 'divider', key: 'd0' },
  { label: '个人中心', key: 'profile', icon: () => h(User) },
  { label: '设置', key: 'settings', icon: () => h(Settings) },
  { type: 'divider', key: 'd1' },
  { label: '退出登录', key: 'logout', icon: () => h(LogOut) }
])

const themeOverrides = {
  common: {
    primaryColor: '#2080f0',
    primaryColorHover: '#4098fc',
    primaryColorPressed: '#1060d0'
  }
}

function handleMenuClick(key: string) {
  currentPage.value = key as PageType
  emit('navigate', key as PageType)
}

function handleNavigate(page: string, data?: { flow?: any }) {
  currentPage.value = page as PageType
  if (data?.flow) {
    selectedFlowForDesigner.value = data.flow
  }
  emit('navigate', page as PageType)
}

function handleOpenDesigner(data: { flow?: any, flowName?: string, flowKey?: string }) {
  if (data.flow) {
    selectedFlowForDesigner.value = data.flow
  }
  emit('openDesigner', data)
  if (props.debug) {
    console.log('[ApprovalFlow] Open Designer:', data)
  }
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    window.location.reload()
  } else if (key.startsWith('user-')) {
    const userId = parseInt(key.replace('user-', ''))
    const selectedUser = mockUsers.find(u => u.id === userId)
    if (selectedUser) {
      emit('userChange', selectedUser)
    }
  }
}

function handleSubmit(data: any) {
  emit('submit', data)
}

function handleComplete(data: any) {
  emit('complete', data)
}

function handleError(error: { code: string, message: string }) {
  emit('error', error)
  if (props.debug) {
    console.error('[ApprovalFlow Error]', error)
  }
}

</script>

<style scoped>
.approval-flow {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.flow-layout {
  height: 100%;
}

.flow-sider {
  background: #fff;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.user-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.user-trigger {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: #f5f7fa;
}

.user-name {
  font-size: 13px;
  color: #333;
}

.flow-main {
  background: #f5f7fa;
  height: 100%;
  overflow: auto;
}
</style>
