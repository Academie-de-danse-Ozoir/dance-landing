<template>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const orderId = route.query.order_id as string | undefined

  // ✅ ON GARDE LA COMMANDE
  if (process.client && orderId) {
    localStorage.setItem('order_id', orderId)
  }

  // 🔁 Retour home (UX fluide)
  router.replace('/')
})
</script>

<style scoped>
  .page {
   opacity: 0;
  }
</style>
