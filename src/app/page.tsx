import Link from "next/link";
import { cookies } from "next/headers";
import LoginForm from "@/components/LoginForm";
import { logout } from "@/actions/auth";
import PurchaseOrderForm from "@/components/PurchaseOrderForm";
import PurchaseOrderList from "@/components/PurchaseOrderList";
import GRNList from "@/components/GRNList";
import JobCardList from "@/components/JobCardList";
import JobCardForm from "@/components/JobCardForm";
import DeliveryChallanList from "@/components/DeliveryChallanList";
import DeliveryChallanForm from "@/components/DeliveryChallanForm";
import SalesOrderForm from "@/components/SalesOrderForm";
import SalesOrderList from "@/components/SalesOrderList";
import ChartOfAccounts from "@/components/ChartOfAccounts";
import JournalEntryForm from "@/components/JournalEntryForm";
import JournalEntryList from "@/components/JournalEntryList";
import FinancialDashboard from "@/components/FinancialDashboard";
import ItemMaster from "@/components/ItemMaster";
import ItemForm from "@/components/ItemForm";
import EntityDirectory from "@/components/EntityDirectory";
import EntityForm from "@/components/EntityForm";
import BillList from "@/components/BillList";
import InvoiceList from "@/components/InvoiceList";
import PrintableInvoice from "@/components/PrintableInvoice";
import PrintableJobCard from "@/components/PrintableJobCard";
import PrintablePO from "@/components/PrintablePO";
import PrintableGRN from "@/components/PrintableGRN";
import PrintableSO from "@/components/PrintableSO";
import UserManagement from "@/components/UserManagement";
import UserForm from "@/components/UserForm";
import StockReport from "@/components/StockReport";
import PeriodManagement from "@/components/PeriodManagement";
import ReceivePaymentList from "@/components/ReceivePaymentList";
import GeneralLedgerReport from "@/components/GeneralLedgerReport"; // SARGENT FIX: Import GL Viewer


// Server Actions
import { getPurchaseOrders, getPurchaseOrderDetails } from "@/actions/p2p";
import { getGRNs, getGRNDetails } from "@/actions/inventory";
import { getJobCards, getJobCardDetails } from "@/actions/production";
import { getDeliveryChallans } from "@/actions/subcontracting";
import { getSalesOrders, getSalesOrderDetails } from "@/actions/o2c";
import { getAccounts, getJournalEntries } from "@/actions/gl";
import { getItems } from "@/actions/items";
import { getEntities } from "@/actions/entities";
import { getBills, getInvoices, getInvoiceDetails, getUnpaidInvoices } from "@/actions/billing"; // SARGENT FIX: Import Unpaid fetcher
import { getUsers } from "@/actions/admin";

import {
  LayoutDashboard, ShoppingCart, FileText, ArrowRightLeft, Landmark, FileCheck,
  CreditCard, Package, Users, AlertTriangle, Receipt, Shield, Wrench, BarChart2,
  Truck, ShieldAlert, LogOut, ChevronDown
} from "lucide-react";

// SARGENT FIX: Added ROLE_LABELS import to fix the ReferenceError crash
import { canAccess, MODULE_PERMISSIONS, ROLE_LABELS } from '@/lib/rbac';

export default async function Home({ searchParams }: { searchParams: Promise<{ module?: string, action?: string, id?: string }> }) {
  const cookieStore = await cookies();
  const tenantIdCookie = cookieStore.get('tenant_id');
  const userRoleCookie = cookieStore.get('user_role');
  const userEmailCookie = cookieStore.get('user_email');
  const userNameCookie = cookieStore.get('user_name'); // SARGENT FIX: Get actual name

  if (!tenantIdCookie?.value) {
    return <LoginForm />;
  }

  const TENANT_ID = tenantIdCookie.value;
  const USER_ROLE = userRoleCookie?.value || 'VIEWER';
  const USER_EMAIL = userEmailCookie?.value || 'admin@core.com';
  // SARGENT FIX: Use the actual name, with a fallback just in case
  const USER_NAME = userNameCookie?.value || USER_EMAIL.split('@')[0].replace('.', ' ');

  const params = await searchParams;
  const defaultModule = USER_ROLE === 'SALES' ? 'sales_orders' : USER_ROLE === 'WAREHOUSE' ? 'job_cards' : 'dashboard';
  const activeModule = params.module || defaultModule;
  const action = params.action || 'list';
  const recordId = params.id;

  // ==========================================
  // PRINT ENGINE INTERCEPTORS
  // ==========================================
  if (action === 'print' && activeModule === 'invoices' && recordId) {
    const response = await getInvoiceDetails(TENANT_ID, recordId);
    return <PrintableInvoice invoice={response.data} />;
  }
  if (action === 'print' && activeModule === 'purchase_orders' && recordId) {
    const [poRes, entRes] = await Promise.all([getPurchaseOrderDetails(TENANT_ID, recordId), getEntities(TENANT_ID)]);
    return <PrintablePO po={poRes.data} entities={entRes.data || []} />;
  }
  if (action === 'print' && activeModule === 'grns' && recordId) {
    const grnRes = await getGRNDetails(TENANT_ID, recordId);
    return <PrintableGRN grn={grnRes.data} />;
  }
  if (action === 'print' && activeModule === 'job_cards' && recordId) {
    const [jobRes, entRes, userRes] = await Promise.all([getJobCardDetails(TENANT_ID, recordId), getEntities(TENANT_ID), getUsers(TENANT_ID)]);
    return <PrintableJobCard job={jobRes.data} entities={entRes.data || []} users={userRes.data || []} />;
  }
  if (action === 'print' && activeModule === 'sales_orders' && recordId) {
    const [soRes, entRes] = await Promise.all([getSalesOrderDetails(TENANT_ID, recordId), getEntities(TENANT_ID)]);
    return <PrintableSO so={soRes.data} entities={entRes.data || []} />;
  }

  const isAuthorized = canAccess(USER_ROLE, activeModule as keyof typeof MODULE_PERMISSIONS);

  // ==========================================
  // DATA FETCHING LAYER
  // ==========================================
  let accountsList = [];
  let itemsList = [];
  let entitiesList = [];
  let usersList: any[] = [];
  let moduleData: any = null;
  let activeRecord: any = null;

  if (isAuthorized) {
    if (activeModule === 'item_master') {
      const response = await getItems(TENANT_ID);
      moduleData = response.data || [];
      if (action === 'edit' && recordId) {
        activeRecord = moduleData.find((i: any) => i.id === recordId);
      }
    } else if (activeModule === 'entity_directory') {
      if (action === 'create' || action === 'edit') {
        if (action === 'edit' && recordId) {
          const entRes = await getEntities(TENANT_ID);
          activeRecord = entRes.data?.find((e: any) => e.id === recordId);
        }
      } else {
        const response = await getEntities(TENANT_ID);
        moduleData = response.data || [];
      }
    } else if (activeModule === 'bills' || activeModule === 'payments_out') {
      // SARGENT FIX: Map Vendor Payments to the Bills Ledger
      const response = await getBills(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'stock_reports' || activeModule === 'dashboard' || activeModule === 'period_close') {
      moduleData = [];
    } else if (activeModule === 'invoices' || activeModule === 'payments_in') {
      // SARGENT FIX: Map Receive Payments to the Invoices Ledger
      const response = await getInvoices(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'purchase_orders') {
      const [itemRes, entRes] = await Promise.all([getItems(TENANT_ID), getEntities(TENANT_ID)]);
      itemsList = itemRes.data || [];
      entitiesList = entRes.data || [];
      if (action === 'create' || action === 'edit') {
        if (action === 'edit' && recordId) {
          const poRes = await getPurchaseOrderDetails(TENANT_ID, recordId);
          activeRecord = poRes.data;
        }
      } else {
        const response = await getPurchaseOrders(TENANT_ID);
        moduleData = response.data || [];
      }
    } else if (activeModule === 'grns') {
      const response = await getGRNs(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'job_cards') {
      const [entRes, userRes] = await Promise.all([getEntities(TENANT_ID), getUsers(TENANT_ID)]);
      entitiesList = entRes.data || [];
      usersList = userRes.data || [];
      if (action === 'create' || action === 'edit') {
        const response = await getItems(TENANT_ID);
        itemsList = response.data || [];
        if (action === 'edit' && recordId) {
          const jobRes = await getJobCardDetails(TENANT_ID, recordId);
          activeRecord = jobRes.data;
        }
      } else {
        const response = await getJobCards(TENANT_ID);
        moduleData = response.data || [];
      }
    } else if (activeModule === 'delivery_challans') {
      if (action === 'create') {
        const [itemRes, entRes] = await Promise.all([getItems(TENANT_ID), getEntities(TENANT_ID)]);
        itemsList = itemRes.data || [];
        entitiesList = entRes.data || [];
      } else {
        const response = await getDeliveryChallans(TENANT_ID);
        moduleData = response.data || [];
      }
    } else if (activeModule === 'sales_orders') {
      const [itemRes, entRes] = await Promise.all([getItems(TENANT_ID), getEntities(TENANT_ID)]);
      itemsList = itemRes.data || [];
      entitiesList = entRes.data || [];
      if (action === 'create' || action === 'edit') {
        if (action === 'edit' && recordId) {
          const soRes = await getSalesOrderDetails(TENANT_ID, recordId);
          activeRecord = soRes.data;
        }
      } else {
        const response = await getSalesOrders(TENANT_ID);
        moduleData = response.data || [];
      }
    } else if (activeModule === 'invoices') {
      const response = await getInvoices(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'payments_in') {
      // SARGENT FIX: Treasury specific data loading (Open AR + Banks)
      const [accRes, invRes] = await Promise.all([getAccounts(TENANT_ID), getUnpaidInvoices(TENANT_ID)]);
      accountsList = accRes.data || [];
      moduleData = invRes.data || [];
    } else if (activeModule === 'stock_reports') {
      moduleData = [];
    } else if (activeModule === 'chart_of_accounts') {
      const response = await getAccounts(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'general_ledger') {
      // SARGENT FIX: Pass down the accounts for the filter dropdown
      const accRes = await getAccounts(TENANT_ID);
      accountsList = accRes.data || [];
    } else if (activeModule === 'journal_entries') {
      if (action === 'create') {
        const accRes = await getAccounts(TENANT_ID);
        accountsList = accRes.data || [];
      } else {
        const response = await getJournalEntries(TENANT_ID);
        moduleData = response.data || [];
      }
    } else if (activeModule === 'user_management') {
      if (action === 'create' || action === 'edit') {
        if (action === 'edit' && recordId) {
          const userRes = await getUsers(TENANT_ID);
          activeRecord = userRes.data?.find((u: any) => u.id === recordId);
        }
      } else {
        const response = await getUsers(TENANT_ID);
        moduleData = response.data || [];
      }
    }
  }

  const menuGroups = [
    {
      label: "Enterprise",
      items: [{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
    },
    {
      label: "Master Data",
      items: [
        { id: 'item_master', icon: Package, label: 'Items' },
        { id: 'entity_directory', icon: Users, label: 'Entity Directory' }
      ]
    },
    {
      label: "Manufacturing",
      items: [
        { id: 'job_cards', icon: Wrench, label: 'Job Cards' },
        { id: 'delivery_challans', icon: Truck, label: 'Delivery Challans' }
      ]
    },
    {
      label: "Procure to Pay (P2P)",
      items: [
        { id: 'purchase_orders', icon: ShoppingCart, label: 'Purchase Orders' },
        { id: 'grns', icon: Package, label: 'Goods Receipts (GRN)' },
        { id: 'bills', icon: FileText, label: 'A/P Bills' },
        { id: 'payments_out', icon: ArrowRightLeft, label: 'Vendor Payments' }
      ]
    },
    {
      label: "Order to Cash (O2C)",
      items: [
        { id: 'sales_orders', icon: FileCheck, label: 'Sales Orders' },
        { id: 'invoices', icon: Receipt, label: 'A/R Invoices' },
        { id: 'payments_in', icon: CreditCard, label: 'Receive Payments' }
      ]
    },
    {
      label: "Financials (GL)",
      items: [
        { id: 'chart_of_accounts', icon: Landmark, label: 'Chart of Accounts' },
        { id: 'journal_entries', icon: FileText, label: 'Journal Entries' },
        { id: 'general_ledger', icon: FileText, label: 'General Ledger' }, // SARGENT FIX: Added GL Link
        { id: 'period_close', icon: AlertTriangle, label: 'Period Close' }
      ]
    },
    {
      label: "Reports",
      items: [
        { id: 'stock_reports', icon: BarChart2, label: 'Stock Reports' }
      ]
    },
    {
      label: "Administration",
      items: [
        { id: 'user_management', icon: Shield, label: 'User Management' }
      ]
    }
  ].map(group => ({
    ...group,
    items: group.items.filter(item => canAccess(USER_ROLE, item.id as keyof typeof MODULE_PERMISSIONS))
  })).filter(group => group.items.length > 0);

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="flex items-center">
          {/* SARGENT FIX: Re-applying Srini ERP typography & enlarged TankTech logo */}
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Srini Logo" className="h-8 w-8 object-contain" />
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] leading-none mb-0.5">Srini</span>
              <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">ERP</span>
            </div>
          </div>

          <div className="hidden md:flex items-center ml-6 pl-6 border-l border-slate-200 h-10">
            <img src="/tanktech.png" alt="TankTechAsia" className="h-12 object-contain opacity-90" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* SARGENT FIX: Upgraded User Profile Trigger with Smooth Hover Animations */}
          <div className="relative group cursor-pointer py-1">
            <div className="flex items-center space-x-3 hover:bg-slate-100 p-1.5 rounded-xl transition-all duration-300">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 transition-colors duration-300 capitalize">
                  {USER_NAME}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{USER_ROLE}</span>
              </div>
              <div className="w-8 h-8 bg-slate-800 group-hover:bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center text-xs uppercase shadow-sm group-hover:scale-110 transition-all duration-300">
                {USER_NAME.charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
            </div>

            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden transform origin-top group-hover:translate-y-0 translate-y-2">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-bold text-slate-800 truncate">{USER_NAME}</p>
                <p className="text-xs text-slate-500 truncate">{USER_EMAIL}</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{ROLE_LABELS[USER_ROLE as keyof typeof ROLE_LABELS] || USER_ROLE}</p>
              </div>
              <div className="p-2">
                <form action={logout}>
                  <button type="submit" className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center space-x-2">
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-slate-900 text-slate-300 h-full overflow-y-auto hidden md:block border-r border-slate-800 shadow-inner [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="py-6">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="px-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {group.label}
                </h3>
                <ul className="space-y-1">
                  {group.items.map(item => (
                    <li key={item.id}>
                      <Link
                        href={`/?module=${item.id}&action=list`}
                        className={`w-full flex items-center px-6 py-2 text-sm font-medium transition-all ${activeModule === item.id
                          ? 'bg-sky-900/50 text-sky-400 border-l-4 border-sky-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent'
                          }`}
                      >
                        <item.icon size={16} className={`mr-3 ${activeModule === item.id ? 'text-sky-400' : 'text-slate-500'}`} />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="w-full h-full">
            {!isAuthorized ? (
              <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-rose-200">
                  <ShieldAlert size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2 uppercase">Access Denied</h2>
                <p className="text-slate-500 font-medium max-w-md">
                  Your current security clearance (<span className="font-bold text-slate-700">{USER_ROLE}</span>) does not permit access to the <span className="uppercase font-mono text-slate-700">{activeModule}</span> module.
                </p>
              </div>
            ) : activeModule === 'dashboard' ? (
              <FinancialDashboard tenantId={TENANT_ID} userRole={USER_ROLE} />
            ) : activeModule === 'item_master' ? (
              action === 'create' || action === 'edit' ? (
                <ItemForm tenantId={TENANT_ID} initialData={activeRecord} />
              ) : (
                <ItemMaster items={moduleData || []} tenantId={TENANT_ID} />
              )
            ) : activeModule === 'job_cards' ? (
              action === 'create' || action === 'edit' ? (
                <JobCardForm items={itemsList} entities={entitiesList} users={usersList} tenantId={TENANT_ID} initialData={activeRecord} />
              ) : (
                <JobCardList jobs={moduleData || []} entities={entitiesList} users={usersList} tenantId={TENANT_ID} />
              )
            ) : activeModule === 'purchase_orders' ? (
              action === 'create' || action === 'edit' ? (
                <PurchaseOrderForm items={itemsList} entities={entitiesList} tenantId={TENANT_ID} initialData={activeRecord} />
              ) : (
                <PurchaseOrderList orders={moduleData || []} tenantId={TENANT_ID} userRole={USER_ROLE} />
              )
            ) : activeModule === 'grns' ? (
              <GRNList grns={moduleData || []} />
            ) : activeModule === 'delivery_challans' ? (
              action === 'create' ? (
                <DeliveryChallanForm items={itemsList} entities={entitiesList} tenantId={TENANT_ID} />
              ) : (
                <DeliveryChallanList dcs={moduleData || []} tenantId={TENANT_ID} />
              )
            ) : activeModule === 'sales_orders' ? (
              action === 'create' || action === 'edit' ? (
                <SalesOrderForm items={itemsList} entities={entitiesList} tenantId={TENANT_ID} initialData={activeRecord} />
              ) : (
                <SalesOrderList orders={moduleData || []} tenantId={TENANT_ID} userRole={USER_ROLE} />
              )
            ) : activeModule === 'invoices' ? (
              <InvoiceList invoices={moduleData || []} />
            ) : activeModule === 'payments_in' ? (
              // SARGENT FIX: Map the dedicated Treasury module
              <ReceivePaymentList invoices={moduleData || []} accounts={accountsList} tenantId={TENANT_ID} />
            ) : activeModule === 'stock_reports' ? (
              <StockReport tenantId={TENANT_ID} />
            ) : activeModule === 'period_close' ? (
              <PeriodManagement tenantId={TENANT_ID} />
            ) : activeModule === 'user_management' ? (
              action === 'create' || action === 'edit' ? (
                <UserForm tenantId={TENANT_ID} initialData={activeRecord} />
              ) : (
                <UserManagement users={moduleData || []} />
              )
            ) : activeModule === 'chart_of_accounts' ? (
              <ChartOfAccounts accounts={moduleData || []} />
            ) : activeModule === 'general_ledger' ? (
              // SARGENT FIX: Render the Immutable GL
              <GeneralLedgerReport tenantId={TENANT_ID} accounts={accountsList} />
            ) : activeModule === 'entity_directory' ? (
              action === 'create' || action === 'edit' ? (
                <EntityForm tenantId={TENANT_ID} initialData={activeRecord} />
              ) : (
                <EntityDirectory entities={moduleData || []} tenantId={TENANT_ID} />
              )
            ) : activeModule === 'bills' || activeModule === 'payments_out' ? (
              <BillList bills={moduleData || []} />
            ) : activeModule === 'journal_entries' ? (
              action === 'create' ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
                    <Link href="/?module=journal_entries&action=list" className="hover:text-indigo-600">Journal Entries</Link>
                    <span>/</span>
                    <span className="text-slate-800">Post Entry</span>
                  </div>
                  <JournalEntryForm accounts={accountsList} />
                </div>
              ) : (
                <JournalEntryList entries={moduleData || []} />
              )
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}