ALTER TABLE reviews
  ADD COLUMN review_type VARCHAR(20)
    NOT NULL
    DEFAULT 'borrower_to_lister'
    CHECK (review_type IN ('borrower_to_lister', 'lister_to_borrower'));
