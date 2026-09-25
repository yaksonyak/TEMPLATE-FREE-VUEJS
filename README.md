# Utiliser le projet

Le [guide visuel](docs/index.html) présente les étapes avec des exemples.

## 1. Lancer le site

Dans le terminal, à la racine du projet :

```bash
npm install
npm run dev
```

Ouvrez l’adresse affichée, par exemple `http://localhost:5173`.

## 2. Connecter votre API

Copiez `.env.example` dans un fichier `.env`, puis remplacez l’adresse par celle de votre API :

```env
VITE_API_BASE_URL=https://votre-domaine.com/api
VITE_API_ENDPOINT_PRODUCTS=/products
```

Par exemple, si votre API est `https://api.maboutique.fr`, vous pouvez écrire :

```env
VITE_API_BASE_URL=https://api.maboutique.fr/api
```

Enregistrez `.env` et relancez `npm run dev`. En mode démo (`VITE_DEMO_MODE=true`), les pages d’exemple appellent l’API sans compte. Si votre API demande une connexion, mettez `VITE_DEMO_MODE=false`.

## 3. Exemple avec les produits

La page Produits demande les données à `GET /products`. L’API peut répondre ainsi :

```json
[
  { "id": 1, "name": "Cahier", "price": 3.5 }
]
```

Le tableau affiche les données reçues. Pour changer les champs du formulaire, ouvrez `src/views/demo/DemoResourceView.vue` et modifiez la configuration `produits`. Exemple :

```js
{ cle: 'name', label: 'Nom du produit' }
```

`cle` doit correspondre au nom du champ envoyé par votre API. Pour ajouter, modifier ou supprimer, l’API doit aussi accepter `POST`, `PUT /products/1` et `DELETE /products/1`.

### En cas d’erreur

- **Aucune donnée** : vérifiez l’adresse et la route dans `.env`.
- **Erreur CORS** : autorisez l’adresse de votre site dans les réglages de l’API.
- **Erreur 401** : l’API demande un compte ; désactivez le mode démo et connectez-vous.
