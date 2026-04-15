<template />
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hasSeenPaymentResultPage = useState<boolean>('hasSeenPaymentResultPage', () => false)

onMounted(() => {
  hasSeenPaymentResultPage.value = true
  router.replace('/')
})
</script>
