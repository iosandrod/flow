<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="流程管理"
    :style="{ width: '1000px' }"
    :mask-closable="false"
  >
    <n-space vertical :size="12">
      <n-space>
        <n-button size="small" @click="loadBpmns">
          <template #icon>
            <n-icon><RefreshCw /></n-icon>
          </template>
          刷新
        </n-button>
        <n-button type="primary" size="small" @click="openCreate">
          <template #icon>
            <n-icon><Plus /></n-icon>
          </template>
          新建流程
        </n-button>
        <n-button size="small" @click="loadBpmns">
          <template #icon>
            <n-icon><Upload /></n-icon>
          </template>
          导入BPMN
        </n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="bpmnList"
        :loading="loading"
        :row-key="(row: WfBpmn) => row.id"
        :pagination="{ pageSize: 10 }"
        size="small"
        striped
      />

      <n-empty v-if="!loading && bpmnList.length === 0" description="暂无流程定义" />
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="showModal = false">关闭</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal
    v-model:show="showCreateModal"
    preset="card"
    title="新建流程"
    :style="{ width: '500px' }"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="80px"
    >
      <n-form-item label="流程名称" path="name">
        <n-input v-model:value="formData.name" placeholder="请输入流程名称" />
      </n-form-item>
      <n-form-item label="流程Key" path="bpmnKey">
        <n-input v-model:value="formData.bpmnKey" placeholder="请输入唯一标识" />
      </n-form-item>
      <n-form-item label="BPMN XML" path="bpmnXml">
        <n-input
          v-model:value="formData.bpmnXml"
          type="textarea"
          :rows="10"
          placeholder="请输入BPMN XML内容"
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showCreateModal = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="handleCreate">保存</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal
    v-model:show="showStartModal"
    preset="card"
    title="发起流程"
    :style="{ width: '500px' }"
    :mask-closable="false"
  >
    <n-space vertical :size="12">
      <n-descriptions label-placement="left" :column="1" size="small">
        <n-descriptions-item label="流程名称">{{ selectedBpmn?.name }}</n-descriptions-item>
        <n-descriptions-item label="流程Key">{{ selectedBpmn?.bpmnKey }}</n-descriptions-item>
        <n-descriptions-item label="版本">v{{ selectedBpmn?.version }}</n-descriptions-item>
      </n-descriptions>

      <n-form
        ref="startFormRef"
        :model="startFormData"
        :rules="startRules"
        label-placement="left"
        label-width="80px"
      >
        <n-form-item label="业务Key" path="businessKey">
          <n-input v-model:value="startFormData.businessKey" placeholder="请输入业务唯一标识" />
        </n-form-item>
        <n-form-item label="发起人" path="starterId">
          <n-input v-model:value="startFormData.starterId" placeholder="请输入发起人ID" />
        </n-form-item>
      </n-form>
    </n-space>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showStartModal = false">取消</n-button>
        <n-button type="primary" :loading="starting" @click="handleStart">发起审批</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
  import { ref, h, onMounted } from 'vue'
  import {
    NModal,
    NButton,
    NSpace,
    NDataTable,
    NTag,
    NIcon,
    NEmpty,
    NForm,
    NFormItem,
    NInput,
    NDescriptions,
    NDescriptionsItem,
    useMessage,
    FormInst,
    FormRules
  } from 'naive-ui'
  import { RefreshCw, Plus, Upload } from 'lucide-vue-next'
  import { workflowApi, WfBpmn } from '@/services/workflow'

  const message = useMessage()

  const showModal = ref(false)
  const showCreateModal = ref(false)
  const showStartModal = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const starting = ref(false)
  const bpmnList = ref<WfBpmn[]>([])
  const selectedBpmn = ref<WfBpmn | null>(null)

  const formRef = ref<FormInst | null>(null)
  const startFormRef = ref<FormInst | null>(null)

  const formData = ref({
    name: '',
    bpmnKey: '',
    bpmnXml: ''
  })

  const startFormData = ref({
    businessKey: '',
    starterId: 'user1'
  })

  const rules: FormRules = {
    name: { required: true, message: '请输入流程名称', trigger: 'blur' },
    bpmnKey: { required: true, message: '请输入流程Key', trigger: 'blur' },
    bpmnXml: { required: true, message: '请输入BPMN XML', trigger: 'blur' }
  }

  const startRules: FormRules = {
    businessKey: { required: true, message: '请输入业务Key', trigger: 'blur' },
    starterId: { required: true, message: '请输入发起人', trigger: 'blur' }
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
      title: '更新时间',
      key: 'updateTime',
      render: (row: WfBpmn) => formatTime(row.updateTime)
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (row: WfBpmn) =>
        h(NSpace, { size: 'small' }, () => [
          h(
            NButton,
            { size: 'small', type: 'primary', onClick: () => openStart(row) },
            () => '发起'
          ),
          h(NButton, { size: 'small', onClick: () => viewXml(row) }, () => '查看'),
          h(
            NButton,
            { size: 'small', type: 'error', onClick: () => handleDelete(row) },
            () => '删除'
          )
        ])
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

  function openCreate() {
    formData.value = { name: '', bpmnKey: '', bpmnXml: '' }
    showCreateModal.value = true
  }

  async function handleCreate() {
    formRef.value?.validate(async (errors) => {
      if (errors) return
      saving.value = true
      try {
        const res = await workflowApi.createBpmn(
          formData.value.name,
          formData.value.bpmnKey,
          formData.value.bpmnXml
        )
        if (res.success) {
          message.success('创建成功')
          showCreateModal.value = false
          loadBpmns()
        } else {
          message.error(res.message || '创建失败')
        }
      } catch (e: any) {
        message.error(e.message || '创建失败')
      } finally {
        saving.value = false
      }
    })
  }

  function openStart(bpmn: WfBpmn) {
    selectedBpmn.value = bpmn
    startFormData.value = { businessKey: `biz_${Date.now()}`, starterId: 'user1' }
    showStartModal.value = true
  }

  async function handleStart() {
    if (!selectedBpmn.value) return
    startFormRef.value?.validate(async (errors) => {
      if (errors) return
      starting.value = true
      try {
        const res = await workflowApi.startWorkflow({
          bpmnKey: selectedBpmn.value!.bpmnKey,
          starterId: startFormData.value.starterId,
          businessKey: startFormData.value.businessKey,
          processName: selectedBpmn.value!.name,
          variables: {}
        })
        if (res.success) {
          message.success('流程已发起')
          showStartModal.value = false
        } else {
          message.error(res.message || '发起失败')
        }
      } catch (e: any) {
        message.error(e.message || '发起失败')
      } finally {
        starting.value = false
      }
    })
  }

  function viewXml(bpmn: WfBpmn) {
    const xmlWindow = window.open('', '_blank')
    if (xmlWindow) {
      xmlWindow.document.write(`<pre>${bpmn.bpmnXml}</pre>`)
    }
  }

  async function handleDelete(bpmn: WfBpmn) {
    try {
      const res = await workflowApi.deleteBpmn(bpmn.id)
      if (res.success) {
        message.success('删除成功')
        loadBpmns()
      } else {
        message.error(res.message || '删除失败')
      }
    } catch (e: any) {
      message.error(e.message || '删除失败')
    }
  }

  function open() {
    showModal.value = true
    loadBpmns()
  }

  defineExpose({ open })
</script>
