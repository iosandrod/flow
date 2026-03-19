<template>
  <n-modal v-model:show="showModal" preset="card" title="快捷登录" :style="{ width: '400px' }" :mask-closable="false">
    <n-space vertical :size="16">
      <div style="text-align: center; color: #666; font-size: 14px;">
        选择一个用户登录以模拟审批流程
      </div>
      <n-space vertical :size="8">
        <n-button
          v-for="user in mockUsers"
          :key="user.User_Id"
          block
          :type="currentUser?.User_Id === user.User_Id ? 'primary' : 'default'"
          @click="handleLogin(user)"
        >
          <n-space align="center" :size="12">
            <n-avatar :size="28" :style="{ backgroundColor: user.avatarColor }">
              {{ user.UserTrueName?.charAt(0) || user.UserName.charAt(0) }}
            </n-avatar>
            <n-space vertical :size="2">
              <span style="font-weight: 500;">{{ user.UserTrueName || user.UserName }}</span>
              <span style="font-size: 12px; color: #999;">{{ user.RoleName }}</span>
            </n-space>
          </n-space>
        </n-button>
      </n-space>
      <n-divider v-if="currentUser" style="margin: 8px 0;" />
      <n-button v-if="currentUser" block type="error" ghost @click="handleLogout">
        退出登录
      </n-button>
    </n-space>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NButton, NSpace, NAvatar, NDivider, useMessage } from 'naive-ui'

export interface MockUser {
  User_Id: string
  UserName: string
  UserTrueName?: string
  RoleName?: string
  DeptName?: string
  avatarColor: string
}

const message = useMessage()

const showModal = ref(false)

const mockUsers: MockUser[] = [
  {
    User_Id: 'admin001',
    UserName: 'admin',
    UserTrueName: '系统管理员',
    RoleName: '管理员',
    DeptName: 'IT部',
    avatarColor: '#18a058'
  },
  {
    User_Id: 'boss001',
    UserName: 'boss',
    UserTrueName: '张总',
    RoleName: '总经理',
    DeptName: '管理层',
    avatarColor: '#2080f0'
  },
  {
    User_Id: 'manager001',
    UserName: 'manager',
    UserTrueName: '李经理',
    RoleName: '部门经理',
    DeptName: '销售部',
    avatarColor: '#f0a020'
  },
  {
    User_Id: 'saler001',
    UserName: 'saler',
    UserTrueName: '王销售',
    RoleName: '销售员',
    DeptName: '销售部',
    avatarColor: '#d03050'
  },
  {
    User_Id: 'hr001',
    UserName: 'hr',
    UserTrueName: '人事小刘',
    RoleName: '人事专员',
    DeptName: '人事部',
    avatarColor: '#7c4dff'
  },
  {
    User_Id: 'finance001',
    UserName: 'finance',
    UserTrueName: '财务小陈',
    RoleName: '财务专员',
    DeptName: '财务部',
    avatarColor: '#00b0f0'
  }
]

const currentUser = ref<MockUser | null>(null)

function handleLogin(user: MockUser) {
  currentUser.value = user
  localStorage.setItem('mockUser', JSON.stringify(user))
  message.success(`已切换为: ${user.UserTrueName || user.UserName}`)
  showModal.value = false
  window.dispatchEvent(new Event('user-changed'))
}

function handleLogout() {
  currentUser.value = null
  localStorage.removeItem('mockUser')
  message.info('已退出登录')
  window.dispatchEvent(new Event('user-changed'))
}

function open() {
  const saved = localStorage.getItem('mockUser')
  if (saved) {
    try {
      currentUser.value = JSON.parse(saved)
    } catch {
      currentUser.value = null
    }
  }
  showModal.value = true
}

function getCurrentUser(): MockUser | null {
  if (!currentUser.value) {
    const saved = localStorage.getItem('mockUser')
    if (saved) {
      try {
        currentUser.value = JSON.parse(saved)
      } catch {
        currentUser.value = null
      }
    }
  }
  return currentUser.value
}

defineExpose({ open, getCurrentUser, currentUser })
</script>
