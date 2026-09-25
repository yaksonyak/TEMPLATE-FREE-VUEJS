<template>
  <span
    class="app-loader"
    :class="tailleClasse"
    role="status"
    :aria-label="label"
  >
    <span class="app-loader__bar app-loader__bar--green" aria-hidden="true"></span>
    <span class="app-loader__bar app-loader__bar--gold" aria-hidden="true"></span>
    <span class="app-loader__bar app-loader__bar--red" aria-hidden="true"></span>
    <span class="sr-only">{{ label }}</span>
  </span>
</template>

<script>
export default {
  name: 'AppLoader',
  props: {
    taille: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v),
    },
    label: {
      type: String,
      default: 'Chargement en cours',
    },
  },
  computed: {
    tailleClasse() {
      return `app-loader--${this.taille}`
    },
  },
}
</script>

<style scoped>
.app-loader {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  vertical-align: middle;
}

.app-loader--sm {
  width: 16px;
  height: 16px;
}

.app-loader--md {
  width: 22px;
  height: 22px;
}

.app-loader--lg {
  width: 34px;
  height: 34px;
  gap: 4px;
}

.app-loader__bar {
  width: 4px;
  height: 68%;
  border-radius: 999px;
  animation: app-loader-pulse 0.9s ease-in-out infinite;
}

.app-loader--sm .app-loader__bar {
  width: 3px;
}

.app-loader--lg .app-loader__bar {
  width: 6px;
}

.app-loader__bar--green {
  background: var(--color-brand-green);
  animation-delay: -0.3s;
}

.app-loader__bar--gold {
  background: var(--color-brand-gold);
  animation-delay: -0.15s;
}

.app-loader__bar--red {
  background: var(--color-brand-red);
}

@keyframes app-loader-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scaleY(0.65);
  }
  50% {
    opacity: 1;
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-loader__bar {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
