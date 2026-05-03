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
import EntityDirectory from "@/components/EntityDirectory";
import BillList from "@/components/BillList";
import InvoiceList from "@/components/InvoiceList";
import PrintableInvoice from "@/components/PrintableInvoice";
import UserManagement from "@/components/UserManagement";
import StockReport from "@/components/StockReport";
import PeriodManagement from "@/components/PeriodManagement";
import { getPurchaseOrders } from "@/actions/p2p";
import { getGRNs } from "@/actions/inventory";
import { getJobCards } from "@/actions/production";
import { getDeliveryChallans } from "@/actions/subcontracting";
import { getSalesOrders } from "@/actions/o2c";
import { getAccounts, getJournalEntries } from "@/actions/gl";
import { getItems } from "@/actions/items";
import { getEntities } from "@/actions/entities";
import { getBills, getInvoices, getInvoiceDetails } from "@/actions/billing";
import { getUsers } from "@/actions/admin";
import {
  LayoutDashboard, ShoppingCart, FileText, ArrowRightLeft, Landmark, FileCheck,
  CreditCard, Package, Users, AlertTriangle, Receipt, Shield, Wrench, BarChart2,
  Truck, ShieldAlert, LogOut, ChevronDown
} from "lucide-react";
import { canAccess, MODULE_PERMISSIONS } from '@/lib/rbac';

export default async function Home({ searchParams }: { searchParams: Promise<{ module?: string, action?: string, id?: string }> }) {
  const cookieStore = await cookies();
  const tenantIdCookie = cookieStore.get('tenant_id');
  const userRoleCookie = cookieStore.get('user_role');
  const userEmailCookie = cookieStore.get('user_email');

  if (!tenantIdCookie?.value) {
    return <LoginForm />;
  }

  const TENANT_ID = tenantIdCookie.value;
  const USER_ROLE = userRoleCookie?.value || 'VIEWER';
  const USER_EMAIL = userEmailCookie?.value || 'admin@core.com';

  const params = await searchParams;
  const defaultModule = USER_ROLE === 'SALES' ? 'sales_orders' : USER_ROLE === 'WAREHOUSE' ? 'job_cards' : 'dashboard';
  const activeModule = params.module || defaultModule;
  const action = params.action || 'list';
  const recordId = params.id;

  if (action === 'print' && activeModule === 'invoices' && recordId) {
    const response = await getInvoiceDetails(TENANT_ID, recordId);
    return <PrintableInvoice invoice={response.data} />;
  }

  const isAuthorized = canAccess(USER_ROLE, activeModule as keyof typeof MODULE_PERMISSIONS);

  let accountsList = [];
  let itemsList = [];
  let entitiesList = [];
  let moduleData: any = null;

  if (isAuthorized) {
    if (activeModule === 'item_master') {
      const response = await getItems(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'entity_directory') {
      const response = await getEntities(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'bills') {
      const response = await getBills(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'stock_reports') {
      moduleData = [];
    } else if (activeModule === 'invoices') {
      const response = await getInvoices(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'dashboard') {
      moduleData = [];
    } else if (activeModule === 'purchase_orders') {
      if (action === 'create') {
        const [itemRes, entRes] = await Promise.all([getItems(TENANT_ID), getEntities(TENANT_ID)]);
        itemsList = itemRes.data || [];
        entitiesList = entRes.data || [];
      } else {
        const response = await getPurchaseOrders(TENANT_ID);
        moduleData = response.data || [];
      }
    } else if (activeModule === 'grns') {
      const response = await getGRNs(TENANT_ID);
      moduleData = response.data || [];
    } else if (activeModule === 'job_cards') {
      if (action === 'create') {
        const response = await getItems(TENANT_ID);
        itemsList = response.data || [];
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
      if (action === 'create') {
        const [itemRes, entRes] = await Promise.all([getItems(TENANT_ID), getEntities(TENANT_ID)]);
        itemsList = itemRes.data || [];
        entitiesList = entRes.data || [];
      } else {
        const response = await getSalesOrders(TENANT_ID);
        moduleData = response.data || [];
      }
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
    } else if (activeModule === 'user_management') {
      const response = await getUsers(TENANT_ID);
      moduleData = response.data || [];
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
        { id: 'item_master', icon: Package, label: 'Item Catalog' },
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
      {/* SARGENT FIX: Brand and Top Right Nav */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-800 font-black tracking-tight text-xl">
          {/* Logo placeholder. Just drop logo.png in public folder */}
          <img
            src="/logo.png"
            alt="Srini Logo"
            className="h-6 object-contain"
          />
          <span className="uppercase tracking-widest">Srini</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative group cursor-pointer py-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-800 text-white font-bold rounded-full flex items-center justify-center text-xs uppercase shadow-sm">
                {USER_EMAIL.charAt(0)}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>

            {/* Hover Dropdown (NetSuite Style) */}
            <div className="absolute right-0 top-full mt-0 w-56 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-bold text-slate-800 truncate">{USER_EMAIL}</p>
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mt-1">{USER_ROLE}</p>
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
        {/* SARGENT FIX: Sleek Modern SaaS Sidebar (Scrollbar Hidden & Full Height Fixed) */}
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

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
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
            ) : activeModule === 'grns' ? (
              <GRNList grns={moduleData || []} />
            ) : activeModule === 'job_cards' ? (
              action === 'create' ? (
                <JobCardForm items={itemsList} tenantId={TENANT_ID} />
              ) : (
                <JobCardList jobs={moduleData || []} tenantId={TENANT_ID} />
              )
            ) : activeModule === 'delivery_challans' ? (
              action === 'create' ? (
                <DeliveryChallanForm items={itemsList} entities={entitiesList} tenantId={TENANT_ID} />
              ) : (
                <DeliveryChallanList dcs={moduleData || []} tenantId={TENANT_ID} />
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
                <SalesOrderList orders={moduleData || []} tenantId={TENANT_ID} />
              )
            ) : activeModule === 'invoices' ? (
              <InvoiceList invoices={moduleData || []} />
            ) : activeModule === 'stock_reports' ? (
              <StockReport tenantId={TENANT_ID} />
            ) : activeModule === 'period_close' ? (
              <PeriodManagement tenantId={TENANT_ID} />
            ) : activeModule === 'user_management' ? (
              <UserManagement users={moduleData || []} tenantId={TENANT_ID} />
            ) : activeModule === 'chart_of_accounts' ? (
              <ChartOfAccounts accounts={moduleData || []} />
            ) : activeModule === 'item_master' ? (
              <ItemMaster items={moduleData || []} tenantId={TENANT_ID} />
            ) : activeModule === 'entity_directory' ? (
              <EntityDirectory entities={moduleData || []} tenantId={TENANT_ID} />
            ) : activeModule === 'bills' ? (
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