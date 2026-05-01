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
import ItemMaster from "@/components/ItemMaster"; // NEW IMPORT
import { getPurchaseOrders } from "@/actions/p2p";
import { getSalesOrders } from "@/actions/o2c";
import { getAccounts, getJournalEntries } from "@/actions/gl";
import { getFinancialSummary } from "@/actions/dashboard";
import { getItems } from "@/actions/items"; // NEW IMPORT
import {
  Building2, LayoutDashboard, ShoppingCart,
  FileText, ArrowRightLeft, Landmark, FileCheck, CreditCard, Package
} from "lucide-react";

// In Next.js 15, searchParams is asynchronous. 
export default async function Home({ searchParams }: { searchParams: Promise<{ module?: string, action?: string }> }) {
  // 1. SECURE TENANT INTERCEPTION
  const cookieStore = await cookies();
  const tenantIdCookie = cookieStore.get('tenant_id');

  // If no secure session exists, halt the application and render the login gateway.
  if (!tenantIdCookie?.value) {
    return <LoginForm />;
  }

  // 2. DYNAMIC TENANT ASSIGNMENT
  const TENANT_ID = tenantIdCookie.value;

  const params = await searchParams;
  const activeModule = params.module || 'dashboard';
  const action = params.action || 'list';
  let accountsList = [];
  let itemsList = [];
  let moduleData: any = null;

  // Fetch data on the server based on the active module
  if (activeModule === 'dashboard') {
    const response = await getFinancialSummary(TENANT_ID);
    moduleData = response.data || null;
  } else if (activeModule === 'item_master') {
    const response = await getItems(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'purchase_orders' && action === 'list') {
    const response = await getPurchaseOrders(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'purchase_orders' && action === 'create') {
    const response = await getItems(TENANT_ID);
    itemsList = response.data || [];
  } else if (activeModule === 'sales_orders' && action === 'list') {
    const response = await getSalesOrders(TENANT_ID);
    moduleData = response.data || [];
  } else if (activeModule === 'sales_orders' && action === 'create') {
    const response = await getItems(TENANT_ID);
    itemsList = response.data || [];
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

  // Define our Sidebar Menu
  const menuGroups = [
    {
      label: "Enterprise",
      items: [{ id: 'dashboard', icon: LayoutDashboard, label: 'Financial Dashboard' }]
    },
    {
      label: "Master Data",
      items: [{ id: 'item_master', icon: Package, label: 'Item Catalog' }]
    },
    {
      label: "Procure to Pay (P2P)",
      items: [
        { id: 'purchase_orders', icon: ShoppingCart, label: 'Purchase Orders' },
        { id: 'bills', icon: FileText, label: 'A/P Bills' },
        { id: 'payments_out', icon: ArrowRightLeft, label: 'Vendor Payments' }
      ]
    },
    {
      label: "Order to Cash (O2C)",
      items: [
        { id: 'sales_orders', icon: FileCheck, label: 'Sales Orders' },
        { id: 'invoices', icon: FileText, label: 'A/R Invoices' },
        { id: 'payments_in', icon: CreditCard, label: 'Receive Payments' }
      ]
    },
    {
      label: "Financials (GL)",
      items: [
        { id: 'chart_of_accounts', icon: Landmark, label: 'Chart of Accounts' },
        { id: 'journal_entries', icon: FileText, label: 'Journal Entries' }
      ]
    }
  ];

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
            <p className="text-xs font-bold text-slate-800">Admin User</p>
            <form action={logout}>
              <button type="submit" className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors">
                Log Out
              </button>
            </form>
          </div>
          <div className="w-8 h-8 bg-slate-800 text-white font-bold rounded-full flex items-center justify-center text-xs">
            AD
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

            {activeModule === 'dashboard' ? (
              <FinancialDashboard metrics={moduleData} />
            ) : activeModule === 'purchase_orders' ? (
              action === 'create' ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
                    <Link href="/?module=purchase_orders&action=list" className="hover:text-sky-600">Purchase Orders</Link>
                    <span>/</span>
                    <span className="text-slate-800">Create New</span>
                  </div>
                  <PurchaseOrderForm items={itemsList} />
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
                  <SalesOrderForm items={itemsList} />
                </div>
              ) : (
                <SalesOrderList orders={moduleData || []} />
              )
            ) : activeModule === 'chart_of_accounts' ? (
              <ChartOfAccounts accounts={moduleData || []} />
            ) : activeModule === 'item_master' ? (
              <ItemMaster items={moduleData || []} />
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