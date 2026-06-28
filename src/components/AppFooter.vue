<script setup lang="ts"></script>

<template>
  <footer class="app-footer">
    <p class="lede">
      Union-Find (disjoint-set union) keeps a partition of elements and answers
      <em>same set?</em> in near-constant amortized time once union-by-size and path
      compression are switched on.
    </p>
    <div class="meta">
      <a href="https://en.wikipedia.org/wiki/Disjoint-set_data_structure" rel="noopener noreferrer" target="_blank">
        About the structure
      </a>
      <span class="sep" aria-hidden="true">/</span>
      <a href="https://selim.services" rel="noopener noreferrer" target="_blank">selim.services</a>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
  flex-wrap: wrap;
  padding-top: var(--space-5);
  border-top: var(--border-hairline);
}

.lede {
  max-width: var(--measure);
  font-size: var(--fs--1);
  color: var(--c-muted);
  line-height: var(--lh-body);

  em {
    color: var(--c-ink);
    font-style: italic;
  }
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--fs--1);
  white-space: nowrap;

  .sep {
    color: var(--c-faint);
  }
}
</style>
