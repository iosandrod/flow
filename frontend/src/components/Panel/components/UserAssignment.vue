<script setup lang="ts">
  import { reactive, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import editor from '@/store/editor'
  import modeler from '@/store/modeler'
  import type { VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined
  let scopedBO: any = undefined

  const formData = reactive({
    assignee: '',
    candidateUsers: '',
    candidateGroups: '',
    dueDate: '',
    followUpDate: '',
    priority: ''
  })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      scopedBO = getBusinessObject(element)
      if (!scopedBO) return
      const prefix = editor().getProcessEngine
      for (const key of Object.keys(formData) as (keyof typeof formData)[]) {
        formData[key] = scopedBO.get(`${prefix}:${key}`) || ''
      }
    })

  useElementUpdateListener(reloadData)

  const updateProp = debounce(() => {
    if (!scopedElement || !scopedBO) return
    const modeling = modeler().getModeling
    const prefix = editor().getProcessEngine
    const updates: Record<string, unknown> = {}
    for (const key of Object.keys(formData) as (keyof typeof formData)[]) {
      updates[`${prefix}:${key}`] = formData[key] || undefined
    }
    modeling.updateModdleProperties(scopedElement, scopedBO, updates)
  }, 300)

  watch(
    () => ({ ...formData }),
    () => updateProp(),
    { deep: true }
  )

  const items: VxeFormPropTypes.Items = [
    {
      field: 'assignee',
      title: t('panel.assignee'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'candidateUsers',
      title: t('panel.candidateUsers'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'candidateGroups',
      title: t('panel.candidateGroups'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'dueDate',
      title: t('panel.dueDate'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'followUpDate',
      title: t('panel.followUpDate'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'priority',
      title: t('panel.priority'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    }
  ]
</script>

<template>
  <n-collapse-item name="element-user-assignment">
    <template #header>
      <collapse-title title="用户分配">
        <lucide-icon name="Contact" />
      </collapse-title>
    </template>
    <vxe-form :data="formData" :items="items" title-width="100" />
  </n-collapse-item>
</template>
