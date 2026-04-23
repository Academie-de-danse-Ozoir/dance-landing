<template>
  <main class="mailPreviewPage">
    <h1>Preview email de reference</h1>
    <p>Aucun envoi n est effectue depuis cette page. Usage local/dev uniquement.</p>

    <section class="mailPreviewPage__section">
      <h2>Rendu HTML de l email</h2>
      <iframe class="mailPreviewPage__frame" src="/api/dev/placeholder-email" title="Preview email HTML" />
    </section>

    <div class="mailPreviewPage__links">
      <a href="/dev/placeholder-ticket" target="_blank" rel="noopener">
        Ouvrir la page de preview visuelle
      </a>
      <a href="/api/dev/placeholder-email" target="_blank" rel="noopener">
        Ouvrir le HTML brut
      </a>
    </div>
  </main>
</template>

<script setup lang="ts">
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Not found' })
}
</script>

<style scoped lang="scss">
.mailPreviewPage {
  min-height: 100dvh;
  padding: 24px;
  max-width: 720px;
  margin: 0 auto;
}

h1 {
  margin: 0 0 8px;
}

p {
  margin: 0 0 16px;
  color: #555;
}

.mailPreviewPage__section {
  margin-top: 8px;
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
}

.mailPreviewPage__section h2 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.mailPreviewPage__frame {
  width: 100%;
  height: 78dvh;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
}

.mailPreviewPage__links {
  margin-top: 18px;
  display: grid;
  gap: 8px;
}

.mailPreviewPage__links a {
  color: #0d6efd;
  text-decoration: underline;
}
</style>
