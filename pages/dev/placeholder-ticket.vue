<template>
  <main class="previewPage">
    <header class="previewPage__header">
      <h1>Preview billet et email de reference</h1>
      <p>Page disponible uniquement en local/dev.</p>
      <div class="previewPage__actions">
        <a href="/api/dev/placeholder-email" target="_blank" rel="noopener">Ouvrir email HTML</a>
        <a href="/api/dev/placeholder-ticket-pdf" target="_blank" rel="noopener">Ouvrir billet PDF</a>
      </div>
    </header>

    <section class="previewPage__section">
      <h2>Email HTML</h2>
      <iframe
        class="previewPage__frame"
        src="/api/dev/placeholder-email"
        title="Apercu email placeholder"
      />
    </section>

    <section class="previewPage__section">
      <h2>Billet PDF</h2>
      <iframe
        class="previewPage__frame previewPage__frame--pdf"
        src="/api/dev/placeholder-ticket-pdf"
        title="Apercu billet PDF placeholder"
      />
    </section>
  </main>
</template>

<style scoped lang="scss">
.previewPage {
  min-height: 100dvh;
  padding: 24px;
  display: grid;
  gap: 20px;
  background: #f8f9fa;
}

.previewPage__header h1 {
  margin: 0 0 8px;
}

.previewPage__header p {
  margin: 0 0 12px;
  color: #555;
}

.previewPage__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.previewPage__actions a {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  text-decoration: none;
  color: #111;
  background: #fff;
}

.previewPage__section {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
}

.previewPage__section h2 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.previewPage__frame {
  width: 100%;
  height: 65dvh;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
}

.previewPage__frame--pdf {
  height: 78dvh;
}
</style>
