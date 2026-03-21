# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Billetterie — variables d’environnement (sécurité)

| Variable                         | Obligatoire              | Description                                                                                 |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `TURNSTILE_SECRET_KEY`           | Non (recommandé en prod) | Clé **secrète** Cloudflare Turnstile ; si définie, `/api/hold-seats` exige un jeton valide. |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | Si Turnstile actif       | Clé **site** (publique) pour afficher le widget à l’étape 2 du formulaire.                  |

**Billet par email (Mailjet)** : déclenché quand la commande est **`paid`**, les sièges sont **`paid`**, et **`ticket_sent`** est encore **`false`**. Après envoi accepté par Mailjet, **`ticket_sent`** passe à **`true`** (anti double envoi). Déclencheur principal : le **webhook Stripe** `checkout.session.completed`. L’expéditeur doit être **validé** dans Mailjet.

Voir `supabase/RLS-recommendations.md` pour des pistes sur le Row Level Security.
