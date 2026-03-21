<template />
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Ne pas écraser localStorage avec seul l'order_id : la home a besoin du JSON complet
  // (orderToken, expiresAt, etc.) pour restaurer le timer. L'URL peut contenir order_id
  // pour debug, mais la session est déjà stockée avant la redirection Stripe.
  router.replace('/')
})
</script>
