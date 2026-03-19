<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-layout has-sider class="app-layout">
          <!-- 侧边栏 -->
          <n-layout-sider
            bordered
            collapse-mode="width"
            :collapsed-width="64"
            :width="220"
            :collapsed="collapsed"
            show-trigger
            @collapse="collapsed = true"
            @expand="collapsed = false"
            :native-scrollbar="false"
            class="layout-sider"
          >
            <div class="logo">
              <n-icon size="24" color="#2080f0">
                <Workflow />
              </n-icon>
              <span v-if="!collapsed" class="logo-text">审批流程</span>
            </div>

            <n-menu
              :collapsed="collapsed"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :options="menuOptions"
              :value="activeMenu"
              @update:value="handleMenuSelect"
            />

            <div class="user-info">
              <n-dropdown :options="userOptions" @select="handleUserAction">
                <n-space align="center" :size="8" class="user-trigger">
                  <n-avatar round size="small" :style="{ backgroundColor: userInfo.avatarColor }">
                    {{ userInfo.UserName?.charAt(0) || 'U' }}
                  </n-avatar>
                  <span v-if="!collapsed" class="user-name">{{ userInfo.UserName }}</span>
                </n-space>
              </n-dropdown>
            </div>
          </n-layout-sider>

          <!-- 主内容区 -->
          <n-layout class="main-layout">
            <router-view v-slot="{ Component, route }">
              <div style="height: 100%">
                <component :is="Component" />
              </div>
            </router-view>
          </n-layout>
        </n-layout>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
  import { ref, computed, h, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import {
    NConfigProvider,
    NLayout,
    NLayoutSider,
    NMenu,
    NIcon,
    NAvatar,
    NDropdown,
    NSpace,
    NMessageProvider,
    NDialogProvider
  } from 'naive-ui'
  import {
    Home,
    FileEdit,
    Plus,
    Clock,
    ListChecks,
    Archive,
    User,
    Settings,
    LogOut,
    FolderOpen,
    Workflow
  } from 'lucide-vue-next'
  import { getCurrentUser, initDefaultUser, MockUser } from '@/services/workflow'

  const router = useRouter()
  const route = useRoute()

  const collapsed = ref(false)
  const userInfo = ref<MockUser>(initDefaultUser())

  const activeMenu = computed(() =>
    route.path === '/' ? 'dashboard' : route.path.replace('/', '')
  )

  interface MenuOption {
    label: string
    key: string
    icon?: () => any
  }

  const menuOptions = computed<MenuOption[]>(() => [
    {
      label: '工作台',
      key: 'dashboard',
      icon: () => h(Home)
    },
    {
      label: '审批管理',
      key: 'start',
      icon: () => h(Plus)
    },
    {
      label: '我的待办',
      key: 'pending',
      icon: () => h(Clock)
    },
    {
      label: '我的申请',
      key: 'myApply',
      icon: () => h(ListChecks)
    },
    {
      label: '流程设计器',
      key: 'designer',
      icon: () => h(FileEdit)
    },
    {
      label: '审批设计器',
      key: 'approvalDesigner',
      icon: () => h(FileEdit)
    }
  ])

  const userOptions = [
    { label: '个人中心', key: 'profile', icon: () => h(User) },
    { label: '设置', key: 'settings', icon: () => h(Settings) },
    { type: 'divider', key: 'd1' },
    { label: '退出登录', key: 'logout', icon: () => h(LogOut) }
  ]

  const themeOverrides = {
    common: {
      primaryColor: '#2080f0',
      primaryColorHover: '#4098fc',
      primaryColorPressed: '#1060d0'
    }
  }

  function handleMenuSelect(key: string) {
    const routeMap: Record<string, string> = {
      dashboard: '/',
      start: '/start',
      pending: '/pending',
      myApply: '/myApply',
      designer: '/designer',
      approvalDesigner: '/approvalDesigner'
    }

    const path = routeMap[key]
    if (path) {
      router.push(path)
    }
  }

  function handleUserAction(key: string) {
    if (key === 'logout') {
      localStorage.removeItem('mockUser')
      window.location.reload()
    }
  }
</script>

<style scoped>
  .app-layout {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .layout-sider {
    background: #fff;
    height: 100%;
  }

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-bottom: 1px solid #f0f0f0;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .user-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
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
    font-size: 14px;
    color: #333;
  }

  .main-layout {
    background: #f5f7fa;
    height: 100%;
    overflow: auto;
  }
</style>
