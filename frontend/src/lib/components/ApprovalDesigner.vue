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
        <n-button @click="handleNewProcess">
          <template #icon><n-icon>
              <Plus />
            </n-icon></template>
          新建流程
        </n-button>
        <n-button type="primary" @click="handleSave" :loading="saving" :disabled="!selectedProcess">
          <template #icon><n-icon>
              <Save />
            </n-icon></template>
          保存
        </n-button>
      </n-space>
    </div>
    <div class="designer-body">
      <design></design>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { h } from 'vue'
import { NSpace, NButton, NIcon, NText, NTag, NModal, NInput, NDataTable, NDataTableColumns, useMessage } from 'naive-ui'
import { FolderOpen, Save, Plus } from 'lucide-vue-next'
import type { User, WorkflowResponse } from '../types'
import design from '../../disign.vue'
const props = defineProps<{
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: User
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
const paletteContainer = ref<HTMLElement | null>(null)
const canvasContainer = ref<HTMLElement | null>(null)
const propertiesContainer = ref<HTMLElement | null>(null)

let designerInstance: any = null

onMounted(() => {
  initDesigner()
})

onBeforeUnmount(() => {
  if (designerInstance) {
    designerInstance.destroy()
    designerInstance = null
  }
})

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

watch(showSelectModal, (val) => {
  if (val && processList.value.length === 0) {
    loadProcessList()
  }
})

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

function handleSelectRow(row: any) {
  selectedProcess.value = {
    id: row.id,
    name: row.name || row.bpmnKey,
    key: row.bpmnKey || row.id,
    status: row.status || 'draft'
  }
  showSelectModal.value = false
  loadProcessBpmn()
}

async function initDesigner() {
  if (!canvasContainer.value) return

  try {
    const ModelerClass = await import('bpmn-js/lib/Modeler').then(m => m.default)

    designerInstance = new ModelerClass({
      container: canvasContainer.value,
      keyboard: { bindTo: document }
    })

    const emptyBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/BPMN/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="开始" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

    await designerInstance.importXML(emptyBpmn)
    designerInstance.get('canvas')?.zoom('fit-viewport')
  } catch (err: any) {
    console.error('Init designer failed:', err)
  }
}

async function loadProcessBpmn() {
  if (!selectedProcess.value || !designerInstance) return

  loading.value = true
  try {
    const result = await props.apiRequest('getBpmn', { key: selectedProcess.value.key })
    if (!result.success || !result.data) {
      message.error('加载流程失败')
      return
    }

    const xml = result.data.bpmnXml || result.data.xml || result.data
    await designerInstance.importXML(xml)
    designerInstance.get('canvas')?.zoom('fit-viewport')
    message.success('流程加载成功')
  } catch (err: any) {
    message.error('解析流程图失败: ' + (err.message || ''))
  } finally {
    loading.value = false
  }
}

async function handleNewProcess() {
  const newBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="开始" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

  if (designerInstance) {
    await designerInstance.importXML(newBpmn)
    designerInstance.get('canvas')?.zoom('fit-viewport')
  }
}

async function handleSave() {
  if (!designerInstance) {
    message.warning('设计器未初始化')
    return
  }

  saving.value = true
  try {
    const { xml } = await designerInstance.saveXML({ format: true })

    if (selectedProcess.value) {
      const result = await props.apiRequest('updateBpmn', {
        key: selectedProcess.value.key,
        data: { bpmnXml: xml }
      })
      if (result.success) {
        message.success('保存成功')
      } else {
        emit('error', { code: 'SAVE_FAILED', message: result.message || '保存失败' })
      }
    } else {
      message.info('请先选择流程再保存')
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
