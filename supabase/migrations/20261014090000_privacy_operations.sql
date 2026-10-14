-- Service-only operations; no external provider requests or cron activation.
create function public.complete_privacy_external_erasure(job_id uuid, final_state text, evidence text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare old privacy_external_erasure;
begin
 if final_state not in ('completed','not_found') or evidence is null or length(btrim(evidence)) not between 8 and 1024 then raise exception 'Verified evidence required';end if;
 select * into strict old from privacy_external_erasure where id=job_id for update;
 if old.state in ('completed','not_found') then
  if old.state<>final_state or old.proof_reference<>evidence then raise exception 'Completion conflict';end if;
  return true;
 end if;
 update privacy_external_erasure set state=final_state,proof_reference=evidence,completed_at=now(),subject_reference=null where id=job_id;
 return true;
end $$;
create function public.privacy_retention_details() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare cutoff timestamptz:=now()-interval '12 months'; affected integer; total integer:=0; more boolean:=false; receipt_days integer;
begin
 -- Each category is bounded; subsequent calls drain the remaining backlog.
 delete from tutor_messages where id in(select id from tutor_messages where created_at<cutoff order by id limit 100);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 delete from tutor_conversations where id in(select id from tutor_conversations where updated_at<cutoff order by updated_at,id limit 100);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 -- A recently continued old conversation keeps its recent messages, but loses the old task answer/seed.
 update tutor_conversations set context=context||'{"context":null,"mode":"chat","hintLevel":null}'::jsonb
 where id in(select id from tutor_conversations where created_at<cutoff and context->'context'<>'null'::jsonb order by created_at,id limit 100);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 delete from content_reports where id in(select id from content_reports where received_at<cutoff order by received_at,id limit 100);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 delete from tutor_reports where id in(select id from tutor_reports where created_at<cutoff order by created_at,id limit 100);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 update tutor_requests set user_text='',result=null where id in(select id from tutor_requests where created_at<cutoff and (state<>'reserved' or lease_until<now()) and (user_text<>'' or result is not null) order by created_at,id limit 100);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 update access_grants set source=null where (user_id,client_id) in(select user_id,client_id from access_grants where created_at<cutoff and source is not null order by created_at,user_id,client_id limit 100);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 delete from cancellation_requests where id in(select id from cancellation_requests where received_at<cutoff and (hold_until is null or hold_until<now()) order by received_at,id limit 100);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 select (policy->>'receiptDays')::integer into strict receipt_days from privacy_policy where id;
 -- Pending external work and interrupted local deletions must remain recoverable.
 with done as(select id from privacy_erasure_receipts r where r.state='deleted' and r.deleted_at<now()-make_interval(days=>receipt_days) and not exists(select 1 from privacy_external_erasure e where e.receipt_id=r.id and e.state in ('pending','processing')) order by r.deleted_at,r.id limit 100), removed as(delete from privacy_external_erasure where receipt_id in(select id from done) returning receipt_id)
 delete from privacy_erasure_receipts where id in(select id from done);
 get diagnostics affected=row_count;total:=total+affected;more:=more or affected=100;
 return jsonb_build_object('changed',total,'more',more);
end $$;
-- A mixed transfer receipt can contain another subscriber's attributes; only export the allowlisted receipt fields.
create or replace function public.privacy_filter_billing(data jsonb,actor uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare key text; value jsonb; result jsonb:='{}'::jsonb;
begin
 for key,value in select * from jsonb_each(data) loop
  if key in ('app_user_id','original_app_user_id') then result:=result||jsonb_build_object(key,case when value#>>'{}'=actor::text then actor::text else 'other-account' end);
  elsif key in ('aliases','transferred_from','transferred_to') and jsonb_typeof(value)='array' then result:=result||jsonb_build_object(key,coalesce((select jsonb_agg(x.value) from jsonb_array_elements(value) x where x.value#>>'{}'=actor::text),'[]'::jsonb));
  elsif key='event' then result:=result||jsonb_build_object(key,privacy_filter_billing(value,actor));
  elsif key in ('api_version','id','type','event_timestamp_ms','product_id','entitlement_ids','period_type','purchased_at_ms','expiration_at_ms','environment','store','is_trial_conversion','cancel_reason','expiration_reason','is_family_share','country_code','currency','price','price_in_purchased_currency','renewal_number','transaction_id','original_transaction_id') then result:=result||jsonb_build_object(key,value);end if;
 end loop;return result;
end $$;
revoke all on function complete_privacy_external_erasure(uuid,text,text),privacy_retention_details() from public,anon,authenticated;
grant execute on function complete_privacy_external_erasure(uuid,text,text),privacy_retention_details() to service_role;
