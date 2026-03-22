<script setup lang="ts">
  import { reactive, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import modeler from '@/store/modeler'
  import {
    getExternalTaskValue,
    getRetryTimeCycleValue,
    retryTimeCycleVisible,
    setExternalTaskValue,
    setRetryTimeCycleValue,
    taskPriorityVisible
  } from '@/bo-utils/jobExecutionUtil'
  import type { VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined

  const formData = reactive({
    taskPriority: '',
    retryTimeCycle: ''
  })

  const tpVisible = reactive({ value: false })
  const rtVisible = reactive({ value: false })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      tpVisible.value = taskPriorityVisible(element)
      rtVisible.value = retryTimeCycleVisible(element)
      formData.taskPriority = getExternalTaskValue(element) || ''
      formData.retryTimeCycle = getRetryTimeCycleValue(element) || ''
    })

  useElementUpdateListener(reloadData)

  const updateJob = debounce(() => {
    if (!scopedElement) return
    if (tpVisible.value && formData.taskPriority !== undefined) {
      setExternalTaskValue(scopedElement, formData.taskPriority || undefined)
    }
    if (rtVisible.value && formData.retryTimeCycle !== undefined) {
      setRetryTimeCycleValue(scopedElement, formData.retryTimeCycle || undefined)
    }
  }, 300)

  watch(
    () => ({ ...formData }),
    () => updateJob(),
    { deep: true }
  )

  const items: VxeFormPropTypes.Items = [
    {
      field: 'taskPriority',
      title: t('panel.taskPriority'),
      span: 24,
      visible: tpVisible.value,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'retryTimeCycle',
      title: t('panel.retryTimeCycle'),
      span: 24,
      visible: rtVisible.value,
      itemRender: { name: 'VxeInput' }
    }
  ]
</script>

<template>
  <n-collapse-item name="element-external-task">
    <template #header>
      <collapse-title :title="$t('panel.executionJob')">
        <lucide-icon name="CalendarClock" />
      </collapse-title>
    </template>
    <vxe-form :data="formData" :items="items" title-width="100" />
  </n-collapse-item>
</template>
