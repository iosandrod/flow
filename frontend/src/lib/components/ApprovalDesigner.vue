<template>
  <div class="approval-designer">
    <div class="designer-header">
      <n-space>
        <n-button @click="showSelectModal = true">
          <template #icon><n-icon>
              <FolderOpen />
            </n-icon></template>
          选择流程
        </n-button>
        <n-text v-if="selectedProcess" strong style="font-size: 16px">{{ selectedProcess.name }}</n-text>
        <n-tag v-if="selectedProcess" :type="selectedProcess.status === 'active' ? 'success' : 'default'">
          {{ selectedProcess.status === 'active' ? '已激活' : '草稿' }}
        </n-tag>
      </n-space>
      <n-space>
        <n-button type="primary" @click="handleSave" :loading="saving" :disabled="!selectedProcess">
          <template #icon><n-icon>
              <Save />
            </n-icon></template>
          保存
        </n-button>
      </n-space>
    </div>
    <div class="designer-body">
      <design ref="designRef"></design>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { h } from 'vue'
import { NSpace, NButton, NIcon, NText, NTag, NModal, NInput, NDataTable, NDataTableColumns, useMessage } from 'naive-ui'
import { FolderOpen, Save } from 'lucide-vue-next'
import type { User, WorkflowResponse } from '../types'
import design from '../../disign.vue'

const props = defineProps<{
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: User
  selectedFlow?: any
}>()

const emit = defineEmits<{
  (e: 'error', error: { code: string, message: string }): void
}>()

const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const showSelectModal = ref(false)
const searchKey = ref('')
const selectedProcess = ref<{ id: string; name: string; key: string; status: string } | null>(null)
const processList = ref<any[]>([])
const designRef = ref<InstanceType<typeof design> | null>(null)

watch(showSelectModal, (val) => {
  if (val && processList.value.length === 0) {
    loadProcessList()
  }
})

watch(() => props.selectedFlow, (newVal) => {
  if (newVal) {
    handleSelectRow(newVal)
  }
}, { immediate: true })

const columns: NDataTableColumns<any>[] = [
  { title: '流程名称', key: 'name', ellipsis: { tooltip: true } },
  { title: '流程Key', key: 'bpmnKey', width: 150 },
  {
    title: '状态', key: 'status', width: 100,
    render: (row) => h(NTag, { type: row.status === 'active' ? 'success' : 'default', size: 'small' },
      { default: () => row.status === 'active' ? '已激活' : '草稿' })
  },
  { title: '版本', key: 'version', width: 80 },
  {
    title: '操作', key: 'action', width: 80,
    render: (row) => h(NButton, { size: 'small', type: 'primary', onClick: () => handleSelectRow(row) }, { default: () => '选择' })
  }
]

async function loadProcessList() {
  loading.value = true
  try {
    const result = await props.apiRequest('listBpmn', { key: searchKey.value })
    if (result.success && result.data) {
      processList.value = Array.isArray(result.data) ? result.data : []
    } else {
      processList.value = []
    }
  } catch (error: any) {
    emit('error', { code: 'LOAD_FAILED', message: error.message })
    processList.value = []
  } finally {
    loading.value = false
  }
}

async function handleSelectRow(row: any) {
  const key = row.bpmnKey || row.id
  selectedProcess.value = {
    id: row.id,
    name: row.name || row.bpmnKey || row.id,
    key,
    status: row.status || 'draft'
  }
  showSelectModal.value = false

  if (designRef.value) {
    await designRef.value.openBpmnByKey(key, props.apiRequest)
    message.success('流程加载成功')
  }
}

async function handleSave() {
  saving.value = true
  try {
    const result = await props.apiRequest('updateBpmn', {
      key: selectedProcess.value?.key
    })
    if (result.success) {
      message.success('保存成功')
    } else {
      emit('error', { code: 'SAVE_FAILED', message: result.message || '保存失败' })
    }
  } catch (error: any) {
    emit('error', { code: 'SAVE_ERROR', message: error.message })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.approval-designer {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.designer-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.designer-palette {
  width: 0;
  overflow: hidden;
}

.designer-canvas {
  flex: 1;
  min-width: 0;
  background: #f5f7fa;
}

.designer-canvas :deep(.bpmn-canvas),
.designer-canvas :deep(.bpmn-js-canvas) {
  width: 100%;
  height: 100%;
}

.designer-properties {
  width: 300px;
  background: #fff;
  border-left: 1px solid #f0f0f0;
  overflow-y: auto;
  flex-shrink: 0;
}

.designer-properties :deep(.bio-properties-panel) {
  height: 100%;
}
</style>
