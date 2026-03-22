<script setup lang="ts">
  import { reactive, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import modeler from '@/store/modeler'
  import { getNameValue, setNameValue } from '@/bo-utils/nameUtil'
  import { setIdValue } from '@/bo-utils/idUtil'
  import {
    getProcessExecutable,
    getProcessVersionTag,
    setProcessExecutable,
    setProcessVersionTag
  } from '@/bo-utils/processUtil'
  import type { VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined

  const formData = reactive({
    id: '',
    name: '',
    versionTag: '',
    isExecutable: true
  })

  const isProcess = reactive({ value: false })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      isProcess.value = element.type === 'bpmn:Process'
      formData.id = element.id
      formData.name = getNameValue(element) || ''
      if (isProcess.value) {
        formData.isExecutable = getProcessExecutable(element)
        formData.versionTag = getProcessVersionTag(element) || ''
      } else {
        formData.isExecutable = true
        formData.versionTag = ''
      }
    })

  useElementUpdateListener(reloadData)

  const updateName = debounce(() => {
    if (!scopedElement) return
    setNameValue(scopedElement, formData.name)
  }, 300)

  const updateId = debounce(() => {
    if (!scopedElement) return
    setIdValue(scopedElement, formData.id)
  }, 300)

  const updateVersion = debounce(() => {
    if (!scopedElement || !isProcess.value) return
    const reg = /((\d|([1-9](\d*))).){2}(\d|([1-9](\d*)))/
    if (reg.test(formData.versionTag)) {
      setProcessVersionTag(scopedElement, formData.versionTag)
    } else {
      window.__messageBox.error('版本号必须符合语义化版本2.0.0 要点')
    }
  }, 300)

  const updateExecutable = debounce(() => {
    if (!scopedElement || !isProcess.value) return
    setProcessExecutable(scopedElement, formData.isExecutable)
  }, 300)

  watch(
    () => formData.name,
    () => updateName()
  )
  watch(
    () => formData.id,
    () => updateId()
  )
  watch(
    () => formData.versionTag,
    () => updateVersion()
  )
  watch(
    () => formData.isExecutable,
    () => updateExecutable()
  )

  const items: VxeFormPropTypes.Items = [
    {
      field: 'id',
      title: t('panel.id'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'name',
      title: t('panel.name'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'versionTag',
      title: t('panel.version'),
      span: 24,
      folding: true,
      itemRender: { name: 'VxeInput' },
      visibleMethod: () => isProcess.value
    },
    {
      field: 'isExecutable',
      title: t('panel.executable'),
      span: 24,
      folding: true,
      itemRender: { name: 'VxeSwitch' },
      visibleMethod: () => isProcess.value
    }
  ]
</script>

<template>
  <n-collapse-item name="base-info">
    <template #header>
      <collapse-title :title="$t('panel.general')">
        <lucide-icon name="Info" />
      </collapse-title>
    </template>
    <vxe-form :data="formData" :items="items" title-width="80" />
  </n-collapse-item>
</template>
