<template>
  <n-collapse-item name="element-task-definition">
    <template #header>
      <span>Task Definition</span>
    </template>

    <div v-if="isServiceTask">
      <n-form :model="taskDefinition">
        <n-form-item label="Type">
          <n-input v-model:value="taskDefinition.type" />
        </n-form-item>

        <n-form-item label="Retries">
          <n-input-number v-model:value="taskDefinition.retries" :min="0" />
        </n-form-item>
      </n-form>

      <n-button type="primary" size="small" style="margin-top: 10px" @click="updateTaskDefinition">
        Save
      </n-button>
    </div>

    <div v-else style="color: #999"> Only available for ServiceTask </div>
  </n-collapse-item>
</template>

<script lang="ts">
  import { h, defineComponent, toRaw, markRaw } from 'vue'
  import { mapState } from 'pinia'
  import modelerStore from '@/store/modeler'
  import { Element } from 'diagram-js/lib/model/Types'
  import {
    addExtensionProperty,
    addTaskDefinition,
    getExtensionProperties,
    removeExtensionProperty
  } from '@/bo-utils/extensionPropertiesUtil'

  export default defineComponent({
    name: 'ElementTaskDefinition',

    data() {
      return {
        taskDefinition: {
          type: '',
          retries: 3
        }
      }
    },

    computed: {
      ...mapState(modelerStore, ['getActive']),

      isServiceTask(): boolean {
        return this.getActive?.businessObject?.$type === 'bpmn:ServiceTask'
      }
    },

    watch: {
      getActive: {
        immediate: true,
        handler() {
          this.loadTaskDefinition()
        }
      }
    },

    methods: {
      loadTaskDefinition() {
        if (!this.isServiceTask) return

        const bo = this.getActive.businessObject
        const ext = bo.extensionElements

        if (!ext) {
          this.taskDefinition = { type: '', retries: 3 }
          return
        }

        const taskDef = ext.values?.find((e: any) => e.$type === 'zeebe:TaskDefinition')

        if (taskDef) {
          this.taskDefinition = {
            type: taskDef.type || '',
            retries: taskDef.retries || 3
          }
        }
      },

      updateTaskDefinition() {
        addTaskDefinition(this.getActive as any, this.taskDefinition) //
      }
    }
  })
</script>
