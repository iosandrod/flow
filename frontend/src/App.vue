<template>
  <ApprovalFlow
    v-if="currentUser && apiRequest"
    :api-request="apiRequest"
    :current-user="currentUser"
    :default-page="'dashboard'"
    :debug="true"
    @submit="handleSubmit"
    @complete="handleComplete"
    @error="handleError"
    @open-designer="handleOpenDesigner"
    @user-change="handleUserChange"
  />
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ApprovalFlow } from '@/lib'
  import type { User, WorkflowResponse } from '@/lib/types'
  import flowDesign from './components/Designer/index'
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

  const currentUser = ref<User | null>(null)
  const apiRequest = ref<((action: string, data: any) => Promise<WorkflowResponse>) | null>(null)

  onMounted(() => {
    initUser()
    initApiRequest()

    window.onerror = (message, source, lineno, colno, error) => {
      const msg = String(message)
      if (msg.includes('image') || msg.includes('model does not support')) {
        return true
      }
    }

    window.onunhandledrejection = (event) => {
      if (
        event.reason &&
        event.reason.message &&
        (event.reason.message.includes('image') ||
          event.reason.message.includes('model does not support'))
      ) {
        event.preventDefault()
      }
    }
  })

  function initUser() {
    const saved = localStorage.getItem('mockUser')
    if (saved) {
      try {
        const user = JSON.parse(saved)
        currentUser.value = {
          id: user.User_Id,
          name: user.UserTrueName || user.UserName,
          username: user.UserName,
          roleName: user.RoleName,
          avatarColor: user.avatarColor
        }
      } catch {
        createDefaultUser()
      }
    } else {
      createDefaultUser()
    }
  }

  function createDefaultUser() {
    const user: User = {
      id: '41',
      name: '徐菊芬',
      username: '19828395638',
      roleName: '用户',
      avatarColor: '#18a058'
    }
    localStorage.setItem(
      'mockUser',
      JSON.stringify({
        User_Id: user.id,
        UserName: user.username,
        UserTrueName: user.name,
        RoleName: user.roleName,
        avatarColor: user.avatarColor
      })
    )
    currentUser.value = user
  }

  function initApiRequest() {
    apiRequest.value = async (action: string, data: any): Promise<WorkflowResponse> => {
      const user = currentUser.value
      try {
        const response = await fetch(`${API_BASE_URL}/workflow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            data: {
              ...data,
              _userId: user?.id,
              _userName: user?.username,
              _userTrueName: user?.name,
              _roleName: user?.roleName
            }
          })
        })
        return response.json()
      } catch (error: any) {
        return {
          success: false,
          message: error.message || '请求失败',
          data: null
        }
      }
    }
  }

  function handleSubmit(data: any) {
    console.log('[ApprovalFlow] Submit event:', data)
  }

  function handleComplete(data: any) {
    console.log('[ApprovalFlow] Complete event:', data)
  }

  function handleError(error: { code: string; message: string }) {
    console.error('[ApprovalFlow] Error event:', error)
  }

  function handleOpenDesigner(data: { flow?: any; flowName?: string; flowKey?: string }) {
    console.log('[ApprovalFlow] Open Designer event:', data)

    let url = '/designer'
    if (data.flowKey) {
      url += `?key=${data.flowKey}`
    }

    window.open(url, '_blank')
  }

  function handleUserChange(user: User) {
    console.log('[ApprovalFlow] User changed to:', user)

    localStorage.setItem(
      'mockUser',
      JSON.stringify({
        User_Id: user.id,
        UserName: user.username,
        UserTrueName: user.name,
        RoleName: user.roleName || '用户',
        avatarColor: user.avatarColor
      })
    )

    currentUser.value = user

    window.location.reload()
  }
</script>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      sans-serif;
  }

  #app {
    width: 100vw;
    height: 100vh;
  }
</style>
