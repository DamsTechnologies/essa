-- ============================================================
-- Migration 3: Safely migrate Competition → Events System
-- OLD TABLES ARE PRESERVED. Nothing is dropped.
-- All live votes and payments are copied, not moved.
-- ============================================================

-- 1. Add biography field to event_contestants (competition has it)
ALTER TABLE public.event_contestants
  ADD COLUMN IF NOT EXISTS biography TEXT;

-- 2. Add slug field to events table (for stable URL redirects)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 3. Run the full migration inside a safe transaction block
DO $$
DECLARE
  v_event_id        UUID;
  v_new_id          UUID;
  v_id_map          JSONB := '{}';
  v_contestant      RECORD;
  v_payment         RECORD;
  v_new_pay_id      UUID;
BEGIN

  -- ── GUARD: Don't run twice ─────────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM public.events WHERE slug = 'fashion-magazine-contest'
  ) THEN
    RAISE NOTICE 'Migration already applied. Skipping.';
    RETURN;
  END IF;

  -- ── STEP 1: Create the competition as an Event ─────────────────────────
  INSERT INTO public.events (
    title,
    description,
    category,
    slug,
    voting_type,
    status,
    vote_conversion_rate,
    min_vote_amount,
    payment_currency,
    -- ⚠️ IMPORTANT: After running this migration, go to your Supabase
    -- dashboard → Table Editor → events → find this row and paste
    -- your Paystack SECRET key into the paystack_secret_key column.
    paystack_secret_key,
    paystack_public_key
  ) VALUES (
    'Mass Communication Fashion Magazine Cover Contest',
    'Vote for your favorite fashion magazine cover contestant from ESTAM Mass Communication department.',
    'Fashion',
    'fashion-magazine-contest',
    'monetary',
    'live',
    100,   -- ₦100 = 1 vote
    100,   -- minimum ₦100
    'NGN',
    NULL,  -- ⚠️ Fill in your Paystack SECRET key after migration
    NULL   -- ⚠️ Fill in your Paystack PUBLIC key after migration
  )
  RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created event with ID: %', v_event_id;

  -- ── STEP 2: Copy all contestants and build old→new ID map ──────────────
  FOR v_contestant IN
    SELECT * FROM public.contestants ORDER BY created_at ASC
  LOOP
    INSERT INTO public.event_contestants (
      event_id,
      name,
      department,        -- was design_title in old system
      profile_image,     -- prefer profile_image, fallback to cover_image
      description,       -- was design_description
      biography,
      total_votes,
      is_active,
      slug,
      created_at,
      updated_at
    ) VALUES (
      v_event_id,
      v_contestant.name,
      v_contestant.design_title,
      COALESCE(v_contestant.profile_image, v_contestant.cover_image),
      v_contestant.design_description,
      v_contestant.biography,
      v_contestant.total_votes,
      v_contestant.is_active,
      v_contestant.slug,
      v_contestant.created_at,
      v_contestant.updated_at
    )
    RETURNING id INTO v_new_id;

    -- Map old contestant ID → new event_contestant ID
    v_id_map := v_id_map || jsonb_build_object(
      v_contestant.id::text,
      v_new_id::text
    );

    RAISE NOTICE 'Copied contestant: % (old: %, new: %)',
      v_contestant.name, v_contestant.id, v_new_id;
  END LOOP;

  -- ── STEP 3: Copy payments and their votes ─────────────────────────────
  FOR v_payment IN
    SELECT * FROM public.payments ORDER BY created_at ASC
  LOOP
    -- Look up the new event_contestant ID from our map
    v_new_id := (v_id_map ->> v_payment.contestant_id::text)::UUID;

    IF v_new_id IS NULL THEN
      RAISE WARNING 'Could not find mapping for contestant_id: %. Skipping payment: %',
        v_payment.contestant_id, v_payment.id;
      CONTINUE;
    END IF;

    -- Insert into event_payments
    INSERT INTO public.event_payments (
      event_id,
      contestant_id,
      email,
      voter_name,
      amount,
      votes_purchased,
      transaction_reference,
      payment_status,
      ip_address,
      device_metadata,
      verified_at,
      created_at
    ) VALUES (
      v_event_id,
      v_new_id,
      v_payment.email,
      v_payment.voter_name,
      v_payment.amount,
      v_payment.votes_purchased,
      -- Prefix reference so it never collides with new payments
      'migrated_' || v_payment.transaction_reference,
      v_payment.payment_status,
      v_payment.ip_address,
      v_payment.device_metadata,
      v_payment.verified_at,
      v_payment.created_at
    )
    RETURNING id INTO v_new_pay_id;

    -- Copy the vote records for this payment
    INSERT INTO public.event_monetary_votes (
      event_id,
      contestant_id,
      payment_id,
      votes_added,
      created_at
    )
    SELECT
      v_event_id,
      v_new_id,
      v_new_pay_id,
      v.votes_added,
      v.created_at
    FROM public.votes v
    WHERE v.payment_id = v_payment.id;

  END LOOP;

  RAISE NOTICE '✅ Migration complete! Competition event ID: %', v_event_id;
  RAISE NOTICE '⚠️  Remember to add your Paystack keys to this event in the dashboard.';

END $$;
