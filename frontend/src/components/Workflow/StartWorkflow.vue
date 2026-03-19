<template>
  <n-modal v-model:show="showModal" preset="card" title="发起审批流程" :style="{ width: '500px' }" :mask-closable="false">
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80px">
      <n-form-item label="流程" path="bpmnKey">
        <n-select v-model:value="formData.bpmnKey" placeholder="请选择流程" :options="bpmnOptions" />
      </n-form-item>
      <n-form-item label="业务Key" path="businessKey">
        <n-input v-model:value="formData.businessKey" placeholder="请输入业务唯一标识" />
      </n-form-item>
      <n-form-item label="申请金额" path="amount">
        <n-input-number v-model:value="formData.amount" :min="0" :step="100" style="width: 100%;" placeholder="请输入申请金额" />
      </n-form-item>
      <n-form-item label="申请人" path="applicant">
        <n-input v-model:value="formData.applicant" placeholder="请输入申请人" />
      </n-form-item>
      <n-form-item label="申请原因" path="reason">
        <n-input v-model:value="formData.reason" type="textarea" :rows="3" placeholder="请输入申请原因" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">发起审批</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NModal, NButton, NForm, NFormItem, NInput, NSelect, NInputNumber, NSpace, useMessage, FormInst, FormRules } from 'naive-ui'
import { workflowApi, getCurrentUser } from '@/services/workflow'

const message = useMessage()

const showModal = ref(false)
const loading = ref(false)
const formRef = ref<FormInst | null>(null)

const bpmnOptions = ref<{ label: string; value: string }[]>([])

const formData = ref({
  bpmnKey: 'approval-process',
  businessKey: '',
  amount: 5000,
  applicant: '',
  reason: ''
})

const rules: FormRules = {
  bpmnKey: { required: true, message: '请选择流程', trigger: 'change' },
  businessKey: { required: true, message: '请输入业务Key', trigger: 'blur' },
  amount: { required: true, type: 'number', message: '请输入金额', trigger: 'blur' },
  applicant: { required: true, message: '请输入申请人', trigger: 'blur' }
}

async function loadBpmns() {
  try {
    const res = await workflowApi.listBpmn()
    if (res.success && res.data) {
      bpmnOptions.value = res.data.map((b: any) => ({
        label: b.name || b.bpmnKey,
        value: b.bpmnKey
      }))
    }
  } catch (e: any) {
    message.error('加载流程列表失败')
  }
}

async function handleSubmit() {
  formRef.value?.validate(async (errors) => {
    if (errors) return
    
    loading.value = true
    try {
      const user = getCurrentUser()
      const res = await workflowApi.startWorkflow({
        bpmnKey: formData.value.bpmnKey,
        starterId: user?.User_Id || 'unknown',
        businessKey: formData.value.businessKey,
        processName: bpmnOptions.value.find(b => b.value === formData.value.bpmnKey)?.label || '审批流程',
        variables: {
          amount: formData.value.amount,
          applicant: formData.value.applicant,
          reason: formData.value.reason,
          _starterName: user?.UserTrueName || user?.UserName
        }
      })
      
      if (res.success) {
        message.success('流程已发起')
        showModal.value = false
        resetForm()
      } else {
        message.error(res.message || '发起失败')
      }
    } catch (e: any) {
      message.error(e.message || '发起失败')
    } finally {
      loading.value = false
    }
  })
}

function resetForm() {
  formData.value = {
    bpmnKey: 'approval-process',
    businessKey: `biz_${Date.now()}`,
    amount: 5000,
    applicant: getCurrentUser()?.UserTrueName || getCurrentUser()?.UserName || '',
    reason: ''
  }
}

function open() {
  resetForm()
  loadBpmns()
  showModal.value = true
}

defineExpose({ open })
</script>
