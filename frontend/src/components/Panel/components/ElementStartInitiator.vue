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

  const formData = reactive({ initiator: '' })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      scopedBO = getBusinessObject(element)
      if (!scopedBO) return
      const prefix = editor().getProcessEngine
      formData.initiator = scopedBO.get(`${prefix}:initiator`) || ''
    })

  useElementUpdateListener(reloadData)

  const updateInitiator = debounce(() => {
    if (!scopedElement || !scopedBO) return
    const modeling = modeler().getModeling
    const prefix = editor().getProcessEngine
    modeling.updateModdleProperties(scopedElement, scopedBO, {
      [`${prefix}:initiator`]: formData.initiator || undefined
    })
  }, 300)

  watch(
    () => formData.initiator,
    () => updateInitiator()
  )

  const items: VxeFormPropTypes.Items = [
    {
      field: 'initiator',
      title: t('panel.initiator'),
      span: 24,
      itemRender: {
        name: 'VxeInput'
      }
    }
  ]
</script>

<template>
  <n-collapse-item name="element-start-initiator">
    <template #header>
      <collapse-title :title="$t('panel.startInitiator')">
        <lucide-icon name="PlayCircle" />
      </collapse-title>
    </template>
    <vxe-form :data="formData" :items="items" title-width="100" />
  </n-collapse-item>
</template>
