<script setup lang="ts">
  import { markRaw, nextTick, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import { addTaskHeader, getTaskHeaders, removeTaskHeader } from '@/bo-utils/taskHeadersUtil'
  import type { VxeGridPropTypes, VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined
  let headersRaw: any[] = []

  const headers = ref<any[]>([])
  const modalVisible = ref(false)

  const formData = reactive({ key: '', value: '' })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      headersRaw = markRaw(getTaskHeaders(element))
      headers.value = headersRaw.map((item: any) => ({ ...item }))
    })

  useElementUpdateListener(reloadData)

  const removeHeader = (index: number) => {
    if (!scopedElement) return
    removeTaskHeader(scopedElement, headersRaw[index])
    reloadData()
  }

  const saveHeader = debounce(() => {
    if (!scopedElement) return
    if (!formData.key || !formData.value) return
    addTaskHeader(scopedElement, { key: formData.key, value: formData.value })
    formData.key = ''
    formData.value = ''
    modalVisible.value = false
    reloadData()
  }, 300)

  const openModal = async () => {
    formData.key = ''
    formData.value = ''
    modalVisible.value = true
    await nextTick()
  }

  const columns: VxeGridPropTypes.Columns = [
    { type: 'seq', width: 50 },
    { field: 'key', title: t('panel.headerKey'), showOverflow: true },
    { field: 'value', title: t('panel.headerValue'), showOverflow: true },
    {
      title: t('panel.operations'),
      width: 80,
      slots: { default: 'operations_default' }
    }
  ]

  const formItems: VxeFormPropTypes.Items = [
    {
      field: 'key',
      title: t('panel.headerKey'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'value',
      title: t('panel.headerValue'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    }
  ]
</script>

<template>
  <n-collapse-item name="element-task-headers">
    <template #header>
      <collapse-title :title="$t('panel.taskHeaders')">
        <lucide-icon name="FileCog" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ headers.length }}
      </n-tag>
    </template>

    <vxe-grid
      :data="headers"
      :columns="columns"
      :max-height="200"
      :show-overflow="true"
      size="small"
    >
      <template #operations_default="{ $rowIndex }">
        <n-button quaternary size="small" type="error" @click="removeHeader($rowIndex)">
          {{ $t('panel.remove') }}
        </n-button>
      </template>
    </vxe-grid>

    <n-button type="info" class="inline-large-button" secondary @click="openModal">
      <lucide-icon :size="20" name="Plus" />
      <span>{{ $t('panel.addTaskHeader') }}</span>
    </n-button>

    <n-modal
      v-model:show="modalVisible"
      preset="dialog"
      :title="$t('panel.addTaskHeader')"
      :style="{ width: '640px' }"
    >
      <vxe-form :data="formData" :items="formItems" title-width="120" />
      <template #action>
        <n-button size="small" type="info" @click="saveHeader">{{ $t('panel.confirm') }}</n-button>
      </template>
    </n-modal>
  </n-collapse-item>
</template>
