<script>
  import { base } from "$app/paths";
  import "./layout.scss";
</script>

<div class="main-grid">
  <header class="main-grid__header">
    <a class="logo-link" href="{base}/"><h1>Notifier admin</h1></a>
  </header>
  <main class="main-grid__main">
    <slot />
  </main>
  <footer class="main-grid__footer">
  </footer>
</div>

<style>
  .main-grid {
    display: grid;
    grid-template-areas:
      "header"
      "main"
      "footer"
    ;
    grid-template-rows: auto 1fr auto;
    justify-items: stretch;
    width: 100%;
    padding: 0 10px;
    max-width: 1024px;
    margin: auto;
    min-height: 100vh;
    min-height: 100dvh;
  }
  .main-grid__header {
    grid-area: header;
  }
  .main-grid__main {
    grid-area: main;
  }
  .main-grid__footer {
    grid-area: footer;
  }
  .logo-link {
    color: var(--clr-txt);
    text-decoration: none;
  }
</style>