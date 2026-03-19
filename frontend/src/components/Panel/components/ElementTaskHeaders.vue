<template>
  <n-collapse-item name="element-task-headers">
    <template #header>
      <collapse-title :title="$t('panel.taskHeaders')">
        <lucide-icon name="FileCog" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ headers.length }}
      </n-tag>
    </template>
    <div class="element-task-headers">
      <n-data-table size="small" max-height="20vh" :columns="columns" :data="headers" />

      <n-button type="info" class="inline-large-button" secondary @click="openHeaderModel">
        <lucide-icon :size="20" name="Plus" />
        <span>{{ $t('panel.addTaskHeader') }}</span>
      </n-button>
    </div>

    <n-modal
      v-model:show="modelVisible"
      preset="dialog"
      :title="$t('panel.addTaskHeader')"
      :style="{ width: '640px' }"
    >
      <n-form ref="formRef" :model="newHeader" :rules="rules" aria-modal="true">
        <n-form-item path="key" :label="$t('panel.headerKey')">
          <n-input v-model:value="newHeader.key" @keydown.enter.prevent />
        </n-form-item>
        <n-form-item path="value" :label="$t('panel.headerValue')">
          <n-input v-model:value="newHeader.value" @keydown.enter.prevent />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button size="small" type="info" @click="addHeader">{{ $t('panel.confirm') }}</n-button>
      </template>
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts">
  import { h, defineComponent, toRaw, markRaw } from 'vue'
  import { mapState } from 'pinia'
  import modelerStore from '@/store/modeler'
  import { Element } from 'diagram-js/lib/model/Types'
  import {
    addTaskHeader,
    getTaskHeaders,
    removeTaskHeader
  } from '@/bo-utils/taskHeadersUtil'

  import { FormInst, NButton } from 'naive-ui'
  import EventEmitter from '@/utils/EventEmitter'

  export default defineComponent({
    name: 'ElementTaskHeaders',
    data() {
      return {
        headers: [],
        headersRaw: [],
        newHeader: { key: '', value: '' },
        rules: {
          key: { required: true, message: 'Key不能为空', trigger: ['blur', 'change'] },
          value: { required: true, message: 'Value不能为空', trigger: ['blur', 'change'] }
        },
        modelVisible: false
      }
    },
    computed: {
      ...mapState(modelerStore, ['getActive', 'getActiveId']),
      columns() {
        return [
          {
            title: this.$t('panel.index'),
            key: 'index',
            render: (a, index) => index + 1,
            width: 60
          },
          {
            title: 'Key',
            key: 'key',
            ellipsis: {
              tooltip: true
            }
          },
          {
            title: 'Value',
            key: 'value',
            ellipsis: {
              tooltip: true
            }
          },
          {
            title: this.$t('panel.operations'),
            key: 'operation',
            width: 80,
            align: 'center',
            render: (row, index) =>
              h(
                NButton,
                {
                  quaternary: true,
                  size: 'small',
                  type: 'error',
                  onClick: () => this.removeHeader(index)
                },
                {
                  default: () => this.$t('panel.remove')
                }
              )
          }
        ]
      }
    },
    watch: {
      getActiveId: {
        immediate: true,
        handler() {
          this.reloadTaskHeaders()
        }
      }
    },
    mounted() {
      this.reloadTaskHeaders()
      EventEmitter.on('element-update', this.reloadTaskHeaders)
    },
    methods: {
      async reloadTaskHeaders() {
        this.modelVisible = false
        await this.$nextTick()
        this.newHeader = { key: '', value: '' }
        ;(this.headersRaw as any[]) = markRaw(getTaskHeaders(this.getActive as Element))
        this.headers = JSON.parse(JSON.stringify(this.headersRaw))
      },
      removeHeader(propIndex: number) {
        removeTaskHeader(this.getActive as Element, this.headersRaw[propIndex])
        this.reloadTaskHeaders()
      },
      async addHeader() {
        ;(this.$refs.formRef as FormInst).validate((errors) => {
          if (!errors) {
            addTaskHeader(this.getActive as Element, toRaw(this.newHeader))
            this.reloadTaskHeaders()
          }
        })
      },
      async openHeaderModel() {
        this.modelVisible = true
        await this.$nextTick()
        ;(this.$refs.formRef as FormInst).restoreValidation()
      }
    }
  })
</script>

<style scoped></style>
