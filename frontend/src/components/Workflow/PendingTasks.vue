<template>
  <n-modal v-model:show="showModal" preset="card" title="待办任务" :style="{ width: '900px' }" :mask-closable="false">
    <n-space vertical :size="12">
      <n-space>
        <n-button size="small" @click="loadTasks">
          <template #icon>
            <n-icon><RefreshCw /></n-icon>
          </template>
          刷新
        </n-button>
        <n-input v-model:value="userId" placeholder="请输入用户ID" style="width: 200px" size="small" />
        <n-button type="primary" size="small" @click="loadTasks">查询</n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="tasks"
        :loading="loading"
        :row-key="(row: WfTask) => row.id"
        :pagination="false"
        size="small"
        striped
      />

      <n-empty v-if="!loading && tasks.length === 0" description="暂无待办任务" />
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="showModal = false">关闭</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal v-model:show="showApproveModal" preset="card" title="审批任务" :style="{ width: '500px' }" :mask-closable="false">
    <n-space vertical :size="12">
      <n-descriptions label-placement="left" :column="1" size="small">
        <n-descriptions-item label="流程名称">{{ currentTask?.process?.processName }}</n-descriptions-item>
        <n-descriptions-item label="节点名称">{{ currentTask?.nodeName }}</n-descriptions-item>
        <n-descriptions-item label="创建时间">{{ formatTime(currentTask?.createTime) }}</n-descriptions-item>
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

  <n-modal v-model:show="showProcessModal" preset="card" title="流程详情" :style="{ width: '800px' }" :mask-closable="false">
    <n-tabs type="line" animated>
      <n-tab-pane name="info" tab="流程信息">
        <n-descriptions label-placement="left" :column="2" size="small">
          <n-descriptions-item label="流程名称">{{ processDetail?.process?.processName }}</n-descriptions-item>
          <n-descriptions-item label="流程状态">
            <n-tag :type="getStatusType(processDetail?.process?.status)" size="small">
              {{ getStatusText(processDetail?.process?.status || '') }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="业务Key">{{ processDetail?.process?.businessKey }}</n-descriptions-item>
          <n-descriptions-item label="发起人">{{ processDetail?.process?.starterId }}</n-descriptions-item>
          <n-descriptions-item label="开始时间">{{ formatTime(processDetail?.process?.startTime) }}</n-descriptions-item>
          <n-descriptions-item label="结束时间">{{ formatTime(processDetail?.process?.endTime) }}</n-descriptions-item>
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
        <n-empty v-if="processDetail?.history?.length === 0" description="暂无审批历史" />
      </n-tab-pane>

      <n-tab-pane name="tasks" tab="所有任务">
        <n-data-table
          :columns="allTaskColumns"
          :data="processDetail?.tasks || []"
          :row-key="(row: WfTask) => row.id"
          :pagination="false"
          size="small"
        />
      </n-tab-pane>

      <n-tab-pane name="variables" tab="流程变量">
        <n-code :code="JSON.stringify(processDetail?.variables, null, 2)" language="json" />
        <n-empty v-if="!processDetail?.variables || Object.keys(processDetail.variables).length === 0" description="暂无变量" />
      </n-tab-pane>
    </n-tabs>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { NModal, NButton, NSpace, NDataTable, NTag, NInput, NIcon, NEmpty, NDescriptions, NDescriptionsItem, NFormItem, NTabs, NTabPane, NCode, useMessage } from 'naive-ui'
import { RefreshCw } from 'lucide-vue-next'
import { workflowApi, WfTask, WfTaskHistory, ProcessDetail, getStatusText, getTaskStatusText, getCurrentUser } from '@/services/workflow'

const message = useMessage()

const showModal = ref(false)
const showApproveModal = ref(false)
const showProcessModal = ref(false)
const loading = ref(false)
const tasks = ref<WfTask[]>([])
const currentTask = ref<WfTask | null>(null)
const approveComment = ref('')
const processDetail = ref<ProcessDetail | null>(null)

const columns = [
  {
    title: '流程名称',
    key: 'process',
    render: (row: WfTask) => row.process?.processName || '-'
  },
  {
    title: '节点',
    key: 'nodeName'
  },
  {
    title: '状态',
    key: 'status',
    render: (row: WfTask) => h(NTag, { type: 'warning', size: 'small' }, () => getTaskStatusText(row.status))
  },
  {
    title: '创建时间',
    key: 'createTime',
    render: (row: WfTask) => formatTime(row.createTime)
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row: WfTask) => h(NSpace, { size: 'small' }, () => [
      h(NButton, { size: 'small', type: 'primary', onClick: () => openApprove(row) }, () => '审批'),
      h(NButton, { size: 'small', onClick: () => viewProcessDetail(row.processId) }, () => '详情')
    ])
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

const allTaskColumns = [
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
  },
  {
    title: '完成时间',
    key: 'completeTime',
    render: (row: WfTask) => formatTime(row.completeTime)
  }
]

function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
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

async function loadTasks() {
  const user = getCurrentUser()
  if (!user) {
    message.warning('请先登录')
    return
  }
  const userId = user.User_Id
  const roleName = user.RoleName
  loading.value = true
  try {
    const res = await workflowApi.getUserTasks(userId, roleName)
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
  if (!user) {
    message.warning('请先登录')
    return
  }
  try {
    const res = await workflowApi.approveTask({
      taskId: currentTask.value.id,
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
  if (!user) {
    message.warning('请先登录')
    return
  }
  try {
    const res = await workflowApi.rejectTask({
      taskId: currentTask.value.id,
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

async function viewProcessDetail(processId: string) {
  try {
    const res = await workflowApi.getProcessDetail(processId)
    if (res.success) {
      processDetail.value = res.data
      showProcessModal.value = true
    } else {
      message.error(res.message || '加载失败')
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  }
}

function open() {
  showModal.value = true
  loadTasks()
}

defineExpose({ open })
</script>
