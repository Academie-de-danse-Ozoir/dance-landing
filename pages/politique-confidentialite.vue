<template>
  <LegalPageShell>
    <LegalDocument
      :title="doc.title"
      :intro="doc.intro"
      :updated-at="doc.updatedAt"
      :sections="doc.sections"
    />
  </LegalPageShell>
</template>

<script setup lang="ts">
import content from '../locales/fr.json'
import LegalPageShell from '../components/legal/LegalPageShell.vue'
import LegalDocument from '../components/legal/LegalDocument.vue'

const doc = content.legal.privacy
</script>
