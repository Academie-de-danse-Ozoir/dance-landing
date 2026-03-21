# Recommandations RLS (Row Level Security) — Supabase

## Contexte

L’app Nuxt utilise la **clé `anon`** côté client pour Realtime (`seat`, `seat_reservation`) et la **service role** côté API Nitro pour les opérations sensibles (`hold_seats`, webhooks, etc.).

## Principes

1. **Tables lues en direct par le navigateur** (`seat`, éventuellement `seat_reservation`) : activer RLS avec des politiques **SELECT** strictes (ex. lecture seule, pas d’UPDATE/DELETE pour `anon`).
2. **Tables uniquement touchées par le backend** (`order`, tables de liaison) : RLS **activé** + **aucune politique pour `anon`** → seul `service_role` passe.
3. **Ne jamais** exposer la service role au client.

## Exemple (à adapter à vos noms de schéma)

```sql
ALTER TABLE public."order" ENABLE ROW LEVEL SECURITY;
-- Aucune policy pour anon → accès uniquement service_role.

ALTER TABLE public.seat ENABLE ROW LEVEL SECURITY;
CREATE POLICY seat_select_public ON public.seat FOR SELECT TO authenticated, anon USING (true);
-- Interdire INSERT/UPDATE/DELETE pour anon si ce n’est pas déjà le cas.
```

Tester chaque flux (carte des sièges, réservation, paiement) après activation.

## `stripe_processed_events`

Table réservée au backend ; pas de policy `anon`. Insert/lecture uniquement avec la clé service (déjà le cas si RLS sans policy pour anon).
