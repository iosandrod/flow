<template>
  <div class="process-viewer" ref="viewerRef">
    <div v-if="loading" class="viewer-loading">
      <n-spin size="large" />
      <span>加载流程图...</span>
    </div>
    <div v-else-if="error" class="viewer-error">
      <n-result status="error" title="加载失败" :description="error">
        <template #footer>
          <n-button @click="initDiagram">重试</n-button>
        </template>
      </n-result>
    </div>
    <div v-else class="viewer-container">
      <div class="viewer-toolbar">
        <n-space>
          <n-tag :bordered="false" type="info">
            <template #icon>
              <n-icon><GitBranch /></n-icon>
            </template>
            流程实例: {{ procInstId }}
          </n-tag>
        </n-space>
        <n-space>
          <n-tag :bordered="false" type="success">
            <template #icon><n-icon><Check /></n-icon></template>
            已完成
          </n-tag>
          <n-tag :bordered="false" type="info">
            <template #icon><n-icon><Clock /></n-icon></template>
            待审批
          </n-tag>
          <n-tag :bordered="false" type="error">
            <template #icon><n-icon><X /></n-icon></template>
            已拒绝
          </n-tag>
        </n-space>
      </div>
      <div ref="canvasRef" class="bpmn-canvas"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { NSpin, NResult, NButton, NTag, NSpace, NIcon } from 'naive-ui'
import { GitBranch, Check, Clock, X } from 'lucide-vue-next'
import BpmnViewer from 'bpmn-js/lib/Viewer'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'

interface NodeStatus {
  pending: string[]
  completed: string[]
  rejected: string[]
}

const NODE_COLORS = {
  completed: { fill: '#52c41a', stroke: '#389e0d' },
  pending: { fill: '#1890ff', stroke: '#096dd9' },
  rejected: { fill: '#ff4d4f', stroke: '#cf1322' }
}

const props = defineProps<{
  procInstId: string
  bpmnXml?: string
  nodeStatus?: NodeStatus
}>()

const emit = defineEmits<{
  (e: 'loaded'): void
  (e: 'error', message: string): void
}>()

const viewerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLDivElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
let viewer: BpmnViewer | null = null

onMounted(async () => {
  console.log('[ProcessViewer] Mounted')
  await nextTick()
  if (props.bpmnXml && props.procInstId) {
    await initDiagram()
  }
})

watch(
  () => [props.bpmnXml, props.nodeStatus, props.procInstId] as const,
  async ([newXml, newStatus, newProcInstId]) => {
    console.log('[ProcessViewer] Props changed:', { xml: !!newXml, status: !!newStatus, procInstId: newProcInstId })
    if (newXml && newProcInstId) {
      await nextTick()
      await initDiagram()
    }
  },
  { deep: true }
)

async function initDiagram() {
  console.log('[ProcessViewer] initDiagram called')
  
  if (!canvasRef.value) {
    console.log('[ProcessViewer] Canvas ref not ready, waiting...')
    await nextTick()
  }
  
  if (!canvasRef.value) {
    console.log('[ProcessViewer] Still no canvas ref')
    return
  }
  
  const xml = props.bpmnXml
  if (!xml) {
    error.value = '缺少流程定义XML'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    console.log('[ProcessViewer] Creating viewer...')
    
    if (viewer) {
      viewer.destroy()
      viewer = null
    }
    
    viewer = new BpmnViewer({
      container: canvasRef.value,
      keyboard: { bindTo: document }
    })
    
    console.log('[ProcessViewer] Viewer created, importing XML...')
    await viewer.importXML(xml)
    
    console.log('[ProcessViewer] XML imported successfully')
    
    const canvas = viewer.get('canvas')
    canvas.zoom('fit-viewport')
    
    if (props.nodeStatus) {
      applyNodeColors(props.nodeStatus)
    }
    
    emit('loaded')
    console.log('[ProcessViewer] Loaded successfully')
  } catch (e: any) {
    console.error('[ProcessViewer] Failed:', e)
    error.value = e.message || '加载流程图失败'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

function applyNodeColors(status: NodeStatus) {
  if (!viewer) {
    console.log('[ProcessViewer] No viewer, cannot apply colors')
    return
  }
  
  try {
    const elementRegistry = viewer.get('elementRegistry')
    const modeling = viewer.get('modeling')
    
    if (!elementRegistry || !modeling) {
      console.log('[ProcessViewer] Missing elementRegistry or modeling')
      return
    }
    
    const elements = elementRegistry.getAll()
    console.log('[ProcessViewer] Total elements:', elements.length)
    console.log('[ProcessViewer] Node status:', status)
    
    let coloredCount = 0
    elements.forEach((element: any) => {
      if (element.type === 'label' || element.type === 'bpmn:SequenceFlow') return
      
      const elementId = element.id
      console.log('[ProcessViewer] Checking element:', elementId)
      
      if (status.completed.includes(elementId)) {
        modeling.setColor(element, NODE_COLORS.completed)
        coloredCount++
        console.log('[ProcessViewer] Applied green to:', elementId)
      } else if (status.pending.includes(elementId)) {
        modeling.setColor(element, NODE_COLORS.pending)
        coloredCount++
        console.log('[ProcessViewer] Applied blue to:', elementId)
      } else if (status.rejected.includes(elementId)) {
        modeling.setColor(element, NODE_COLORS.rejected)
        coloredCount++
        console.log('[ProcessViewer] Applied red to:', elementId)
      }
    })
    
    console.log('[ProcessViewer] Colored elements:', coloredCount)
  } catch (e) {
    console.error('[ProcessViewer] Failed to apply colors:', e)
  }
}

function clearColors() {
  if (!viewer) return
  
  try {
    const elementRegistry = viewer.get('elementRegistry')
    const modeling = viewer.get('modeling')
    
    if (!elementRegistry || !modeling) return
    
    const elements = elementRegistry.getAll()
    elements.forEach((element: any) => {
      if (element.type !== 'label' && element.type !== 'bpmn:SequenceFlow') {
        modeling.setColor(element, { fill: undefined, stroke: undefined })
      }
    })
  } catch (e) {
    console.warn('[ProcessViewer] Failed to clear colors:', e)
  }
}

defineExpose({
  initDiagram,
  applyNodeColors,
  clearColors
})
</script>

<style scoped>
.process-viewer {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.viewer-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #666;
}

.viewer-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.bpmn-canvas {
  flex: 1;
  width: 100%;
  height: 400px;
  background: #fff;
  overflow: hidden;
}

.bpmn-canvas :deep(.bpmn-js-canvas) {
  width: 100%;
  height: 100%;
}

.bpmn-canvas :deep(.djs-palette) {
  display: none;
}

.bpmn-canvas :deep(.djs-container) {
  width: 100%;
  height: 100%;
}
</style>
