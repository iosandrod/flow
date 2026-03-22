<script setup lang="ts">
  import { reactive, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import { getDocumentValue, setDocumentValue } from '@/bo-utils/documentationUtil'
  import type { VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined

  const formData = reactive({ documentation: '' })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      formData.documentation = getDocumentValue(element) || ''
    })

  useElementUpdateListener(reloadData)

  const updateDoc = debounce(() => {
    if (!scopedElement) return
    setDocumentValue(scopedElement, formData.documentation || undefined)
  }, 300)

  watch(
    () => formData.documentation,
    () => updateDoc()
  )

  const items: VxeFormPropTypes.Items = [
    {
      field: 'documentation',
      title: t('panel.documentationBody'),
      span: 24,
      itemRender: {
        name: 'VxeTextarea'
      }
    }
  ]
</script>

<template>
  <n-collapse-item name="element-documentations">
    <template #header>
      <collapse-title :title="$t('panel.documentationSettings')">
        <lucide-icon name="FileText" />
      </collapse-title>
    </template>
    <vxe-form :data="formData" :items="items" title-width="120" />
  </n-collapse-item>
</template>
