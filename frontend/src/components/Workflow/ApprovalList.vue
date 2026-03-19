<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="审批列表"
    :style="{ width: '1000px' }"
    :mask-closable="false"
  >
    <n-space vertical :size="12">
      <n-space>
        <n-button size="small" @click="loadProcesses">
          <template #icon>
            <n-icon>
              <RefreshCw />
            </n-icon>
          </template>
          刷新
        </n-button>
        <n-select
          v-model:value="statusFilter"
          placeholder="状态筛选"
          :options="statusOptions"
          style="width: 120px"
          size="small"
          clearable
        />
        <n-input v-model:value="userId" placeholder="发起人" style="width: 150px" size="small" />
        <n-button type="primary" size="small" @click="loadProcesses">查询</n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="filteredProcesses"
        :loading="loading"
        :row-key="(row: any) => row.id"
        :pagination="{ pageSize: 10 }"
        size="small"
        striped
      />

      <n-empty v-if="!loading && processes.length === 0" description="暂无审批记录" />
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="showModal = false">关闭</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal
    v-model:show="showDetailModal"
    preset="card"
    title="流程详情"
    :style="{ width: '800px' }"
    :mask-closable="false"
  >
    <n-tabs type="line" animated>
      <n-tab-pane name="info" tab="流程信息">
        <n-descriptions label-placement="left" :column="2" size="small">
          <n-descriptions-item label="流程名称">{{
            processDetail?.process?.processName
          }}</n-descriptions-item>
          <n-descriptions-item label="流程状态">
            <n-tag :type="getStatusType(processDetail?.process?.status)" size="small">
              {{ getStatusText(processDetail?.process?.status || '') }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="业务Key">{{
            processDetail?.process?.businessKey
          }}</n-descriptions-item>
          <n-descriptions-item label="发起人">{{
            processDetail?.process?.starterId
          }}</n-descriptions-item>
          <n-descriptions-item label="开始时间">{{
            formatTime(processDetail?.process?.startTime)
          }}</n-descriptions-item>
          <n-descriptions-item label="结束时间">{{
            formatTime(processDetail?.process?.endTime)
          }}</n-descriptions-item>
        </n-descriptions>
      </n-tab-pane>

      <n-tab-pane name="history" tab="审批历史">
        <n-data-table
          :columns="historyColumns"
          :data="processDetail?.history || []"
          :row-key="(row: WfTaskHistory) => row.id"
          :pagination="false"
          size="small"
        />
      </n-tab-pane>

      <n-tab-pane name="tasks" tab="所有任务">
        <n-data-table
          :columns="taskColumns"
          :data="processDetail?.tasks || []"
          :row-key="(row: WfTask) => row.id"
          :pagination="false"
          size="small"
        />
      </n-tab-pane>
    </n-tabs>
  </n-modal>
</template>

<script setup lang="ts">
  import { ref, computed, h, onMounted } from 'vue'
  import {
    NModal,
    NButton,
    NSpace,
    NDataTable,
    NTag,
    NIcon,
    NEmpty,
    NDescriptions,
    NDescriptionsItem,
    NTabs,
    NTabPane,
    NSelect,
    useMessage
  } from 'naive-ui'
  import { RefreshCw } from 'lucide-vue-next'
  import {
    workflowApi,
    WfProcess,
    WfTask,
    WfTaskHistory,
    ProcessDetail,
    getStatusText
  } from '@/services/workflow'

  const message = useMessage()

  const showModal = ref(false)
  const showDetailModal = ref(false)
  const loading = ref(false)
  const processes = ref<WfProcess[]>([])
  const processDetail = ref<ProcessDetail | null>(null)
  const statusFilter = ref<string | null>(null)
  const userId = ref('')

  const statusOptions = [
    { label: '新单', value: 'I' },
    { label: '审核中', value: 'A' },
    { label: '部分审核', value: 'D' },
    { label: '已完成', value: 'F' },
    { label: '执行中', value: 'G' },
    { label: '已拒绝', value: 'N' },
    { label: '已关闭', value: 'C' }
  ]

  const filteredProcesses = computed(() => {
    let result = processes.value
    if (statusFilter.value) {
      result = result.filter((p) => p.status === statusFilter.value)
    }
    if (userId.value) {
      result = result.filter((p) => p.starterId.includes(userId.value))
    }
    return result
  })

  const columns = [
    {
      title: '流程名称',
      key: 'processName'
    },
    {
      title: '业务Key',
      key: 'businessKey'
    },
    {
      title: '状态',
      key: 'status',
      render: (row: WfProcess) => {
        const type = getStatusType(row.status)
        return h(NTag, { type, size: 'small' }, () => getStatusText(row.status))
      }
    },
    {
      title: '发起人',
      key: 'starterId'
    },
    {
      title: '开始时间',
      key: 'startTime',
      render: (row: WfProcess) => formatTime(row.startTime)
    },
    {
      title: '结束时间',
      key: 'endTime',
      render: (row: WfProcess) => formatTime(row.endTime)
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (row: WfProcess) =>
        h(NButton, { size: 'small', onClick: () => viewDetail(row.id) }, () => '详情')
    }
  ]

  const historyColumns = [
    {
      title: '操作',
      key: 'action',
      render: (row: WfTaskHistory) => {
        const actionMap: Record<string, string> = {
          approve: '通过',
          reject: '拒绝',
          execute: '执行',
          close: '关闭',
          start: '启动'
        }
        return actionMap[row.action] || row.action
      }
    },
    {
      title: '操作人',
      key: 'operatorId'
    },
    {
      title: '意见',
      key: 'comment'
    },
    {
      title: '时间',
      key: 'createTime',
      render: (row: WfTaskHistory) => formatTime(row.createTime)
    }
  ]

  const taskColumns = [
    {
      title: '节点',
      key: 'nodeName'
    },
    {
      title: '状态',
      key: 'status',
      render: (row: WfTask) => {
        const type = row.status === 'C' ? 'success' : row.status === 'X' ? 'error' : 'warning'
        return h(NTag, { type, size: 'small' }, () => getTaskStatusText(row.status))
      }
    },
    {
      title: '处理人',
      key: 'assignee'
    },
    {
      title: '创建时间',
      key: 'createTime',
      render: (row: WfTask) => formatTime(row.createTime)
    }
  ]

  function formatTime(time?: string): string {
    if (!time) return '-'
    return new Date(time).toLocaleString('zh-CN')
  }

  function getTaskStatusText(status: string): string {
    const map: Record<string, string> = { P: '待处理', C: '已完成', X: '已取消' }
    return map[status] || status
  }

  function getStatusType(status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      F: 'success',
      C: 'default',
      N: 'error',
      I: 'info',
      A: 'warning',
      D: 'warning',
      G: 'warning'
    }
    return map[status || ''] || 'default'
  }

  async function loadProcesses() {
    loading.value = true
    try {
      const res = await workflowApi.listBpmn()
      if (res.success && res.data && res.data.length > 0) {
        const bpmn = res.data[0]
        message.info('请通过后端API查询所有流程列表，当前显示模拟数据')
        processes.value = []
      } else {
        processes.value = []
      }
    } catch (e: any) {
      message.error(e.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  async function viewDetail(processId: string) {
    try {
      const res = await workflowApi.getProcessDetail(processId)
      if (res.success) {
        processDetail.value = res.data
        showDetailModal.value = true
      } else {
        message.error(res.message || '加载失败')
      }
    } catch (e: any) {
      message.error(e.message || '加载失败')
    }
  }

  function open() {
    showModal.value = true
    loadProcesses()
  }

  defineExpose({ open })
</script>
