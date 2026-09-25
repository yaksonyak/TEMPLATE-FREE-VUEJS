<template>
  <div class="guide">
    <header class="guide-hero">
      <span class="eyebrow">Guide pratique</span>
      <h1>Connecter une API et créer un CRUD</h1>
      <p>Un exemple simple avec des produits. Suivez les étapes dans l’ordre et adaptez les noms à votre API.</p>
    </header>

    <nav class="guide-nav" aria-label="Sommaire du guide">
      <a href="#demarrer">Démarrer</a>
      <a href="#api">Connecter l’API</a>
      <a href="#service">Créer le service</a>
      <a href="#crud">Les 4 actions CRUD</a>
      <a href="#vue">Créer la page</a>
      <a href="#nouvelle-ressource">Ajouter une ressource</a>
      <a href="#verification">Vérifier</a>
      <a href="#git">Partager avec Git</a>
    </nav>

    <section id="demarrer" class="guide-section">
      <span class="step">01 · Démarrer</span>
      <h2>Lancer le projet</h2>
      <p>Dans le terminal, placez-vous dans le dossier du projet et lancez ces commandes :</p>
      <pre><code>npm install
npm run dev</code></pre>
      <p>Ouvrez l’adresse indiquée, par exemple <code>http://localhost:5173</code>.</p>
    </section>

    <section id="api" class="guide-section">
      <span class="step">02 · Connexion</span>
      <h2>Indiquer l’adresse de votre API</h2>
      <p>Copiez <code>.env.example</code> dans un fichier nommé <code>.env</code>. Dans <code>.env</code>, mettez le domaine de votre API et la route des produits :</p>
      <pre><code>VITE_API_BASE_URL=https://api.maboutique.fr/api
VITE_API_ENDPOINT_PRODUCTS=/products</code></pre>
      <p>Enregistrez puis relancez <code>npm run dev</code>. Le site appellera alors <code>https://api.maboutique.fr/api/products</code>.</p>
      <div class="note"><strong>À vérifier :</strong> l’API doit autoriser l’adresse du site (CORS). En mode démo, les pages font les requêtes sans jeton de connexion.</div>
    </section>

    <section id="service" class="guide-section">
      <span class="step">03 · Service API</span>
      <h2>Créer le service qui appelle l’API</h2>
      <p>Un service regroupe les appels réseau d’une ressource. Ce projet en a déjà un qui fonctionne pour Produits, Commandes et Clients : <code>src/services/demoResources.service.js</code>. Il réutilise <code>src/services/api.js</code> pour l’adresse de base, le jeton et les erreurs.</p>
      <p><strong>Déclarer les routes :</strong></p>
      <pre><code>const ENDPOINTS = {
  produits: import.meta.env.VITE_API_ENDPOINT_PRODUCTS || '/products',
  commandes: import.meta.env.VITE_API_ENDPOINT_ORDERS || '/orders',
  clients: import.meta.env.VITE_API_ENDPOINT_CUSTOMERS || '/customers',
}</code></pre>
      <p><strong>Ajouter les quatre fonctions :</strong> chacune utilise la méthode HTTP correspondante.</p>
      <pre><code>async lister(ressource, params = {}) {
  const reponse = await api.get(endpoint(ressource), { params })
  return normaliserListe(reponse, params)
},
async creer(ressource, donnees) {
  const reponse = await api.post(endpoint(ressource), donnees)
  return enveloppe(reponse)
},
async modifier(ressource, id, donnees) {
  const reponse = await api.put(endpoint(ressource, id), donnees)
  return enveloppe(reponse)
},
async supprimer(ressource, id) {
  const reponse = await api.delete(endpoint(ressource, id))
  return enveloppe(reponse)
},</code></pre>
      <p><code>GET</code> lit les données, <code>POST</code> en crée, <code>PUT</code> met à jour un élément et <code>DELETE</code> le supprime. La fonction <code>endpoint()</code> ajoute l’identifiant à la route pour <code>PUT</code> et <code>DELETE</code>. <code>enveloppe()</code> accepte une réponse sous <code>data</code> ou <code>donnees</code> ; <code>normaliserListe()</code> fournit toujours <code>{ elements, pagination }</code> à la page.</p>
      <p class="note"><strong>Nouvelle route :</strong> pour les catégories, ajoutez <code>categories: '/categories'</code> dans <code>ENDPOINTS</code>.</p>
    </section>

    <section id="crud" class="guide-section">
      <span class="step">04 · Exemple complet</span>
      <h2>Comprendre les 4 actions CRUD</h2>
      <p>CRUD signifie créer, lire, modifier et supprimer. Ici, on utilise un produit avec un identifiant, un nom, une catégorie, un prix et un stock.</p>
      <pre><code>{ "id": 1, "name": "Cahier", "category": "Papeterie", "price": 3.5, "stock": 20 }</code></pre>
      <p>La réponse peut aussi inclure les éléments et les informations de pagination :</p>
      <pre><code>{ "data": { "elements": [{ "id": 1, "name": "Cahier", "category": "Papeterie", "price": 3.5, "stock": 20 }], "pagination": { "page": 1, "par_page": 10, "total": 1, "total_pages": 1 } } }</code></pre>

      <div class="crud-list">
        <article class="crud-card">
          <span class="http get">READ · LIRE</span>
          <h3>1. Charger la liste</h3>
          <code class="route">GET /products</code>
          <p><code>created()</code> lance <code>charger()</code>. Celle-ci appelle <code>demoResourcesService.lister()</code>, puis range les réponses dans <code>lignes</code> et <code>pagination</code>.</p>
          <pre><code>const resultat = await demoResourcesService.lister(this.ressource, {
  page: this.page,
  par_page: this.taillePage,
  recherche: this.recherche || undefined,
})
this.lignes = resultat.elements
this.pagination = resultat.pagination</code></pre>
          <p class="file">Cette méthode se lance à l’ouverture et quand on change de page ou de recherche.</p>
        </article>
        <article class="crud-card">
          <span class="http post">CREATE · CRÉER</span>
          <h3>2. Ajouter un produit</h3>
          <code class="route">POST /products</code>
          <p>« Ajouter » ouvre le formulaire vide. <code>ouvrirFormulaire()</code> initialise chaque champ ; <code>v-model</code> conserve les saisies dans <code>formulaire</code>. <code>enregistrer()</code> appelle <code>creer()</code> :</p>
          <pre><code>{ "name": "Cahier", "category": "Papeterie", "price": 3.5, "stock": 20 }</code></pre>
          <pre><code>if (this.indexModification === null) {
  await demoResourcesService.creer(this.ressource, this.formulaire)
} else {
  await demoResourcesService.modifier(
    this.ressource,
    this.indexModification,
    this.formulaire,
  )
}
this.modalOuverte = false
await this.charger()</code></pre>
          <p>Le corps doit contenir les noms et types attendus par l’API. Après le succès, le formulaire se ferme et le tableau est rechargé.</p>
        </article>
        <article class="crud-card">
          <span class="http put">UPDATE · MODIFIER</span>
          <h3>3. Modifier un produit</h3>
          <code class="route">PUT /products/1</code>
          <p>Le bouton Modifier recopie la ligne dans le formulaire et conserve son <code>id</code> dans <code>indexModification</code>. <code>enregistrer()</code> appelle <code>modifier()</code>, qui envoie les nouvelles valeurs avec <code>PUT</code>.</p>
          <pre><code>this.indexModification = ligne.id
this.formulaire = Object.fromEntries(
  this.configuration.champs.map((champ) => [champ.cle, ligne[champ.cle] ?? '']),
)
this.modalOuverte = true</code></pre>
          <p class="file">Chaque élément doit avoir un champ <code>id</code>. Après le succès, le tableau est rechargé.</p>
        </article>
        <article class="crud-card">
          <span class="http delete">DELETE · SUPPRIMER</span>
          <h3>4. Supprimer un produit</h3>
          <code class="route">DELETE /products/1</code>
          <p>Après confirmation, <code>supprimer()</code> envoie l’<code>id</code> avec <code>DELETE</code>. La liste est ensuite rechargée.</p>
          <pre><code>await demoResourcesService.supprimer('produits', produit.id)
this.ligneASupprimer = null
await this.charger()</code></pre>
        </article>
      </div>

      <div class="flow"><strong>Le chemin des données :</strong> formulaire ou tableau → service Vue → API → réponse → tableau mis à jour.</div>
    </section>

    <section id="vue" class="guide-section">
      <span class="step">05 · Configurer la page Vue</span>
      <h2>Relier champs, formulaire et tableau</h2>
      <p>Dans <code>src/views/demo/DemoResourceView.vue</code>, <code>CONFIGURATIONS.produits</code> décrit les colonnes visibles et les champs du formulaire. Chaque <code>cle</code> doit correspondre au nom du champ renvoyé et accepté par votre API :</p>
      <pre><code>produits: {
  colonnes: ['Nom', 'Catégorie', 'Prix', 'Stock'],
  champs: [
    { cle: 'name', label: 'Nom', placeholder: 'Nom du produit' },
    { cle: 'category', label: 'Catégorie' },
    { cle: 'price', label: 'Prix', type: 'number' },
    { cle: 'stock', label: 'Stock', type: 'number' },
  ],
}</code></pre>
      <p>Le formulaire générique parcourt les champs avec <code>v-for</code> et lie chaque saisie à <code>formulaire[champ.cle]</code> grâce à <code>v-model</code>. Les alias de colonnes sont dans <code>CLES_COLONNES</code> : « Prix » peut ainsi lire <code>price</code> ou <code>prix</code>.</p>
      <p>Si votre API attend <code>nom</code> au lieu de <code>name</code>, changez la clé du champ et vérifiez l’alias utilisé pour afficher cette valeur.</p>
    </section>

    <section id="nouvelle-ressource" class="guide-section">
      <span class="step">06 · Nouvelle ressource</span>
      <h2>Ajouter une autre ressource</h2>
      <p>Pour ajouter une page « Catégories », faites ces trois changements :</p>
      <ol>
        <li>Dans <code>src/services/demoResources.service.js</code>, ajoutez <code>categories: '/categories'</code> dans <code>ENDPOINTS</code>.</li>
        <li>Dans <code>src/views/demo/DemoResourceView.vue</code>, ajoutez <code>categories</code> dans <code>CONFIGURATIONS</code>, avec ses colonnes et champs.</li>
        <li>Dans <code>src/layouts/TheSidebar.vue</code>, ajoutez le lien : <code>{ route: 'demo-ressource', params: { ressource: 'categories' }, libelle: 'Catégories', icone: 'liste' }</code>.</li>
      </ol>
      <p>La route Vue <code>demo/:ressource</code> existe déjà : le même écran réutilise alors le service pour l’affichage, la création, la modification et la suppression. Le lien doit être ajouté à <code>menuDemo</code> si vous utilisez la navigation de démonstration.</p>
    </section>

    <section id="verification" class="guide-section">
      <span class="step">07 · Vérification</span>
      <h2>Tester le CRUD de bout en bout</h2>
      <ol>
        <li>Ouvrez les outils du navigateur puis l’onglet Réseau (Network).</li>
        <li>Chargez Produits et vérifiez <code>GET /products</code>, le statut 200 et les données de la réponse.</li>
        <li>Ajoutez un produit, contrôlez <code>POST /products</code>, puis vérifiez qu’il apparaît.</li>
        <li>Modifiez-le, contrôlez <code>PUT /products/{id}</code> et vérifiez la nouvelle valeur.</li>
        <li>Supprimez-le, contrôlez <code>DELETE /products/{id}</code> et vérifiez sa disparition.</li>
      </ol>
      <p><code>401</code> signifie que l’API attend une authentification, <code>422</code> signale des données refusées, <code>404</code> indique une route incorrecte. Pour CORS, l’origine du site doit être autorisée côté serveur.</p>
    </section>

    <section id="git" class="guide-section">
      <span class="step">08 · Partage</span>
      <h2>Partager le code avec Git</h2>
      <p>Après avoir relié le projet à votre dépôt GitHub, envoyez vos changements avec :</p>
      <pre><code>git add .
git commit -m "Ajout de mon CRUD"
git push</code></pre>
      <div class="note"><strong>Important :</strong> partagez <code>.env.example</code>, mais pas votre fichier <code>.env</code>. Chaque personne doit y mettre l’adresse de sa propre API.</div>
    </section>

    <section class="guide-help">
      <h2>En cas de problème</h2>
      <p><strong>Le tableau est vide :</strong> vérifiez que <code>GET /products</code> renvoie une liste.</p>
      <p><strong>Erreur 404 :</strong> vérifiez l’adresse de base et la route dans <code>.env</code>.</p>
      <p><strong>Erreur CORS :</strong> demandez au responsable de l’API d’autoriser votre site.</p>
      <p><strong>Créer fonctionne mais modifier échoue :</strong> vérifiez que la réponse contient bien un <code>id</code>.</p>
    </section>
  </div>
</template>

<style scoped>
.guide { max-width: 1100px; margin: 0 auto; color: #213547; }
.guide-hero { padding: 32px; border-radius: 16px; color: white; background: linear-gradient(120deg, #35495e, #42b883); }
.eyebrow,.step { display: inline-block; margin-bottom: 8px; color: #2d8f67; font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.guide-hero .eyebrow { color: #d9fbe9; }
h1 { max-width: 760px; margin: 0; font-size: clamp(1.8rem, 4vw, 2.7rem); line-height: 1.12; }
.guide-hero p { max-width: 700px; margin: 14px 0 0; color: #e0f2e9; font-size: 1.05rem; }
.guide-nav { position: sticky; top: 64px; z-index: 1; display: flex; gap: 8px; overflow-x: auto; margin: 16px 0; padding: 10px; border: 1px solid #dce3ec; border-radius: 12px; background: #ffffffed; backdrop-filter: blur(8px); }
.guide-nav a { flex: 0 0 auto; padding: 7px 10px; border-radius: 8px; color: #334155; font-size: .88rem; font-weight: 650; text-decoration: none; }
.guide-nav a:hover { color: #0f5132; background: #e9f5ee; }
.guide-section,.guide-help { scroll-margin-top: 135px; margin: 16px 0; padding: 24px 28px; border: 1px solid #dce3ec; border-radius: 14px; background: white; box-shadow: 0 4px 14px #17203308; }
.guide-section h2,.guide-help h2 { margin: 0 0 10px; color: #35495e; font-size: 1.4rem; }
.guide-section p,.guide-help p { margin: 9px 0; line-height: 1.65; }
.guide code { padding: 2px 5px; border-radius: 4px; background: #eef2f7; font-size: .9em; }
.guide pre { overflow-x: auto; margin: 12px 0; padding: 15px 17px; border-radius: 9px; background: #111827; color: #f8fafc; line-height: 1.6; }
.guide pre code { padding: 0; background: transparent; color: inherit; font-size: .9rem; }
.note,.flow { margin-top: 14px; padding: 13px 16px; border-left: 4px solid #42b883; border-radius: 7px; background: #e8f8f0; line-height: 1.6; }
.crud-list { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin-top: 18px; }
.crud-card { padding: 18px; border: 1px solid #e2e8f0; border-radius: 11px; background: #fbfcfd; }
.crud-card h3 { margin: 10px 0 6px; font-size: 1.05rem; }
.crud-card p { font-size: .94rem; }
.crud-card .route { display: inline-block; margin: 4px 0; color: #35495e; font-weight: 700; }
.crud-card .file { color: #64748b; font-size: .85rem; }
.http { display: inline-flex; padding: 4px 8px; border-radius: 999px; font-size: .7rem; font-weight: 800; letter-spacing: .04em; }
.get { color: #075985; background: #e0f2fe; }.post { color: #166534; background: #dcfce7; }.put { color: #92400e; background: #fef3c7; }.delete { color: #991b1b; background: #fee2e2; }
ol { padding-left: 22px; } li { margin: 8px 0; line-height: 1.6; }
.guide-help { border-color: #b5e8cf; background: #f4fcf7; }
@media(max-width:700px) { .guide-hero { padding: 25px 21px; }.guide-section,.guide-help { padding: 20px; }.crud-list { grid-template-columns: 1fr; }.guide-nav { top: 56px; } }
</style>
