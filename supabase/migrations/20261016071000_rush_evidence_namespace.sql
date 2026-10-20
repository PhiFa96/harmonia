-- Never let a submitted lesson ID occupy a canonical Rush receipt's namespace.
-- NOT VALID preserves any historical imports; it enforces every new insert/update.
alter table public.learning_events add constraint learning_event_reserved_rush_id check(client_id not like 'rush:%') not valid;
alter table public.rush_policy add check(policy ?& array['version','freeDaily','paidDaily','xpCap','minAnswerMs','difficultyEvery']);
