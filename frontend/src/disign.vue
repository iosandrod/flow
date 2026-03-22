<template>
  <NConfigProvider abstract :hljs="hljs" :component-options="{ DynamicInput: { buttonSize: 'small' } }">
    <NDialogProvider>
      <NMessageProvider>
        <div :class="computedClasses" id="designer-container">
          <Toolbar v-if="showToolbar" v-model:xml="processXml"></Toolbar>
          <div class="main-content">
            <Palette v-if="customPalette"></Palette>
            <Designer v-model:xml="processXml"></Designer>
            <Panel v-if="customPenal"></Panel>
            <div v-else class="camunda-penal" id="camunda-penal"></div>
          </div>
          <Setting v-model:settings="editorSettings"></Setting>
          <ContextMenu></ContextMenu>
        </div>
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui'

import { defaultSettings } from '@/config'
import type { EditorSettings } from 'types/editor/settings'

import Toolbar from '@/components/Toolbar'
import Palette from '@/components/Palette'
import Designer from '@/components/Designer'
import Panel from '@/components/Panel'
import Setting from '@/components/Setting'
import ContextMenu from '@/components/ContextMenu/index.vue'

hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)

const editorSettings = ref<EditorSettings>({ ...defaultSettings })

const processXml = ref<string | undefined>(undefined)

const customPalette = computed<boolean>(() => editorSettings.value.paletteMode === 'custom')
const customPenal = computed<boolean>(() => editorSettings.value.penalMode === 'custom')
const showToolbar = computed<boolean>(() => editorSettings.value.toolbar)

const computedClasses = computed<string>(() => {
  const baseClass = ['designer-container']
  customPalette.value && baseClass.push('designer-with-palette')
  customPenal.value && baseClass.push('designer-with-penal')
  editorSettings.value.bg === 'grid-image' && baseClass.push('designer-with-bg')
  editorSettings.value.bg === 'image' && baseClass.push('designer-with-image')

  return baseClass.join(' ')
})

onMounted(() => {
  document.body.addEventListener('contextmenu', function (ev: Event) {
    ev.preventDefault()
  })
})

async function openBpmnByKey(key: string, apiRequest: (action: string, data: any) => Promise<any>) {
  try {
    const result = await apiRequest('getBpmn', { key })
    if (result.success && result.data) {
      const xmlContent = result.data.bpmnXml || result.data.xml || result.data
      processXml.value = xmlContent
    }
  } catch (e) {
    console.error('openBpmnByKey failed:', e)
  }
}

defineExpose({ openBpmnByKey })
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body,
html,
#app,
.designer-container {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
