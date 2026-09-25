// eslint.config.js
// Analyse statique : détecte variables/imports inutilisés, erreurs de template Vue,
// composants non déclarés, etc.  →  npm run lint
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'docs/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      // Les composants communs sont enregistrés globalement (components/index.js)
      'vue/no-undef-components': ['error', { ignorePatterns: ['^App[A-Z]', '^Matricule', '^MotifRejet', '^StatCard$', '^BarChart$', '^Effectifs', '^Statistiques', '^Etablissement', '^EtatCivil', '^Inscription', '^EleveSearch', '^router-', '^Teleport$'] }],
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/attributes-order': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]
