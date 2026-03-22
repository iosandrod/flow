<template>
  <div class="flow-manager">
    <n-grid :cols="24" :x-gap="16" class="manager-grid">
      <!-- 左侧：流程列表 -->
      <n-gi :span="17">
        <n-card title="流程管理" class="list-card">
          <template #header-extra>
            <n-space>
              <n-input v-model:value="searchText" placeholder="搜索流程..." clearable style="width: 160px" />
              <n-button type="primary" size="small" @click="handleCreateFlow">
                <template #icon><n-icon><Plus /></n-icon></template>
                新建流程
              </n-button>
              <n-button size="small" @click="loadFlows">
                <template #icon><n-icon><RefreshCw /></n-icon></template>
              </n-button>
            </n-space>
          </template>
          
          <div class="table-wrapper">
            <vxe-table
              :data="filteredFlows"
              :loading="loading"
              stripe
              border
              show-overflow
              height="100%"
              :row-config="{ isHover: true }"
              @cell-click="handleCellClick"
            >
              <vxe-column type="seq" width="60" />
              <vxe-column field="name" title="流程名称" min-width="120" />
              <vxe-column field="id" title="流程Key" min-width="100" />
              <vxe-column field="version" title="版本" width="80" />
              <vxe-column field="status" title="状态" width="100">
                <template v-slot:default="{ row }">
                  <n-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </n-tag>
                </template>
              </vxe-column>
              <vxe-column field="updateTime" title="更新时间" width="180" />
              <vxe-column title="操作" width="150">
                <template v-slot:default="{ row }">
                  <n-space>
                    <n-button size="small" type="primary" @click.stop="handleEditFlow(row)">编辑</n-button>
                    <n-button size="small" type="error" @click.stop="deleteFlow(row)">删除</n-button>
                  </n-space>
                </template>
              </vxe-column>
            </vxe-table>
          </div>
        </n-card>
      </n-gi>
      
      <!-- 右侧：统计和操作 -->
      <n-gi :span="7">
        <n-card title="流程统计" class="stat-card">
          <n-space vertical :size="12">
            <div class="stat-item">
              <div class="stat-label">全部流程</div>
              <div class="stat-value">{{ flows.length }}</div>
            </div>
            <n-divider />
            <div class="stat-row">
              <div class="stat-cell">
                <div class="stat-num">{{ activeCount }}</div>
                <div class="stat-label">已启用</div>
              </div>
              <div class="stat-cell">
                <div class="stat-num disabled">{{ disabledCount }}</div>
                <div class="stat-label">已禁用</div>
              </div>
            </div>
          </n-space>
        </n-card>
        
        <n-card title="快捷操作" class="action-card" style="margin-top: 16px;">
          <n-space vertical :size="12">
            <n-button block type="primary" @click="handleCreateFlow">
              <template #icon><n-icon><Plus /></n-icon></template>
              新建流程
            </n-button>
            <n-button block @click="loadFlows">
              <template #icon><n-icon><RefreshCw /></n-icon></template>
              刷新列表
            </n-button>
          </n-space>
        </n-card>
        
        <n-card title="常用流程" class="recent-card" style="margin-top: 16px;">
          <n-space vertical v-if="recentFlows.length">
            <div v-for="flow in recentFlows" :key="flow.id" class="flow-item" @click="viewFlow(flow)">
              <n-icon size="16"><GitBranch /></n-icon>
              <span class="flow-name">{{ flow.name || flow.id }}</span>
              <n-tag size="tiny" :type="getStatusType(flow.status)">{{ getStatusText(flow.status) }}</n-tag>
            </div>
          </n-space>
          <n-empty v-else description="暂无常用流程" size="small" />
        </n-card>
      </n-gi>
    </n-grid>
    
    <!-- 查看流程详情弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" :title="'流程详情 - ' + (currentFlow?.name || '')" :style="{ width: '700px' }">
      <n-descriptions label-placement="left" :column="2" size="small" bordered v-if="currentFlow">
        <n-descriptions-item label="流程名称">{{ currentFlow.name }}</n-descriptions-item>
        <n-descriptions-item label="流程Key">{{ currentFlow.id }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="getStatusType(currentFlow.status)" size="small">{{ getStatusText(currentFlow.status) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="版本">v{{ currentFlow.version || 1 }}</n-descriptions-item>
        <n-descriptions-item label="创建时间">{{ formatTime(currentFlow.createTime) }}</n-descriptions-item>
        <n-descriptions-item label="更新时间">{{ formatTime(currentFlow.updateTime) }}</n-descriptions-item>
        <n-descriptions-item label="描述" :span="2">{{ currentFlow.description || '-' }}</n-descriptions-item>
      </n-descriptions>
      
      <n-divider>流程信息</n-divider>
      <n-space vertical>
        <n-alert type="info">
          <template #header>操作提示</template>
          <div>点击"编辑流程"将打开流程设计器进行修改</div>
        </n-alert>
      </n-space>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
          <n-button type="primary" @click="handleEditFlow(currentFlow)">
            <template #icon><n-icon><Edit3 /></n-icon></template>
            编辑流程
          </n-button>
        </n-space>
      </template>
    </n-modal>
    
    <!-- 确认打开设计器弹窗 -->
    <n-modal v-model:show="showDesignerConfirmModal" preset="card" :title="designerTarget?.id ? '编辑流程' : '新建流程'" :style="{ width: '450px' }">
      <n-space vertical :size="16">
        <n-alert type="info">
          <template #header>即将打开流程设计器</template>
          <div v-if="designerTarget?.id">
            将编辑流程: <strong>{{ designerTarget.name || designerTarget.id }}</strong>
          </div>
          <div v-else>
            将创建新的审批流程
          </div>
        </n-alert>
        
        <n-form label-placement="left" label-width="100">
          <n-form-item v-if="!designerTarget?.id" label="流程名称">
            <n-input v-model:value="newFlowName" placeholder="请输入流程名称" />
          </n-form-item>
          <n-form-item v-if="!designerTarget?.id" label="流程Key">
            <n-input v-model:value="newFlowKey" placeholder="请输入流程Key（英文唯一标识）" />
          </n-form-item>
        </n-form>
      </n-space>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDesignerConfirmModal = false">取消</n-button>
          <n-button type="primary" @click="confirmOpenDesigner" :loading="opening">
            <template #icon><n-icon><ExternalLink /></n-icon></template>
            打开设计器
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NGrid, NGi, NSpace, NButton, NIcon, NInput, NTag, NModal, NDivider, NEmpty, NAlert, NForm, NFormItem, useMessage, useDialog } from 'naive-ui'
import { RefreshCw, Plus, GitBranch, Edit3, ExternalLink } from 'lucide-vue-next'
import type { User, WorkflowResponse, BpmnDesign } from '../types'

const props = defineProps<{
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: User
}>()

const emit = defineEmits<{
  (e: 'error', error: { code: string, message: string }): void
  (e: 'openDesigner', data: { flow?: BpmnDesign, flowName?: string, flowKey?: string }): void
  (e: 'navigate', page: string, data?: { flow?: BpmnDesign }): void
}>()

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const flows = ref<BpmnDesign[]>([])
const searchText = ref('')
const showDetailModal = ref(false)
const showDesignerConfirmModal = ref(false)
const currentFlow = ref<BpmnDesign | null>(null)
const designerTarget = ref<BpmnDesign | null>(null)
const opening = ref(false)
const newFlowName = ref('')
const newFlowKey = ref('')

const filteredFlows = computed(() => {
  if (!searchText.value) return flows.value
  const keyword = searchText.value.toLowerCase()
  return flows.value.filter(f => 
    (f.name?.toLowerCase().includes(keyword)) ||
    (f.id?.toLowerCase().includes(keyword))
  )
})

const activeCount = computed(() => flows.value.filter(f => f.status === 'active').length)
const disabledCount = computed(() => flows.value.filter(f => f.status === 'disabled').length)

const recentFlows = computed(() => flows.value.slice(0, 5))

onMounted(() => {
  loadFlows()
})

async function loadFlows() {
  loading.value = true
  try {
    const res = await props.apiRequest('listBpmn', {})
    if (res.success) {
      flows.value = res.data || []
    }
  } catch (e: any) {
    emit('error', { code: 'LOAD_ERROR', message: e.message })
  } finally {
    loading.value = false
  }
}

function handleCellClick({ row }: { row: BpmnDesign }) {
  // 可以在这里处理单元格点击事件
}

function viewFlow(flow: BpmnDesign) {
  currentFlow.value = flow
  showDetailModal.value = true
}

function handleCreateFlow() {
  designerTarget.value = null
  newFlowName.value = ''
  newFlowKey.value = ''
  showDesignerConfirmModal.value = true
}

function handleEditFlow(flow: BpmnDesign | null) {
  if (!flow) return
  emit('navigate', 'approvalDesigner', { flow })
}

function confirmOpenDesigner() {
  opening.value = true
  
  emit('openDesigner', {
    flow: designerTarget.value || undefined,
    flowName: newFlowName.value || (designerTarget.value?.name || '新流程'),
    flowKey: newFlowKey.value || designerTarget.value?.id
  })
  
  showDesignerConfirmModal.value = false
  opening.value = false
  message.success('正在打开流程设计器...')
}

function deleteFlow(flow: BpmnDesign) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除流程「${flow.name || flow.id}」吗？此操作不可恢复。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await props.apiRequest('deleteBpmn', { bpmnKey: flow.id })
        if (res.success) {
          message.success('删除成功')
          loadFlows()
        } else {
          message.error(res.message || '删除失败')
        }
      } catch (e: any) {
        message.error(e.message || '删除失败')
      }
    }
  })
}

function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function getStatusType(status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'disabled') return 'default'
  return 'default'
}

function getStatusText(status?: string): string {
  if (status === 'active') return '已启用'
  if (status === 'disabled') return '已禁用'
  return status
}
</script>

<style scoped>
.flow-manager {
  padding: 24px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.manager-grid {
  flex: 1;
  overflow: hidden;
}

.list-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-card :deep(.n-card__content) {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex: 1;
  min-height: 300px;
  margin-top: 16px;
}

.vxe-table {
  font-size: 14px;
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
  color: #18a058;
}

.stat-num.disabled {
  color: #999;
}

.action-card :deep(.n-card__content) {
  padding: 16px;
}

.recent-card :deep(.n-card__content) {
  max-height: 300px;
  overflow-y: auto;
}

.flow-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.flow-item:hover {
  background: #f0f5ff;
}

.flow-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}
</style>
