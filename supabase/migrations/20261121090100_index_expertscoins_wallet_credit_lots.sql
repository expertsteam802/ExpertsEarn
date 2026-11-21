create index if not exists wallet_credit_lots_source_transaction_id_idx on public.wallet_credit_lots(source_transaction_id) where source_transaction_id is not null;
