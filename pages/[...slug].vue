<template>
  <NotFoundPage />
</template>

<script setup lang="ts">
import NotFoundPage from '~/components/errors/NotFoundPage.vue'

definePageMeta({
  pageTransition: { name: 'page-opacity', mode: 'out-in' }
})

setResponseStatus(404, 'Page introuvable')
</script>
