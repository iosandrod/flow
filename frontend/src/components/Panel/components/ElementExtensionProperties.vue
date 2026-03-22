<script setup lang="ts">
  import { markRaw, nextTick, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import debounce from 'lodash.debounce'
  import useElementUpdateListener from '@/hooks/useElementUpdateListener'
  import catchUndefElement from '@/utils/CatchUndefElement'
  import {
    addExtensionProperty,
    getExtensionProperties,
    removeExtensionProperty
  } from '@/bo-utils/extensionPropertiesUtil'
  import type { VxeGridPropTypes, VxeFormPropTypes } from 'vxe-pc-ui'

  const { t } = useI18n()

  let scopedElement: BpmnElement | undefined
  let extensionsRaw: any[] = []

  const extensions = ref<any[]>([])
  const modalVisible = ref(false)

  const formData = reactive({ name: '', value: '' })

  const reloadData = () =>
    catchUndefElement((element) => {
      scopedElement = element
      extensionsRaw = markRaw(getExtensionProperties(element))
      extensions.value = extensionsRaw.map((item: any) => ({ ...item }))
    })

  useElementUpdateListener(reloadData)

  const removeProperty = (index: number) => {
    if (!scopedElement) return
    removeExtensionProperty(scopedElement, extensionsRaw[index])
    reloadData()
  }

  const saveProperty = debounce(() => {
    if (!scopedElement) return
    addExtensionProperty(scopedElement, { name: formData.name, value: formData.value })
    formData.name = ''
    formData.value = ''
    modalVisible.value = false
    reloadData()
  }, 300)

  const openModal = async () => {
    formData.name = ''
    formData.value = ''
    modalVisible.value = true
    await nextTick()
  }

  const columns: VxeGridPropTypes.Columns = [
    { type: 'seq', width: 50 },
    { field: 'name', title: t('panel.propertyName'), showOverflow: true },
    { field: 'value', title: t('panel.propertyValue'), showOverflow: true },
    {
      title: t('panel.operations'),
      width: 80,
      slots: { default: 'operations_default' }
    }
  ]

  const formItems: VxeFormPropTypes.Items = [
    {
      field: 'name',
      title: t('panel.propertyName'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    },
    {
      field: 'value',
      title: t('panel.propertyValue'),
      span: 24,
      itemRender: { name: 'VxeInput' }
    }
  ]
</script>

<template>
  <n-collapse-item name="element-extension-properties">
    <template #header>
      <collapse-title :title="$t('panel.extensionProperties')">
        <lucide-icon name="FileCog" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ extensions.length }}
      </n-tag>
    </template>

    <vxe-grid
      :data="extensions"
      :columns="columns"
      :max-height="200"
      :show-overflow="true"
      size="small"
    >
      <template #operations_default="{ $rowIndex }">
        <n-button quaternary size="small" type="error" @click="removeProperty($rowIndex)">
          {{ $t('panel.remove') }}
        </n-button>
      </template>
    </vxe-grid>

    <n-button type="info" class="inline-large-button" secondary @click="openModal">
      <lucide-icon :size="20" name="Plus" />
      <span>{{ $t('panel.addExtensionProperties') }}</span>
    </n-button>

    <n-modal
      v-model:show="modalVisible"
      preset="dialog"
      :title="$t('panel.addExtensionProperties')"
      :style="{ width: '640px' }"
    >
      <vxe-form :data="formData" :items="formItems" title-width="120" />
      <template #action>
        <n-button size="small" type="info" @click="saveProperty">{{
          $t('panel.confirm')
        }}</n-button>
      </template>
    </n-modal>
  </n-collapse-item>
</template>
