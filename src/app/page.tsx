import PurchaseOrderForm from "@/components/PurchaseOrderForm";
import { Building2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 font-sans p-8">
      <div className="max-w-7xl mx-auto">

        {/* Simple Header */}
        <header className="mb-10 flex items-center space-x-3 text-sky-700">
          <div className="w-10 h-10 bg-sky-700 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">Core ERP</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Procure To Pay Pipeline</p>
          </div>
        </header>

        {/* Render our new component */}
        <PurchaseOrderForm />

      </div>
    </main>
  );
}