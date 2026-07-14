<template>
  <div>
    <h1>Nuxt module playground!</h1>
    <div v-if="data">
      Response from API: <pre>{{ data }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const logger = useLogger()
logger.info('Vue component mounted')

const { data } = await useFetch('/api/test')
</script>
