CREATE TABLE public.users (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL,
  email                   text        NOT NULL UNIQUE,
  password_hash           text        NOT NULL,
  account_type            account_type NOT NULL DEFAULT 'solo',
  phone                   text,
  address                 text,
  id_submitted            boolean     NOT NULL DEFAULT false,
  business_docs_submitted boolean     NOT NULL DEFAULT false,
  verified                boolean     NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now()
);
