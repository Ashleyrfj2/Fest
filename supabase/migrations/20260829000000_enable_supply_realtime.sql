-- The supply hook subscribes to postgres_changes, but clean local databases do
-- not publish application tables until they are explicitly added.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'supply_items'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.supply_items;
  END IF;
END;
$$;
