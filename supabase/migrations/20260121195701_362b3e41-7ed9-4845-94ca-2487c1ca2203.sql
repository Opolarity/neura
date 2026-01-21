-- Force PostgREST to reload schema cache so it stops seeing old sp_get_terms overloads
NOTIFY pgrst, 'reload schema';