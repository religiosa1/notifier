<h2>Welcome</h2>

<h3>Main admin functionality</h3>
<nav class="tile-nav">
  <a class="tile-nav__item" href="./send-notification">
    send notification
  </a>
  <a class="tile-nav__item" href="./auth-request">
    pending authorization requests
  </a>
</nav>

<h3>Permission settings</h3>
<nav class="tile-nav">
  <a class="tile-nav__item" href="./users">
    users
  </a>
  <a class="tile-nav__item" href="./groups">
    groups
  </a>
  <a class="tile-nav__item" href="./channels">
    channels
  </a>
</nav>

<style>
  .tile-nav {
    display: flex;
    gap: 1rem;
  }
  .tile-nav__item {
    background-color: var(--clr-hbg);
    display: inline-block;
    padding: 1rem;
    border-radius: 0.3rem;
    color: var(--clr-txt);
  }
</style>
