<script setup lang="ts">
  import { reactive, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import editor from '@/store/editor'
  import modeler from '@/store/modeler'
  import {
    getACAfter,
    getACBefore,
    getACExclusive,
    setACAfter,
    setACBefore,
    setACExclusive
  } from '@/bo-utils/asynchronousContinuationsUtil'
  import type { VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined

  const formData = reactive({
    asyncBefore: false,
    asyncAfter: false,
    exclusive: false
  })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      formData.asyncBefore = getACBefore(element)
      formData.asyncAfter = getACAfter(element)
      formData.exclusive = getACExclusive(element)
    })

  useElementUpdateListener(reloadData)

  const updateAC = debounce(() => {
    if (!scopedElement) return
    const modeling = modeler().getModeling
    const prefix = editor().getProcessEngine
    modeling.updateModdleProperties(scopedElement, scopedElement.businessObject, {
      [`${prefix}:asyncBefore`]: formData.asyncBefore || undefined,
      [`${prefix}:async`]: undefined,
      [`${prefix}:asyncAfter`]: formData.asyncAfter || undefined,
      [`${prefix}:exclusive`]: formData.exclusive || undefined
    })
  }, 300)

  watch(
    () => [formData.asyncBefore, formData.asyncAfter, formData.exclusive],
    () => {
      if (formData.asyncBefore || formData.asyncAfter) {
        // exclusive field should always be available now
      }
      updateAC()
    }
  )

  const items: VxeFormPropTypes.Items = [
    {
      field: 'asyncBefore',
      title: t('panel.asyncBefore'),
      span: 24,
      itemRender: { name: 'VxeSwitch' }
    },
    {
      field: 'asyncAfter',
      title: t('panel.asyncAfter'),
      span: 24,
      itemRender: { name: 'VxeSwitch' }
    },
    {
      field: 'exclusive',
      title: t('panel.asyncExclusive'),
      span: 24,
      itemRender: { name: 'VxeSwitch' },
      visibleMethod: ({ data }) => data.asyncBefore || data.asyncAfter
    }
  ]
</script>

<template>
  <n-collapse-item name="element-async-continuations">
    <template #header>
      <collapse-title :title="$t('panel.asyncContinuations')">
        <lucide-icon name="Shuffle" />
      </collapse-title>
    </template>
    <vxe-form :data="formData" :items="items" title-width="120" />
  </n-collapse-item>
</template>
