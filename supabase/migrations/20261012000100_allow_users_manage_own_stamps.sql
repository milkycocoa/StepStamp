do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'stamps'
      and policyname = 'Users can insert their own stamps'
  ) then
    create policy "Users can insert their own stamps"
      on public.stamps
      for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'stamps'
      and policyname = 'Users can delete their own stamps'
  ) then
    create policy "Users can delete their own stamps"
      on public.stamps
      for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;
