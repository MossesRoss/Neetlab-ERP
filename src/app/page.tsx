import Link from "next/link";
import { cookies } from "next/headers";
import LoginForm from "@/components/LoginForm";
import { logout } from "@/actions/auth";
import PurchaseOrderForm from "@/components/PurchaseOrderForm";
import PurchaseOrderList from "@/components/PurchaseOrderList";
import SalesOrderForm from "@/components/SalesOrderForm";
import SalesOrderList from "@/components/SalesOrderList";
import ChartOfAccounts from "@/components/ChartOfAccounts";
import JournalEntryForm from "@/components/JournalEntryForm";
import JournalEntryList from "@/components/JournalEntryList";
import FinancialDashboard from "@/components/FinancialDashboard";
import ItemMaster from "@/components/ItemMaster";
import EntityDirectory from "@/components/EntityDirectory";
import BillList from "@/components/BillList";
import InvoiceList from "@/components/InvoiceList";
import PrintableInvoice from "@/components/PrintableInvoice";
import UserManagement from "@/components/UserManagement";
import { getPurchaseOrders } from "@/actions/p2p";
import { getSalesOrders } from "@/actions/o2c";
import { getAccounts, getJournalEntries } from "@/actions/gl";
import { getFinancialSummary } from "@/actions/dashboard";
import { getItems } from "@/actions/items";
import { getEntities } from "@/actions/entities";
import { getBills, getInvoices, getInvoiceDetails } from "@/actions/billing";
import { getUsers } from "@/actions/admin";
import {
  Building2, LayoutDashboard, ShoppingCart,
  FileText, ArrowRightLeft, Landmark, FileCheck, CreditCard, Package, Users, AlertTriangle, Receipt, Shield
} from "lucide-react";

export default async function Home({ searchParams }: { searchParams: Promise<{ module?: string, action?: string, id?: string }> }) {
  // 1. SECURE TENANT INTERCEPTION
  const cookieStore = await cookies();
  const tenantIdCookie = cookieStore.get('tenant_id');
  const userRoleCookie = cookieStore.get('user_role');
  const userEmailCookie = cookieStore.get('user_email');

  // If no secure session exists, halt the application and render the login gateway.
  if (!tenantIdCookie?.value) {
    return <LoginForm />;
  }

  // 2. DYNAMIC TENANT & ROLE ASSIGNMENT
  const TENANT_ID = tenantIdCookie.value;
  const USER_ROLE = userRoleCookie?.value || 'ADMIN';
  const USER_EMAIL = userEmailCookie?.value || 'admin@core.com';

  const params = await searchParams;
  // Default to the most relevant dashboard based on role
  const defaultModule = USER_ROLE === 'SALES' ? 'sales_orders' : USER_ROLE === 'PROCUREMENT' ? 'purchase_orders' : 'dashboard';
  const activeModule = params.module || defaultModule;
  const action = params.action || 'list';
  const recordId = params.id; // Extract the requested document ID

  // ==============================================================
  // PHASE 23: ISOLATED PRINT ROUTE INTERCEPTION
  // If the user is requesting a PDF, return the document immediately, 
  // skipping the entire application shell below!
  // ==============================================================
  if (action === 'print' && activeModule === 'invoices' && recordId) {
    const response = await getInvoiceDetails(TENANT_ID, recordId);
    return <PrintableInvoice invoice={response.data} />;
  }

  let accountsList = [];
  let itemsList = [];
  let entitiesList = [];
  let moduleData: any = null;

  // Fetch data on the server based on the active module
  if (activeModule === 'dashboard') {
    const response = await getFinancialSummary(TENANT_ID);
    moduleData = response.data || null;
  } else if (activeModule === 'item_master') {
    const response = await getItems(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'entity_directory') {
    const response = await getEntities(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'bills') {
    const response = await getBills(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'invoices') {
    const response = await getInvoices(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'user_management' && USER_ROLE === 'ADMIN') {
    const response = await getUsers(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'purchase_orders' && action === 'list') {
    const response = await getPurchaseOrders(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'purchase_orders' && action === 'create') {
    const [itemRes, entRes] = await Promise.all([getItems(TENANT_ID), getEntities(TENANT_ID)]);
    itemsList = itemRes.data || [];
    entitiesList = entRes.data || [];
  } else if (activeModule === 'sales_orders' && action === 'list') {
    const response = await getSalesOrders(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'sales_orders' && action === 'create') {
    const [itemRes, entRes] = await Promise.all([getItems(TENANT_ID), getEntities(TENANT_ID)]);
    itemsList = itemRes.data || [];
    entitiesList = entRes.data || [];
  } else if (activeModule === 'chart_of_accounts') {
    const response = await getAccounts(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'journal_entries') {
    if (action === 'create') {
      const accRes = await getAccounts(TENANT_ID);
      accountsList = accRes.data || [];
    } else {
      const response = await getJournalEntries(TENANT_ID);
      moduleData = response.data || [];
    }
  }

  // 3. STRICT ROLE-BASED MENU FILTERING
  const menuGroups = [
    {
      label: "Enterprise",
      allowed: ['ADMIN'],
      items: [{ id: 'dashboard', icon: LayoutDashboard, label: 'Financial Dashboard' }]
    },
    {
      label: "Master Data",
      allowed: ['ADMIN', 'PROCUREMENT', 'SALES'],
      items: [
        { id: 'item_master', icon: Package, label: 'Item Catalog', roles: ['ADMIN', 'PROCUREMENT'] },
        { id: 'entity_directory', icon: Users, label: 'Entity Directory', roles: ['ADMIN', 'SALES'] }
      ].filter(item => item.roles.includes(USER_ROLE))
    },
    {
      label: "Procure to Pay (P2P)",
      allowed: ['ADMIN', 'PROCUREMENT'],
      items: [
        { id: 'purchase_orders', icon: ShoppingCart, label: 'Purchase Orders' },
        { id: 'bills', icon: FileText, label: 'A/P Bills' },
        { id: 'payments_out', icon: ArrowRightLeft, label: 'Vendor Payments' }
      ]
    },
    {
      label: "Order to Cash (O2C)",
      allowed: ['ADMIN', 'SALES'],
      items: [
        { id: 'sales_orders', icon: FileCheck, label: 'Sales Orders' },
        { id: 'invoices', icon: Receipt, label: 'A/R Invoices' },
        { id: 'payments_in', icon: CreditCard, label: 'Receive Payments' }
      ]
    },
    {
      label: "Financials (GL)",
      allowed: ['ADMIN'],
      items: [
        { id: 'chart_of_accounts', icon: Landmark, label: 'Chart of Accounts' },
        { id: 'journal_entries', icon: FileText, label: 'Journal Entries' }
      ]
    },
    {
      label: "Administration",
      allowed: ['ADMIN'],
      items: [
        { id: 'user_management', icon: Shield, label: 'User Management' }
      ]
    }
  ].filter(group => group.allowed.includes(USER_ROLE));

  // Security Guard: Prevent URL tampering from accessing unauthorized modules
  const isAuthorized = menuGroups.some(group => group.items.some(item => item.id === activeModule));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-2 text-sky-700 font-black tracking-tighter text-xl">
          <div className="w-8 h-8 bg-sky-700 rounded-md flex items-center justify-center text-white shadow-inner">
            <Building2 size={18} />
          </div>
          <span className="uppercase">Core ERP</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800 capitalize">{USER_EMAIL.split('@')[0]}</p>
            <div className="flex items-center justify-end space-x-2">
              {/* Dynamic Role Badge */}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${USER_ROLE === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                USER_ROLE === 'SALES' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-sky-100 text-sky-700'
                }`}>
                {USER_ROLE}
              </span>
              <form action={logout}>
                <button type="submit" className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors mt-0.5">
                  Log Out
                </button>
              </form>
            </div>
          </div>
          <div className="w-8 h-8 bg-slate-800 text-white font-bold rounded-full flex items-center justify-center text-xs uppercase">
            {USER_EMAIL.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-slate-300 h-[calc(100vh-3.5rem)] overflow-y-auto hidden md:block">
          <div className="py-6">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="mb-8">
                <h3 className="px-6 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {group.label}
                </h3>
                <ul className="space-y-1">
                  {group.items.map(item => (
                    <li key={item.id}>
                      <Link
                        href={`/?module=${item.id}&action=list`}
                        className={`w-full flex items-center px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${activeModule === item.id
                          ? 'bg-sky-600 text-white shadow-[inset_4px_0_0_0_#bae6fd]'
                          : 'hover:bg-slate-800 hover:text-white'
                          }`}
                      >
                        <item.icon size={16} className={`mr-3 ${activeModule === item.id ? 'text-sky-200' : 'text-slate-500'}`} />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">

            {!isAuthorized ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-red-200 rounded-xl bg-red-50/50">
                <AlertTriangle size={48} className="text-red-400 mb-4" />
                <h2 className="text-lg font-bold text-red-800 capitalize tracking-wide">Access Denied</h2>
                <p className="text-sm text-red-600 mt-2">Your current role ({USER_ROLE}) is not authorized to view this module.</p>
              </div>
            ) : activeModule === 'dashboard' ? (
              <FinancialDashboard metrics={moduleData} />
            ) : activeModule === 'purchase_orders' ? (
              action === 'create' ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
                    <Link href="/?module=purchase_orders&action=list" className="hover:text-sky-600">Purchase Orders</Link>
                    <span>/</span>
                    <span className="text-slate-800">Create New</span>
                  </div>
                  <PurchaseOrderForm items={itemsList} entities={entitiesList} />
                </div>
              ) : (
                <PurchaseOrderList orders={moduleData || []} />
              )
            ) : activeModule === 'sales_orders' ? (
              action === 'create' ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
                    <Link href="/?module=sales_orders&action=list" className="hover:text-emerald-600">Sales Orders</Link>
                    <span>/</span>
                    <span className="text-slate-800">Create New</span>
                  </div>
                  <SalesOrderForm items={itemsList} entities={entitiesList} />
                </div>
              ) : (
                <SalesOrderList orders={moduleData || []} tenantId={TENANT_ID} /> // ADDED TENANT ID
              )
            ) : activeModule === 'invoices' ? (
              <InvoiceList invoices={moduleData || []} />
            ) : activeModule === 'chart_of_accounts' ? (
              <ChartOfAccounts accounts={moduleData || []} />
            ) : activeModule === 'item_master' ? (
              <ItemMaster items={moduleData || []} />
            ) : activeModule === 'entity_directory' ? (
              <EntityDirectory entities={moduleData || []} tenantId={TENANT_ID} />
            ) : activeModule === 'bills' ? (
              <BillList bills={moduleData || []} />
            ) : activeModule === 'user_management' ? (
              <UserManagement users={moduleData || []} tenantId={TENANT_ID} />
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
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <LayoutDashboard size={48} className="text-slate-300 mb-4" />
                <h2 className="text-lg font-bold text-slate-700 capitalize tracking-wide">{activeModule.replace('_', ' ')} Module</h2>
                <p className="text-sm text-slate-500 mt-2">Architecture pending database mapping.</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}