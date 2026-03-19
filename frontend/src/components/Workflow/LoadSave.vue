<template>
  <n-modal v-model:show="showSaveModal" preset="card" title="保存流程" :style="{ width: '500px' }" :mask-closable="false">
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80px">
      <n-form-item label="流程名称" path="name">
        <n-input v-model:value="formData.name" placeholder="请输入流程名称" />
      </n-form-item>
      <n-form-item label="流程Key" path="bpmnKey">
        <n-input v-model:value="formData.bpmnKey" placeholder="请输入唯一标识" />
      </n-form-item>
      <n-form-item label="描述" path="description">
        <n-input v-model:value="formData.description" type="textarea" placeholder="请输入流程描述" :rows="2" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showSaveModal = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="handleSave">保存</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal v-model:show="showLoadModal" preset="card" title="加载流程" :style="{ width: '800px' }" :mask-closable="false">
    <n-space vertical :size="12">
      <n-space>
        <n-button size="small" @click="loadBpmns">
          <template #icon>
            <n-icon>
              <RefreshCw />
            </n-icon>
          </template>
          刷新
        </n-button>
      </n-space>

      <n-data-table :columns="columns" :data="bpmnList" :loading="loading" :row-key="(row: WfBpmn) => row.id"
        :pagination="{ pageSize: 8 }" size="small" striped :single-line="false" />

      <n-empty v-if="!loading && bpmnList.length === 0" description="暂无可用流程" />
    </n-space>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showLoadModal = false">取消</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { NModal, NButton, NSpace, NDataTable, NTag, NIcon, NEmpty, NForm, NFormItem, NInput, useMessage, FormInst, FormRules } from 'naive-ui'
import { RefreshCw } from 'lucide-vue-next'
import { workflowApi, WfBpmn } from '@/services/workflow'
import modeler from '@/store/modeler'

const message = useMessage()
const modelerStore = modeler()

const showSaveModal = ref(false)
const showLoadModal = ref(false)
const saving = ref(false)
const loading = ref(false)
const bpmnList = ref<WfBpmn[]>([])

const formRef = ref<FormInst | null>(null)
const formData = ref({
  name: '',
  bpmnKey: '',
  description: ''
})

const rules: FormRules = {
  name: { required: true, message: '请输入流程名称', trigger: 'blur' },
  bpmnKey: { required: true, message: '请输入流程Key', trigger: 'blur' }
}

const columns = [
  {
    title: '流程名称',
    key: 'name'
  },
  {
    title: '流程Key',
    key: 'bpmnKey'
  },
  {
    title: '版本',
    key: 'version',
    render: (row: WfBpmn) => `v${row.version}`
  },
  {
    title: '创建时间',
    key: 'createTime',
    render: (row: WfBpmn) => formatTime(row.createTime)
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row: WfBpmn) => h(NButton, { size: 'small', type: 'primary', onClick: () => handleLoad(row) }, () => '加载')
  }
]

function formatTime(time?: string): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function loadBpmns() {
  loading.value = true
  try {
    const res = await workflowApi.listBpmn()
    if (res.success) {
      bpmnList.value = res.data || []
    } else {
      message.error(res.message || '加载失败')
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function openSave(xml?: string) {
  try {
    const result = await modelerStore.getModeler?.saveXML({})
    if (!result?.xml) {
      message.warning('请先绘制流程')
      return
    }
    formData.value = { name: '', bpmnKey: '', description: '' }
    showSaveModal.value = true
  } catch (e: any) {
    message.warning('请先绘制流程')
  }
}

async function handleSave() {
  const result = await modelerStore.getModeler?.saveXML({})
  const currentXml = result?.xml
  if (!currentXml) {
    message.warning('没有可保存的流程')
    return
  }

  formRef.value?.validate(async (errors) => {
    if (errors) return
    saving.value = true
    try {
      const res = await workflowApi.createBpmn(
        formData.value.name,
        formData.value.bpmnKey,
        currentXml
      )
      if (res.success) {
        message.success('保存成功')
        showSaveModal.value = false
      } else {
        message.error(res.message || '保存失败')
      }
    } catch (e: any) {
      message.error(e.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

function openLoad() {
  showLoadModal.value = true
  loadBpmns()
}

function handleLoad(bpmn: WfBpmn) {
  modelerStore.getModeler?.importXML(bpmn.bpmnXml)
  message.success(`已加载流程: ${bpmn.name}`)
  showLoadModal.value = false
}

defineExpose({
  openSave,
  openLoad
})
</script>
