-- Idempotence webhooks Stripe : un événement ne doit être traité qu'une fois.
-- Exécuter dans le SQL Editor Supabase (service role / migrations).

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  id text PRIMARY KEY
);

COMMENT ON TABLE public.stripe_processed_events IS 'IDs d''événements Stripe déjà traités (checkout.session.completed, etc.).';

-- Accès uniquement via service role (clé serveur) — pas d’exposition anon.
-- Ne pas activer RLS avec politiques publiques sur cette table.
