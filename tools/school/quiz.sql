-- P4.15 local draft; after assignments.sql. Never an exposed production schema.
create table school_draft.quizzes (
 id uuid primary key, class_id uuid not null references school_draft.classes on delete cascade,
 title text not null check(length(trim(title)) between 1 and 80),
 phase text not null default 'lobby' check(phase in ('lobby','question','review','finished','cancelled')),
 round_index int not null default -1 check(round_index between -1 and 19),
 task_count int not null check(task_count between 1 and 20),
 seconds int not null check(seconds between 15 and 120),
 due_at timestamptz, expires_at timestamptz not null default clock_timestamp()+interval '2 hours',
 revision int not null default 0, content_version int not null,
 unique(id,class_id), check(round_index<task_count)
);
create table school_draft.quiz_material (
 quiz_id uuid primary key references school_draft.quizzes on delete cascade,
 code_hash text unique not null check(code_hash ~ '^[a-f0-9]{64}$'),
 digest text not null check(digest ~ '^[a-f0-9]{64}$'), items jsonb not null
);
create table school_draft.quiz_players (
 quiz_id uuid not null, class_id uuid not null, actor_id uuid not null,
 nickname text not null, ranking boolean not null default false,
 primary key(quiz_id,actor_id), unique(quiz_id,nickname),
 foreign key(quiz_id,class_id) references school_draft.quizzes(id,class_id) on delete cascade,
 foreign key(class_id,actor_id) references school_draft.class_members on delete cascade
);
create table school_draft.quiz_answers (
 quiz_id uuid not null, actor_id uuid not null, round_index int not null check(round_index between 0 and 19),
 answer text not null, correct boolean not null, at timestamptz not null default clock_timestamp(),
 primary key(quiz_id,actor_id,round_index),
 foreign key(quiz_id,actor_id) references school_draft.quiz_players on delete cascade
);
create function school_draft.quiz_allowed(q uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from school_draft.quizzes x join school_draft.classes c on c.id=x.class_id where x.id=q and not c.archived and
 (school_draft.teaches(c.id) or exists(select 1 from school_draft.quiz_players p where p.quiz_id=q and p.actor_id=school_draft.actor()))) $$;
create function school_draft.quiz_teacher(q uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from school_draft.quizzes where id=q and school_draft.teaches(class_id)) $$;
create function school_draft.quiz_member(q uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from school_draft.quizzes x join school_draft.classes c on c.id=x.class_id where x.id=q and not c.archived and school_draft.enrolled(c.id)) $$;
-- Code lookup is available only to the server and checks current enrollment before returning an ID.
create function school_draft.quiz_code(h text) returns uuid language sql stable security definer set search_path='' as $$
 select q.id from school_draft.quiz_material m join school_draft.quizzes q on q.id=m.quiz_id where m.code_hash=h and q.phase='lobby' and q.expires_at>clock_timestamp() and school_draft.quiz_member(q.id) $$;
create function school_draft.quiz_counts(q uuid) returns table(players int,answered int) language sql stable security definer set search_path='' as $$
 select (select count(*)::int from school_draft.quiz_players where quiz_id=q),
 (select count(*)::int from school_draft.quiz_answers a join school_draft.quizzes x on x.id=a.quiz_id where a.quiz_id=q and a.round_index=x.round_index)
 where school_draft.quiz_allowed(q) $$;
-- Only opted-in game nicknames, never account IDs/roster aliases, leave this aggregate.
create function school_draft.quiz_board(q uuid) returns table(nickname text,score int) language sql stable security definer set search_path='' as $$
 select p.nickname,count(a.quiz_id) filter(where a.correct)::int
 from school_draft.quizzes x join school_draft.quiz_players p on p.quiz_id=x.id
 left join school_draft.quiz_answers a on a.quiz_id=p.quiz_id and a.actor_id=p.actor_id and a.round_index<=x.round_index
 where x.id=q and x.phase in ('review','finished') and p.ranking and school_draft.quiz_allowed(q)
 group by p.nickname order by 2 desc,1 $$;
revoke all on function school_draft.quiz_allowed(uuid),school_draft.quiz_teacher(uuid),school_draft.quiz_member(uuid),school_draft.quiz_code(text),school_draft.quiz_counts(uuid),school_draft.quiz_board(uuid) from public;
grant execute on function school_draft.quiz_allowed(uuid),school_draft.quiz_teacher(uuid),school_draft.quiz_member(uuid) to harmonia_school_actor;
grant execute on function school_draft.quiz_code(text),school_draft.quiz_counts(uuid),school_draft.quiz_board(uuid) to harmonia_school_grader;

alter table school_draft.quizzes enable row level security;
alter table school_draft.quiz_material enable row level security;
alter table school_draft.quiz_players enable row level security;
alter table school_draft.quiz_answers enable row level security;
create policy quiz_read on school_draft.quizzes for select to harmonia_school_actor using(school_draft.quiz_allowed(id));
-- Joining needs metadata before the participant exists; only the server gets this policy.
create policy quiz_join_read on school_draft.quizzes for select to harmonia_school_grader using(school_draft.quiz_member(id));
create policy quiz_create on school_draft.quizzes for insert to harmonia_school_grader with check(school_draft.teaches(class_id));
-- Learner requests may expire a round using server/database time; they cannot select arbitrary state.
create policy quiz_update on school_draft.quizzes for update to harmonia_school_grader using(school_draft.quiz_allowed(id)) with check(school_draft.quiz_allowed(id));
create policy quiz_material_read on school_draft.quiz_material for select to harmonia_school_grader using(school_draft.quiz_allowed(quiz_id));
create policy quiz_material_create on school_draft.quiz_material for insert to harmonia_school_grader with check(school_draft.quiz_teacher(quiz_id));
create policy quiz_code_rotate on school_draft.quiz_material for update to harmonia_school_grader using(school_draft.quiz_teacher(quiz_id)) with check(school_draft.quiz_teacher(quiz_id));
create policy quiz_players_read on school_draft.quiz_players for select to harmonia_school_actor using(school_draft.quiz_allowed(quiz_id) and (actor_id=school_draft.actor() or school_draft.quiz_teacher(quiz_id)));
create policy quiz_join on school_draft.quiz_players for insert to harmonia_school_grader with check(actor_id=school_draft.actor() and school_draft.quiz_member(quiz_id));
create policy quiz_ranking on school_draft.quiz_players for update to harmonia_school_grader using(actor_id=school_draft.actor() and school_draft.quiz_allowed(quiz_id)) with check(actor_id=school_draft.actor() and school_draft.quiz_allowed(quiz_id));
create policy quiz_answer_read on school_draft.quiz_answers for select to harmonia_school_grader using(school_draft.quiz_allowed(quiz_id) and (actor_id=school_draft.actor() or
 (school_draft.quiz_teacher(quiz_id) and exists(select 1 from school_draft.quizzes q join school_draft.class_members m on m.class_id=q.class_id where q.id=quiz_id and q.phase='finished' and m.actor_id=quiz_answers.actor_id and m.sharing))));
create policy quiz_answer_insert on school_draft.quiz_answers for insert to harmonia_school_grader with check(actor_id=school_draft.actor() and school_draft.quiz_allowed(quiz_id));
grant select on school_draft.quizzes,school_draft.quiz_players to harmonia_school_actor;
grant select on school_draft.quiz_material,school_draft.quiz_answers to harmonia_school_grader;
grant insert on school_draft.quizzes,school_draft.quiz_material,school_draft.quiz_players,school_draft.quiz_answers to harmonia_school_grader;
grant update(phase,round_index,due_at,revision) on school_draft.quizzes to harmonia_school_grader;
grant update(code_hash) on school_draft.quiz_material to harmonia_school_grader;
grant update(ranking) on school_draft.quiz_players to harmonia_school_grader;
-- Count only, used before a participant exists. No roster or scores are returned.
create function school_draft.quiz_player_count(q uuid) returns int language sql stable security definer set search_path='' as $$
 select count(*)::int from school_draft.quiz_players where quiz_id=q and school_draft.quiz_member(q) $$;
revoke all on function school_draft.quiz_player_count(uuid) from public;
grant execute on function school_draft.quiz_player_count(uuid) to harmonia_school_grader;
