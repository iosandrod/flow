<script setup lang="ts">
  import { h, markRaw, nextTick, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import modeler from '@/store/modeler'
  import {
    addExecutionListener,
    getDefaultEvent,
    getExecutionListeners,
    getExecutionListenerType,
    getExecutionListenerTypes,
    removeExecutionListener,
    updateExecutionListener
  } from '@/bo-utils/executionListenersUtil'
  import { getScriptType } from '@/bo-utils/scriptUtil'
  import type { VxeGridPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined
  let listenersRaw: any[] = []

  const listeners = ref<any[]>([])
  const activeIndex = ref(-1)
  const modalVisible = ref(false)

  const scriptTypeOptions = reactive([
    { label: 'External Resource', value: 'external' },
    { label: 'Inline Script', value: 'inline' },
    { label: 'None', value: 'none' }
  ])

  const listenerTypeOptions = reactive([
    { label: 'Java Class', value: 'class' },
    { label: 'Expression', value: 'expression' },
    { label: 'DelegateExpression', value: 'delegateExpression' },
    { label: 'Script', value: 'script' }
  ])

  const listenerEventTypeOptions = reactive<{ label: string; value: string }[]>([])

  const formData = reactive<any>({
    event: '',
    type: 'class',
    class: '',
    expression: '',
    delegateExpression: '',
    script: { scriptFormat: '', scriptType: '', value: '', resource: '' }
  })

  const formVisible = reactive({
    class: true,
    expression: false,
    delegateExpression: false,
    script: false,
    scriptInline: false,
    scriptExternal: false
  })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      listenerEventTypeOptions.length = 0
      listenerEventTypeOptions.push(...getExecutionListenerTypes(element))
      listenersRaw = markRaw(getExecutionListeners(element))
      listeners.value = listenersRaw.map((item: any) => ({
        ...item,
        ...(item.script ? { script: { ...item.script } } : {}),
        type: getExecutionListenerType(item)
      }))
    })

  useElementUpdateListener(reloadData)

  const updateListenerType = (value: string) => {
    formData.type = value
    formVisible.class = value === 'class'
    formVisible.expression = value === 'expression'
    formVisible.delegateExpression = value === 'delegateExpression'
    formVisible.script = value === 'script'
    if (value === 'script') {
      formData.script.scriptType = formData.script.scriptType || 'none'
      formVisible.scriptInline = formData.script.scriptType === 'inline'
      formVisible.scriptExternal = formData.script.scriptType === 'external'
    }
  }

  const updateScriptType = (value: string) => {
    formData.script.scriptType = value
    formVisible.scriptInline = value === 'inline'
    formVisible.scriptExternal = value === 'external'
  }

  const saveListener = debounce(() => {
    if (!scopedElement) return
    if (activeIndex.value === -1) {
      addExecutionListener(scopedElement, { ...formData })
    } else {
      updateExecutionListener(scopedElement, { ...formData }, listenersRaw[activeIndex.value])
    }
    reloadData()
    modalVisible.value = false
  }, 300)

  const openModal = async (index: number, row?: any) => {
    activeIndex.value = index
    if (row) {
      Object.assign(formData, JSON.parse(JSON.stringify(row)))
    } else {
      Object.assign(formData, {
        event: getDefaultEvent(scopedElement!),
        type: 'class',
        class: '',
        expression: '',
        delegateExpression: '',
        script: { scriptFormat: '', scriptType: 'none', value: '', resource: '' }
      })
    }
    updateListenerType(formData.type)
    modalVisible.value = true
    await nextTick()
  }

  const removeListener = (index: number) => {
    if (!scopedElement) return
    removeExecutionListener(scopedElement, listenersRaw[index])
    reloadData()
  }

  const gridColumns: VxeGridPropTypes.Columns = [
    { type: 'seq', width: 50 },
    { field: 'event', title: t('panel.event'), showOverflow: true },
    { field: 'type', title: t('panel.type'), showOverflow: true },
    {
      title: t('panel.operations'),
      width: 120,
      slots: { default: 'operations_default' }
    }
  ]

  const gridData = listeners

  const formItems: any = [
    {
      field: 'event',
      title: t('panel.executionListenerEventType'),
      span: 24,
      itemRender: { name: 'VxeSelect', options: listenerEventTypeOptions }
    },
    {
      field: 'type',
      title: t('panel.executionListenerType'),
      span: 24,
      itemRender: {
        name: 'VxeSelect',
        options: listenerTypeOptions,
        events: { change: ({ value }: any) => updateListenerType(value) }
      }
    },
    {
      field: 'class',
      title: t('panel.javaClass'),
      span: 24,
      itemRender: { name: 'VxeInput' },
      visibleMethod: ({ data }: any) => data.type === 'class'
    },
    {
      field: 'expression',
      title: t('panel.expression'),
      span: 24,
      itemRender: { name: 'VxeInput' },
      visibleMethod: ({ data }: any) => data.type === 'expression'
    },
    {
      field: 'delegateExpression',
      title: t('panel.delegateExpression'),
      span: 24,
      itemRender: { name: 'VxeInput' },
      visibleMethod: ({ data }: any) => data.type === 'delegateExpression'
    },
    {
      field: 'script.scriptFormat',
      title: t('panel.scriptFormat'),
      span: 24,
      itemRender: { name: 'VxeInput' },
      visibleMethod: ({ data }: any) => data.type === 'script'
    },
    {
      field: 'script.scriptType',
      title: t('panel.scriptType'),
      span: 24,
      itemRender: {
        name: 'VxeSelect',
        options: scriptTypeOptions,
        events: { change: ({ value }: any) => updateScriptType(value) }
      },
      visibleMethod: ({ data }: any) => data.type === 'script'
    },
    {
      field: 'script.value',
      title: t('panel.scriptBody'),
      span: 24,
      itemRender: { name: 'VxeTextarea' },
      visibleMethod: ({ data }: any) =>
        data.type === 'script' && data.script?.scriptType === 'inline'
    },
    {
      field: 'script.resource',
      title: t('panel.scriptResource'),
      span: 24,
      itemRender: { name: 'VxeInput' },
      visibleMethod: ({ data }: any) =>
        data.type === 'script' && data.script?.scriptType === 'external'
    }
  ]

  const modalFormItems: VxeGridPropTypes.FormItems = formItems
</script>

<template>
  <n-collapse-item name="element-execution-listeners">
    <template #header>
      <collapse-title :title="$t('panel.executionListeners')">
        <lucide-icon name="Radio" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ listeners.length }}
      </n-tag>
    </template>

    <vxe-grid
      ref="gridRef"
      :data="gridData.value"
      :columns="gridColumns"
      :max-height="200"
      :show-overflow="true"
      size="small"
      :column-config="{ resizable: true }"
    >
      <template #operations_default="{ row, $rowIndex }">
        <n-button quaternary size="small" type="info" @click="openModal($rowIndex, row)">
          {{ $t('panel.edit') }}
        </n-button>
        <n-button quaternary size="small" type="error" @click="removeListener($rowIndex)">
          {{ $t('panel.remove') }}
        </n-button>
      </template>
    </vxe-grid>

    <n-button type="info" class="inline-large-button" secondary @click="openModal(-1)">
      <lucide-icon :size="20" name="Plus" />
      <span>{{ $t('panel.addExecutionListener') }}</span>
    </n-button>

    <n-modal
      v-model:show="modalVisible"
      preset="dialog"
      :title="$t('panel.addExecutionListener')"
      :style="{ width: '640px' }"
    >
      <vxe-form :data="formData" :items="modalFormItems" :rules="{}" title-width="140" />
      <template #action>
        <n-button size="small" type="info" @click="saveListener">{{
          $t('panel.confirm')
        }}</n-button>
      </template>
    </n-modal>
  </n-collapse-item>
</template>
