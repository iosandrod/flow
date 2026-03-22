<script setup lang="ts">
  import { reactive, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import { addTaskDefinition } from '@/bo-utils/extensionPropertiesUtil'
  import type { VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined

  const formData = reactive({ type: '', retries: 3 })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      const bo = getBusinessObject(element)
      if (!bo) {
        formData.type = ''
        formData.retries = 3
        return
      }
      const ext = bo.extensionElements
      if (!ext) {
        formData.type = ''
        formData.retries = 3
        return
      }
      const taskDef = ext.values?.find((e: any) => e.$type === 'zeebe:TaskDefinition')
      formData.type = taskDef?.type || ''
      formData.retries = taskDef?.retries ?? 3
    })

  useElementUpdateListener(reloadData)

  const updateTaskDef = debounce(() => {
    if (!scopedElement) return
    addTaskDefinition(scopedElement as any, { type: formData.type, retries: formData.retries })
  }, 300)

  watch(
    () => ({ ...formData }),
    () => updateTaskDef(),
    { deep: true }
  )

  const items: VxeFormPropTypes.Items = [
    {
      field: 'type',
      title: t('panel.taskDefinitionType'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'retries',
      title: t('panel.taskDefinitionRetries'),
      span: 24,
      itemRender: {
        name: 'VxeNumberInput',
        props: { min: 0 }
      }
    }
  ]
</script>

<template>
  <n-collapse-item name="element-task-definition">
    <template #header>
      <collapse-title :title="$t('panel.taskDefinition')">
        <lucide-icon name="FileCog" />
      </collapse-title>
    </template>
    <vxe-form :data="formData" :items="items" title-width="100" />
  </n-collapse-item>
</template>
