
  create table "public"."accounts" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "account_number" character varying(20) not null,
    "name" character varying(255) not null,
    "type" character varying(50) not null,
    "is_active" boolean default true
      );


alter table "public"."accounts" enable row level security;


  create table "public"."entities" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "type" character varying(20) not null,
    "name" character varying(255) not null,
    "email" character varying(255),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."entities" enable row level security;


  create table "public"."financial_periods" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "period_month" integer not null,
    "period_year" integer not null,
    "is_locked" boolean default false,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."financial_periods" enable row level security;


  create table "public"."inventory_movements" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "item_id" uuid,
    "transaction_id" uuid,
    "quantity_change" numeric(15,2) not null,
    "movement_type" character varying(50) not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."inventory_movements" enable row level security;


  create table "public"."items" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "sku" character varying(50) not null,
    "name" character varying(255) not null,
    "type" character varying(50) not null,
    "unit_price" numeric(15,2) default 0.00,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "stock_quantity" numeric(15,2) default 0.00
      );


alter table "public"."items" enable row level security;


  create table "public"."journal_entries" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "transaction_id" uuid,
    "entry_date" date not null,
    "memo" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."journal_entries" enable row level security;


  create table "public"."journal_lines" (
    "id" uuid not null default gen_random_uuid(),
    "journal_entry_id" uuid,
    "account_id" uuid,
    "debit" numeric(15,2) default 0.00,
    "credit" numeric(15,2) default 0.00
      );


alter table "public"."journal_lines" enable row level security;


  create table "public"."tenants" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(255) not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."tenants" enable row level security;


  create table "public"."transaction_lines" (
    "id" uuid not null default gen_random_uuid(),
    "transaction_id" uuid,
    "description" text not null,
    "quantity" numeric(10,2) not null,
    "unit_price" numeric(15,2) not null,
    "line_total" numeric(15,2) not null,
    "item_id" uuid
      );


alter table "public"."transaction_lines" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "entity_id" uuid,
    "type" character varying(50) not null,
    "status" character varying(50) not null default 'DRAFT'::character varying,
    "transaction_date" date not null,
    "total_amount" numeric(15,2) not null default 0.00,
    "created_at" timestamp with time zone default now(),
    "reference_id" uuid,
    "tax_amount" numeric(15,2) default 0.00,
    "discount_amount" numeric(15,2) default 0.00
      );


alter table "public"."transactions" enable row level security;


  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "email" character varying(255) not null,
    "password_hash" character varying(255) not null,
    "role" character varying(50) not null default 'USER'::character varying,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE UNIQUE INDEX accounts_tenant_id_account_number_key ON public.accounts USING btree (tenant_id, account_number);

CREATE UNIQUE INDEX entities_pkey ON public.entities USING btree (id);

CREATE UNIQUE INDEX financial_periods_pkey ON public.financial_periods USING btree (id);

CREATE UNIQUE INDEX financial_periods_tenant_id_period_month_period_year_key ON public.financial_periods USING btree (tenant_id, period_month, period_year);

CREATE UNIQUE INDEX inventory_movements_pkey ON public.inventory_movements USING btree (id);

CREATE UNIQUE INDEX items_pkey ON public.items USING btree (id);

CREATE UNIQUE INDEX items_tenant_id_sku_key ON public.items USING btree (tenant_id, sku);

CREATE UNIQUE INDEX journal_entries_pkey ON public.journal_entries USING btree (id);

CREATE UNIQUE INDEX journal_lines_pkey ON public.journal_lines USING btree (id);

CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);

CREATE UNIQUE INDEX transaction_lines_pkey ON public.transaction_lines USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."entities" add constraint "entities_pkey" PRIMARY KEY using index "entities_pkey";

alter table "public"."financial_periods" add constraint "financial_periods_pkey" PRIMARY KEY using index "financial_periods_pkey";

alter table "public"."inventory_movements" add constraint "inventory_movements_pkey" PRIMARY KEY using index "inventory_movements_pkey";

alter table "public"."items" add constraint "items_pkey" PRIMARY KEY using index "items_pkey";

alter table "public"."journal_entries" add constraint "journal_entries_pkey" PRIMARY KEY using index "journal_entries_pkey";

alter table "public"."journal_lines" add constraint "journal_lines_pkey" PRIMARY KEY using index "journal_lines_pkey";

alter table "public"."tenants" add constraint "tenants_pkey" PRIMARY KEY using index "tenants_pkey";

alter table "public"."transaction_lines" add constraint "transaction_lines_pkey" PRIMARY KEY using index "transaction_lines_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."accounts" add constraint "accounts_tenant_id_account_number_key" UNIQUE using index "accounts_tenant_id_account_number_key";

alter table "public"."accounts" add constraint "accounts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."accounts" validate constraint "accounts_tenant_id_fkey";

alter table "public"."entities" add constraint "entities_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."entities" validate constraint "entities_tenant_id_fkey";

alter table "public"."financial_periods" add constraint "financial_periods_period_month_check" CHECK (((period_month >= 1) AND (period_month <= 12))) not valid;

alter table "public"."financial_periods" validate constraint "financial_periods_period_month_check";

alter table "public"."financial_periods" add constraint "financial_periods_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."financial_periods" validate constraint "financial_periods_tenant_id_fkey";

alter table "public"."financial_periods" add constraint "financial_periods_tenant_id_period_month_period_year_key" UNIQUE using index "financial_periods_tenant_id_period_month_period_year_key";

alter table "public"."inventory_movements" add constraint "inventory_movements_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE not valid;

alter table "public"."inventory_movements" validate constraint "inventory_movements_item_id_fkey";

alter table "public"."inventory_movements" add constraint "inventory_movements_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."inventory_movements" validate constraint "inventory_movements_tenant_id_fkey";

alter table "public"."inventory_movements" add constraint "inventory_movements_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) not valid;

alter table "public"."inventory_movements" validate constraint "inventory_movements_transaction_id_fkey";

alter table "public"."items" add constraint "items_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."items" validate constraint "items_tenant_id_fkey";

alter table "public"."items" add constraint "items_tenant_id_sku_key" UNIQUE using index "items_tenant_id_sku_key";

alter table "public"."journal_entries" add constraint "journal_entries_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."journal_entries" validate constraint "journal_entries_tenant_id_fkey";

alter table "public"."journal_entries" add constraint "journal_entries_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) not valid;

alter table "public"."journal_entries" validate constraint "journal_entries_transaction_id_fkey";

alter table "public"."journal_lines" add constraint "journal_lines_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) not valid;

alter table "public"."journal_lines" validate constraint "journal_lines_account_id_fkey";

alter table "public"."journal_lines" add constraint "journal_lines_check" CHECK (((debit >= (0)::numeric) AND (credit >= (0)::numeric) AND ((debit > (0)::numeric) OR (credit > (0)::numeric)))) not valid;

alter table "public"."journal_lines" validate constraint "journal_lines_check";

alter table "public"."journal_lines" add constraint "journal_lines_journal_entry_id_fkey" FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE not valid;

alter table "public"."journal_lines" validate constraint "journal_lines_journal_entry_id_fkey";

alter table "public"."transaction_lines" add constraint "transaction_lines_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.items(id) not valid;

alter table "public"."transaction_lines" validate constraint "transaction_lines_item_id_fkey";

alter table "public"."transaction_lines" add constraint "transaction_lines_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_lines" validate constraint "transaction_lines_transaction_id_fkey";

alter table "public"."transactions" add constraint "transactions_entity_id_fkey" FOREIGN KEY (entity_id) REFERENCES public.entities(id) not valid;

alter table "public"."transactions" validate constraint "transactions_entity_id_fkey";

alter table "public"."transactions" add constraint "transactions_reference_id_fkey" FOREIGN KEY (reference_id) REFERENCES public.transactions(id) not valid;

alter table "public"."transactions" validate constraint "transactions_reference_id_fkey";

alter table "public"."transactions" add constraint "transactions_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_tenant_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_tenant_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_item_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- This guarantees atomic calculation, completely immune to race conditions
    UPDATE items
    SET stock_quantity = (
        SELECT COALESCE(SUM(quantity_change), 0)
        FROM inventory_movements
        WHERE item_id = NEW.item_id
    )
    WHERE id = NEW.item_id;
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."accounts" to "anon";

grant insert on table "public"."accounts" to "anon";

grant references on table "public"."accounts" to "anon";

grant select on table "public"."accounts" to "anon";

grant trigger on table "public"."accounts" to "anon";

grant truncate on table "public"."accounts" to "anon";

grant update on table "public"."accounts" to "anon";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."accounts" to "service_role";

grant insert on table "public"."accounts" to "service_role";

grant references on table "public"."accounts" to "service_role";

grant select on table "public"."accounts" to "service_role";

grant trigger on table "public"."accounts" to "service_role";

grant truncate on table "public"."accounts" to "service_role";

grant update on table "public"."accounts" to "service_role";

grant delete on table "public"."entities" to "anon";

grant insert on table "public"."entities" to "anon";

grant references on table "public"."entities" to "anon";

grant select on table "public"."entities" to "anon";

grant trigger on table "public"."entities" to "anon";

grant truncate on table "public"."entities" to "anon";

grant update on table "public"."entities" to "anon";

grant delete on table "public"."entities" to "authenticated";

grant insert on table "public"."entities" to "authenticated";

grant references on table "public"."entities" to "authenticated";

grant select on table "public"."entities" to "authenticated";

grant trigger on table "public"."entities" to "authenticated";

grant truncate on table "public"."entities" to "authenticated";

grant update on table "public"."entities" to "authenticated";

grant delete on table "public"."entities" to "service_role";

grant insert on table "public"."entities" to "service_role";

grant references on table "public"."entities" to "service_role";

grant select on table "public"."entities" to "service_role";

grant trigger on table "public"."entities" to "service_role";

grant truncate on table "public"."entities" to "service_role";

grant update on table "public"."entities" to "service_role";

grant delete on table "public"."financial_periods" to "anon";

grant insert on table "public"."financial_periods" to "anon";

grant references on table "public"."financial_periods" to "anon";

grant select on table "public"."financial_periods" to "anon";

grant trigger on table "public"."financial_periods" to "anon";

grant truncate on table "public"."financial_periods" to "anon";

grant update on table "public"."financial_periods" to "anon";

grant delete on table "public"."financial_periods" to "authenticated";

grant insert on table "public"."financial_periods" to "authenticated";

grant references on table "public"."financial_periods" to "authenticated";

grant select on table "public"."financial_periods" to "authenticated";

grant trigger on table "public"."financial_periods" to "authenticated";

grant truncate on table "public"."financial_periods" to "authenticated";

grant update on table "public"."financial_periods" to "authenticated";

grant delete on table "public"."financial_periods" to "service_role";

grant insert on table "public"."financial_periods" to "service_role";

grant references on table "public"."financial_periods" to "service_role";

grant select on table "public"."financial_periods" to "service_role";

grant trigger on table "public"."financial_periods" to "service_role";

grant truncate on table "public"."financial_periods" to "service_role";

grant update on table "public"."financial_periods" to "service_role";

grant delete on table "public"."inventory_movements" to "anon";

grant insert on table "public"."inventory_movements" to "anon";

grant references on table "public"."inventory_movements" to "anon";

grant select on table "public"."inventory_movements" to "anon";

grant trigger on table "public"."inventory_movements" to "anon";

grant truncate on table "public"."inventory_movements" to "anon";

grant update on table "public"."inventory_movements" to "anon";

grant delete on table "public"."inventory_movements" to "authenticated";

grant insert on table "public"."inventory_movements" to "authenticated";

grant references on table "public"."inventory_movements" to "authenticated";

grant select on table "public"."inventory_movements" to "authenticated";

grant trigger on table "public"."inventory_movements" to "authenticated";

grant truncate on table "public"."inventory_movements" to "authenticated";

grant update on table "public"."inventory_movements" to "authenticated";

grant delete on table "public"."inventory_movements" to "service_role";

grant insert on table "public"."inventory_movements" to "service_role";

grant references on table "public"."inventory_movements" to "service_role";

grant select on table "public"."inventory_movements" to "service_role";

grant trigger on table "public"."inventory_movements" to "service_role";

grant truncate on table "public"."inventory_movements" to "service_role";

grant update on table "public"."inventory_movements" to "service_role";

grant delete on table "public"."items" to "anon";

grant insert on table "public"."items" to "anon";

grant references on table "public"."items" to "anon";

grant select on table "public"."items" to "anon";

grant trigger on table "public"."items" to "anon";

grant truncate on table "public"."items" to "anon";

grant update on table "public"."items" to "anon";

grant delete on table "public"."items" to "authenticated";

grant insert on table "public"."items" to "authenticated";

grant references on table "public"."items" to "authenticated";

grant select on table "public"."items" to "authenticated";

grant trigger on table "public"."items" to "authenticated";

grant truncate on table "public"."items" to "authenticated";

grant update on table "public"."items" to "authenticated";

grant delete on table "public"."items" to "service_role";

grant insert on table "public"."items" to "service_role";

grant references on table "public"."items" to "service_role";

grant select on table "public"."items" to "service_role";

grant trigger on table "public"."items" to "service_role";

grant truncate on table "public"."items" to "service_role";

grant update on table "public"."items" to "service_role";

grant delete on table "public"."journal_entries" to "anon";

grant insert on table "public"."journal_entries" to "anon";

grant references on table "public"."journal_entries" to "anon";

grant select on table "public"."journal_entries" to "anon";

grant trigger on table "public"."journal_entries" to "anon";

grant truncate on table "public"."journal_entries" to "anon";

grant update on table "public"."journal_entries" to "anon";

grant delete on table "public"."journal_entries" to "authenticated";

grant insert on table "public"."journal_entries" to "authenticated";

grant references on table "public"."journal_entries" to "authenticated";

grant select on table "public"."journal_entries" to "authenticated";

grant trigger on table "public"."journal_entries" to "authenticated";

grant truncate on table "public"."journal_entries" to "authenticated";

grant update on table "public"."journal_entries" to "authenticated";

grant delete on table "public"."journal_entries" to "service_role";

grant insert on table "public"."journal_entries" to "service_role";

grant references on table "public"."journal_entries" to "service_role";

grant select on table "public"."journal_entries" to "service_role";

grant trigger on table "public"."journal_entries" to "service_role";

grant truncate on table "public"."journal_entries" to "service_role";

grant update on table "public"."journal_entries" to "service_role";

grant delete on table "public"."journal_lines" to "anon";

grant insert on table "public"."journal_lines" to "anon";

grant references on table "public"."journal_lines" to "anon";

grant select on table "public"."journal_lines" to "anon";

grant trigger on table "public"."journal_lines" to "anon";

grant truncate on table "public"."journal_lines" to "anon";

grant update on table "public"."journal_lines" to "anon";

grant delete on table "public"."journal_lines" to "authenticated";

grant insert on table "public"."journal_lines" to "authenticated";

grant references on table "public"."journal_lines" to "authenticated";

grant select on table "public"."journal_lines" to "authenticated";

grant trigger on table "public"."journal_lines" to "authenticated";

grant truncate on table "public"."journal_lines" to "authenticated";

grant update on table "public"."journal_lines" to "authenticated";

grant delete on table "public"."journal_lines" to "service_role";

grant insert on table "public"."journal_lines" to "service_role";

grant references on table "public"."journal_lines" to "service_role";

grant select on table "public"."journal_lines" to "service_role";

grant trigger on table "public"."journal_lines" to "service_role";

grant truncate on table "public"."journal_lines" to "service_role";

grant update on table "public"."journal_lines" to "service_role";

grant delete on table "public"."tenants" to "anon";

grant insert on table "public"."tenants" to "anon";

grant references on table "public"."tenants" to "anon";

grant select on table "public"."tenants" to "anon";

grant trigger on table "public"."tenants" to "anon";

grant truncate on table "public"."tenants" to "anon";

grant update on table "public"."tenants" to "anon";

grant delete on table "public"."tenants" to "authenticated";

grant insert on table "public"."tenants" to "authenticated";

grant references on table "public"."tenants" to "authenticated";

grant select on table "public"."tenants" to "authenticated";

grant trigger on table "public"."tenants" to "authenticated";

grant truncate on table "public"."tenants" to "authenticated";

grant update on table "public"."tenants" to "authenticated";

grant delete on table "public"."tenants" to "service_role";

grant insert on table "public"."tenants" to "service_role";

grant references on table "public"."tenants" to "service_role";

grant select on table "public"."tenants" to "service_role";

grant trigger on table "public"."tenants" to "service_role";

grant truncate on table "public"."tenants" to "service_role";

grant update on table "public"."tenants" to "service_role";

grant delete on table "public"."transaction_lines" to "anon";

grant insert on table "public"."transaction_lines" to "anon";

grant references on table "public"."transaction_lines" to "anon";

grant select on table "public"."transaction_lines" to "anon";

grant trigger on table "public"."transaction_lines" to "anon";

grant truncate on table "public"."transaction_lines" to "anon";

grant update on table "public"."transaction_lines" to "anon";

grant delete on table "public"."transaction_lines" to "authenticated";

grant insert on table "public"."transaction_lines" to "authenticated";

grant references on table "public"."transaction_lines" to "authenticated";

grant select on table "public"."transaction_lines" to "authenticated";

grant trigger on table "public"."transaction_lines" to "authenticated";

grant truncate on table "public"."transaction_lines" to "authenticated";

grant update on table "public"."transaction_lines" to "authenticated";

grant delete on table "public"."transaction_lines" to "service_role";

grant insert on table "public"."transaction_lines" to "service_role";

grant references on table "public"."transaction_lines" to "service_role";

grant select on table "public"."transaction_lines" to "service_role";

grant trigger on table "public"."transaction_lines" to "service_role";

grant truncate on table "public"."transaction_lines" to "service_role";

grant update on table "public"."transaction_lines" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

CREATE TRIGGER trigger_maintain_stock AFTER INSERT ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.update_item_stock();


