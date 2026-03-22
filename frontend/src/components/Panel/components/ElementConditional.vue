<script setup lang="ts">
  import { reactive, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import * as CU from '@/bo-utils/conditionUtil'
  import type { VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined

  const formData = reactive({
    variableName: '',
    variableEvents: '',
    conditionType: '',
    expression: '',
    language: '',
    scriptType: '',
    body: '',
    resource: ''
  })

  const varVisible = reactive({ value: false })
  const varEventVisible = reactive({ value: false })
  const conditionTypeOptions = reactive<Record<string, string>[]>([])
  const scriptTypeOptions = reactive<Record<string, string>[]>([
    { label: '外链脚本( External Resource )', value: 'external' },
    { label: '内联脚本( Inline Script )', value: 'inline' },
    { label: '无( None )', value: 'none' }
  ])

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element

      varVisible.value = CU.isConditionEventDefinition(element)
      if (varVisible.value) {
        varEventVisible.value = !CU.isExtendStartEvent(element)
        formData.variableName = CU.getVariableNameValue(element) || ''
        formData.variableEvents = CU.getVariableEventsValue(element) || ''
      }

      conditionTypeOptions.length = 0
      conditionTypeOptions.push(...CU.getConditionTypeOptions(element))

      formData.conditionType = CU.getConditionTypeValue(element) || ''
      formData.expression = CU.getConditionExpressionValue(element) || ''
      formData.language = CU.getConditionScriptLanguageValue(element) || ''
      formData.scriptType = CU.getConditionScriptTypeValue(element) || ''
      formData.body = CU.getConditionScriptBodyValue(element) || ''
      formData.resource = CU.getConditionScriptResourceValue(element) || ''
    })

  useElementUpdateListener(reloadData)

  const updateVariableName = debounce(() => {
    if (!scopedElement) return
    CU.setVariableNameValue(scopedElement, formData.variableName || undefined)
  }, 300)

  const updateVariableEvents = debounce(() => {
    if (!scopedElement) return
    CU.setVariableEventsValue(scopedElement, formData.variableEvents || undefined)
  }, 300)

  const updateConditionType = debounce(() => {
    if (!scopedElement) return
    CU.setConditionTypeValue(scopedElement, formData.conditionType)
  }, 300)

  const updateExpression = debounce(() => {
    if (!scopedElement) return
    CU.setConditionExpressionValue(scopedElement, formData.expression || undefined)
  }, 300)

  const updateLanguage = debounce(() => {
    if (!scopedElement) return
    CU.setConditionScriptLanguageValue(scopedElement, formData.language || undefined)
  }, 300)

  const updateScriptType = debounce(() => {
    if (!scopedElement) return
    CU.setConditionScriptTypeValue(scopedElement, formData.scriptType || undefined)
  }, 300)

  const updateBody = debounce(() => {
    if (!scopedElement) return
    CU.setConditionScriptBodyValue(scopedElement, formData.body || undefined)
  }, 300)

  const updateResource = debounce(() => {
    if (!scopedElement) return
    CU.setConditionScriptResourceValue(scopedElement, formData.resource || undefined)
  }, 300)

  watch(
    () => formData.variableName,
    () => updateVariableName()
  )
  watch(
    () => formData.variableEvents,
    () => updateVariableEvents()
  )
  watch(
    () => formData.conditionType,
    () => updateConditionType()
  )
  watch(
    () => formData.expression,
    () => updateExpression()
  )
  watch(
    () => formData.language,
    () => updateLanguage()
  )
  watch(
    () => formData.scriptType,
    () => updateScriptType()
  )
  watch(
    () => formData.body,
    () => updateBody()
  )
  watch(
    () => formData.resource,
    () => updateResource()
  )

  const items: VxeFormPropTypes.Items = [
    {
      field: 'variableName',
      title: t('panel.variableName'),
      span: 24,
      folding: true,
      itemRender: { name: 'VxeInput' },
      visible: varVisible.value
    },
    {
      field: 'variableEvents',
      title: t('panel.variableEvents'),
      span: 24,
      folding: true,
      itemRender: { name: 'VxeInput' },
      visible: varEventVisible.value
    },
    {
      field: 'conditionType',
      title: t('panel.conditionType'),
      span: 24,
      itemRender: {
        name: 'VxeSelect',
        options: conditionTypeOptions
      }
    },
    {
      field: 'expression',
      title: t('panel.conditionExpression'),
      span: 24,
      folding: true,
      itemRender: { name: 'VxeInput' },
      visibleMethod: ({ data }) => data.conditionType === 'expression'
    },
    {
      field: 'language',
      title: t('panel.scriptLanguage'),
      span: 24,
      folding: true,
      itemRender: { name: 'VxeInput' },
      visibleMethod: ({ data }) => data.conditionType === 'script'
    },
    {
      field: 'scriptType',
      title: t('panel.scriptType'),
      span: 24,
      folding: true,
      itemRender: {
        name: 'VxeSelect',
        options: scriptTypeOptions
      },
      visibleMethod: ({ data }) => data.conditionType === 'script'
    },
    {
      field: 'body',
      title: t('panel.scriptBody'),
      span: 24,
      folding: true,
      itemRender: { name: 'VxeTextarea' },
      visibleMethod: ({ data }) => data.conditionType === 'script' && data.scriptType === 'inline'
    },
    {
      field: 'resource',
      title: t('panel.scriptResource'),
      span: 24,
      folding: true,
      itemRender: { name: 'VxeInput' },
      visibleMethod: ({ data }) => data.conditionType === 'script' && data.scriptType === 'external'
    }
  ]
</script>

<template>
  <n-collapse-item name="element-conditional">
    <template #header>
      <collapse-title :title="$t('panel.conditionalSettings')">
        <lucide-icon name="ArrowLeftRight" />
      </collapse-title>
    </template>
    <vxe-form :data="formData" :items="items" title-width="120" />
  </n-collapse-item>
</template>
