<template />
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { STORAGE_ORDER_KEY } from '../constants'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const orderId = route.query.order_id as string | undefined
  if (orderId) {
    localStorage.setItem(STORAGE_ORDER_KEY, orderId)
  }
  router.replace('/')
})
</script>
