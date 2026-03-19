<template>
  <div class="approval-designer">
    <n-card title="审批设计器" class="designer-card">
      <n-space vertical :size="16">
        <n-alert type="info">
          审批设计器 - 可视化设计审批流程
        </n-alert>
        <n-empty description="审批设计器开发中..." />
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
  .approval-designer {
    height: 100%;
    padding: 16px;
  }

  .designer-card {
    height: 100%;
  }
</style>
