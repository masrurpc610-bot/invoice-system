import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, FileText, 
  Plus, ArrowRight, UserPlus, Store, Trash2
} from 'lucide-react';
import { supabase } from './supabase';

interface Customer {
  id: number;
  name: string;
}

interface InvoiceItem {
  id: number;
  name: string;
  width: string; 
  length: string;
  date: string;
}

export default function App() {
  const [activePage, setActivePage] = useState<'customers' | 'invoice'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomerName, setNewCustomerName] = useState('');

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', width: '', length: '' });

  const nameInputRef = useRef<HTMLInputElement>(null);
  const widthInputRef = useRef<HTMLInputElement>(null);
  const lengthInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('*').order('id', { ascending: false });
    if (!error && data) {
      setCustomers(data);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchInvoiceItems(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const fetchInvoiceItems = async (customerId: number) => {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('customer_id', customerId)
      .order('id', { ascending: true });
    
    if (!error && data) {
      setItems(data);
    }
  };

  const convertNumbersToEnglish = (str: string) => {
    return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => {
      return '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString();
    });
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const { data, error } = await supabase
      .from('customers')
      .insert([{ name: newCustomerName }])
      .select();

    if (!error && data) {
      setCustomers([data[0], ...customers]);
      setNewCustomerName('');
    }
  };

  const handleDeleteCustomer = async (customerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('ئایا دڵنیای لە سڕینەوەی ئەم کڕیارە؟ هەموو وەسڵەکانیشی دەسڕێنەوە.')) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (!error) {
      setCustomers(customers.filter(c => c.id !== customerId));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null);
        setActivePage('customers');
      }
    }
  };

  const filteredCustomers = customers.filter(c => c.name.includes(searchQuery));

  const openCustomerProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActivePage('invoice');
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.width || !newItem.length || !selectedCustomer) return;
    
    const itemData = {
      customer_id: selectedCustomer.id,
      name: newItem.name,
      width: newItem.width,
      length: newItem.length,
      date: new Date().toLocaleDateString('en-GB')
    };

    const { data, error } = await supabase
      .from('invoice_items')
      .insert([itemData])
      .select();

    if (!error && data) {
      setItems([...items, data[0]]);
      setNewItem({ name: '', width: '', length: '' });
      nameInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | null> | 'submit') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef === 'submit') {
        handleAddItem();
      } else if (nextRef && typeof nextRef === 'object' && 'current' in nextRef) {
        nextRef.current?.focus();
      }
    }
  };

  const calculateTotal = (w: string, l: string) => {
    const numW = parseFloat(w) || 0;
    const numL = parseFloat(l) || 0;
    return numW * numL;
  };
  const grandTotal = items.reduce((sum, item) => sum + calculateTotal(item.width, item.length), 0);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col selection:bg-blue-200 selection:text-blue-900" dir="rtl">
      
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Store size={22} />
            </div>
            <h1 className="text-xl font-black tracking-tight">سیستەمی وەسڵ</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 md:py-8">
        
        {activePage === 'customers' && (
          <div className="space-y-4">
            
            <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">کڕیارەکان</h2>
                <p className="text-slate-500 text-sm mt-0.5">کۆی گشتی: <span className="font-bold text-blue-600">{customers.length}</span> کڕیار</p>
              </div>
              
              <form onSubmit={handleAddCustomer} className="flex flex-col sm:flex-row gap-2.5">
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="ناوی کڕیاری نوێ..."
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full text-base font-medium"
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md active:scale-95 transition-all"
                >
                  <UserPlus size={18} />
                  زیادکردن
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    placeholder="گەڕان بەدوای کڕیار..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 py-3 px-4 pr-11 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm shadow-sm"
                  />
                  <Search className="absolute right-3.5 top-3.5 text-slate-400" size={18} />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    هیچ کڕیارێک نەدۆزرایەوە
                  </div>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-blue-50/40 transition-colors gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-slate-400 font-bold text-sm">{index + 1}</span>
                        <h3 className="font-bold text-slate-800 text-base truncate">{customer.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => openCustomerProfile(customer)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          وەسڵ
                          <ArrowRight size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteCustomer(customer.id, e)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-xl transition-all shadow-sm"
                          title="سڕینەوە"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activePage === 'invoice' && selectedCustomer && (
          <div className="space-y-4">
            
            <div>
              <button 
                onClick={() => setActivePage('customers')}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-bold bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm transition-all"
              >
                <ArrowRight size={16} />
                گەڕانەوە
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-4 sm:p-6 space-y-6">
              
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs font-bold mb-2">
                    <FileText size={14} />
                    وەسڵی فەرمی
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h2>
                </div>
                <div className="text-left text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 w-full sm:w-auto">
                  <div>بەروار: <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-GB')}</span></div>
                  <div>ژمارە: <span className="font-bold text-slate-800 font-mono">#{selectedCustomer.id}</span></div>
                </div>
              </div>

              {/* فرمی زیادکردنی کاڵا بە شێوازی مۆبایل */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-3">
                <h3 className="text-xs font-bold text-blue-900">زیادکردنی شتومەک بۆ وەسڵ</h3>
                <input 
                  ref={nameInputRef}
                  type="text" 
                  placeholder="ناوی شتومەک..."
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  onKeyDown={(e) => handleKeyDown(e, widthInputRef)}
                  className="w-full bg-white p-3 rounded-xl outline-none border border-blue-200 focus:border-blue-500 text-right font-medium text-sm shadow-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    ref={widthInputRef}
                    type="text" 
                    placeholder="پانی (m)"
                    value={newItem.width}
                    onChange={(e) => setNewItem({...newItem, width: convertNumbersToEnglish(e.target.value)})}
                    onKeyDown={(e) => handleKeyDown(e, lengthInputRef)}
                    className="w-full bg-white p-3 rounded-xl outline-none border border-blue-200 focus:border-blue-500 text-center font-mono font-bold text-sm shadow-sm"
                    dir="ltr"
                  />
                  <input 
                    ref={lengthInputRef}
                    type="text" 
                    placeholder="درێژی (m)"
                    value={newItem.length}
                    onChange={(e) => setNewItem({...newItem, length: convertNumbersToEnglish(e.target.value)})}
                    onKeyDown={(e) => handleKeyDown(e, 'submit')}
                    className="w-full bg-white p-3 rounded-xl outline-none border border-blue-200 focus:border-blue-500 text-center font-mono font-bold text-sm shadow-sm"
                    dir="ltr"
                  />
                </div>
                <button 
                  onClick={handleAddItem}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  زیادکردنی کاڵا
                </button>
              </div>

              {/* لیستی کاڵاکان بە شێوازی کارت (Card View) کە بۆ مۆبایل نایابە */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 text-sm">شتومەکەکان ({items.length})</h3>
                {items.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl text-sm">
                    هیچ شتومەکێک نەخراوەتە ناو ئەم وەسڵە
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex justify-between items-center gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                          <span className="font-bold text-slate-900 text-base">{item.name}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono" dir="ltr">
                          {item.width}m × {item.length}m
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-slate-400 block">کۆ</span>
                        <span className="font-black text-blue-600 text-base">
                          {calculateTotal(item.width, item.length).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* کۆی گشتی پارە */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex justify-between items-center">
                <span className="text-slate-300 text-sm font-bold">کۆی گشتی وەسڵ:</span>
                <span className="text-2xl font-black text-blue-400 tracking-wider font-mono">
                  {grandTotal.toLocaleString()}
                </span>
              </div>

            </div>
          </div>
        )}

      </main>

      <footer className="w-full py-4 text-center text-slate-500 font-medium text-xs tracking-wide bg-white border-t border-slate-200 mt-auto">
        Designed & Developed by <span className="font-bold text-slate-700">Eng. Masrour</span>
      </footer>
    </div>
  );
}