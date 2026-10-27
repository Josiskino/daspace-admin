# DASpace — Espace d'administration

Interface d'administration de la plateforme immobilière DASpace : validation des
comptes annonceurs, modération des annonces et supervision de la plateforme.

Construite sur Vue 3, Vuetify 3 et le socle Vuexy ; elle consomme l'API Laravel
`daspace-api` (routes `/api/v1/admin`, réservées au rôle `admin`).

## Écrans

| Écran | Endpoint |
| --- | --- |
| Tableau de bord | `GET /admin/statistics` |
| Demandes de compte annonceur | `GET/PATCH /admin/advertiser-requests` |
| Annonces (modération) | `GET /admin/properties`, `PATCH /admin/properties/{id}/status` |
| Utilisateurs | `GET/PATCH/DELETE /admin/users` |
| Catégories | `GET /categories`, `POST /admin/categories` |
| Signalements | `GET/PATCH /admin/reports` |
| Messages de contact | `GET/PATCH /admin/contact-requests` |
| Paiements | `GET /admin/payments` |
| Journal des actions | `GET /admin/history` |

## Démarrage

```bash
cp .env.example .env   # renseigner l'URL de l'API
npm install
npm run dev            # http://localhost:5173
```

Côté API, l'origine de l'admin doit être autorisée par CORS (`ADMIN_URL`,
par défaut `http://localhost:5173`).

Seuls les comptes de rôle `admin` peuvent se connecter.

## Scripts

- `npm run dev` : serveur de développement
- `npm run build` : build de production dans `dist/`
- `npm run lint` : ESLint avec correction automatique
