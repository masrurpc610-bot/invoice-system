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

  // فەنکشنی سڕینەوەی کڕیار
  const handleDeleteCustomer = async (customerId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // بۆ ئەوەی نەچێتە ناو وەسڵەکەوە کاتێک کرتە لەسەر سڕینەوە دەکەیت
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-inner text-white">
              <Store size={26} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">سیستەمی وەسڵ</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        
        {activePage === 'customers' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900">کڕیارەکان</h2>
                <p className="text-slate-500 mt-1 font-medium">کۆی گشتی: <span className="font-bold text-blue-600">{customers.length}</span> کڕیار</p>
              </div>
              
              <form onSubmit={handleAddCustomer} className="flex w-full md:w-auto gap-3">
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="ناوی کڕیاری نوێ..."
                  className="px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-80 font-medium transition-all"
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95 whitespace-nowrap font-bold"
                >
                  <UserPlus size={20} />
                  زیادکردن
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="relative w-full max-w-md">
                  <input 
                    type="text" 
                    placeholder="گەڕان بەدوای کڕیار..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 py-3.5 px-5 pr-12 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium shadow-sm transition-all"
                  />
                  <Search className="absolute right-4 top-4 text-slate-400" size={20} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                      <th className="p-5 w-16 font-bold">#</th>
                      <th className="p-5 font-bold">ناوی کڕیار</th>
                      <th className="p-5 text-left font-bold">کردارەکان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-20 text-center text-slate-400 font-medium">
                          هیچ کڕیارێک نەدۆزرایەوە
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer, index) => (
                        <tr key={customer.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-5 text-slate-400 font-bold">{index + 1}</td>
                          <td className="p-5 font-bold text-slate-800 text-lg">{customer.name}</td>
                          <td className="p-5 text-left">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={(e) => handleDeleteCustomer(customer.id, e)}
                                className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
                                title="سڕینەوەی کڕیار"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button 
                                onClick={() => openCustomerProfile(customer)}
                                className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                              >
                                کردنەوەی وەسڵ
                                <ArrowRight size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activePage === 'invoice' && selectedCustomer && (
          <div className="space-y-6">
            
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setActivePage('customers')}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-2 font-bold bg-white hover:bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all"
              >
                <ArrowRight size={18} />
                گەڕانەوە بۆ کڕیارەکان
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 md:p-12">
              
              <div className="border-b-2 border-blue-100 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold">
                    <FileText size={20} />
                    وەسڵی فەرمی
                  </div>
                  <div className="flex items-end gap-3 text-2xl">
                    <span className="text-slate-400 font-medium">بۆ بەڕێز:</span>
                    <span className="font-black text-slate-900 border-b-2 border-dashed border-blue-300 pb-1">{selectedCustomer.name}</span>
                  </div>
                </div>
                
                <div className="text-left space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100 w-full md:w-72 shadow-inner">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">بەروار:</span>
                    <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">ژمارەی وەسڵ:</span>
                    <span className="font-bold text-slate-800 font-mono">#{selectedCustomer.id}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-center">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <th className="p-4 w-12 border-l border-slate-200 font-bold">#</th>
                      <th className="p-4 text-right border-l border-slate-200 font-bold">ناوی شوێنەکان</th>
                      <th className="p-4 w-32 border-l border-slate-200 font-bold">پانی (m)</th>
                      <th className="p-4 w-32 border-l border-slate-200 font-bold">درێژی (m)</th>
                      <th className="p-4 w-48 font-bold text-blue-700">کۆی گشتی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 border-l border-slate-100 text-slate-400 font-bold">{index + 1}</td>
                        <td className="p-4 text-right font-bold text-slate-800 border-l border-slate-100 text-lg">{item.name}</td>
                        <td className="p-4 border-l border-slate-100 font-mono text-slate-600 bg-slate-50/50 text-lg" dir="ltr">{item.width}</td>
                        <td className="p-4 border-l border-slate-100 font-mono text-slate-600 bg-slate-50/50 text-lg" dir="ltr">{item.length}</td>
                        <td className="p-4 font-black text-blue-600 text-xl bg-blue-50/30">
                          {calculateTotal(item.width, item.length).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    
                    <tr className="bg-blue-50/60 border-t-2 border-blue-200 shadow-inner">
                      <td className="p-3 border-l border-blue-100">
                        <div className="bg-blue-200 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto">
                          <Plus size={18} />
                        </div>
                      </td>
                      <td className="p-3 border-l border-blue-100">
                        <input 
                          ref={nameInputRef}
                          type="text" 
                          placeholder="ناوی شوێن بنووسە (ئینتەر بکە)..."
                          value={newItem.name}
                          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                          onKeyDown={(e) => handleKeyDown(e, widthInputRef)}
                          className="w-full bg-white p-3.5 rounded-xl outline-none border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-right font-bold shadow-sm transition-all"
                        />
                      </td>
                      <td className="p-3 border-l border-blue-100">
                        <input 
                          ref={widthInputRef}
                          type="text" 
                          placeholder="پانی"
                          value={newItem.width}
                          onChange={(e) => setNewItem({...newItem, width: convertNumbersToEnglish(e.target.value)})}
                          onKeyDown={(e) => handleKeyDown(e, lengthInputRef)}
                          className="w-full bg-white p-3.5 rounded-xl outline-none border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-center font-mono font-bold shadow-sm transition-all text-lg"
                          dir="ltr"
                        />
                      </td>
                      <td className="p-3 border-l border-blue-100">
                        <input 
                          ref={lengthInputRef}
                          type="text" 
                          placeholder="درێژی"
                          value={newItem.length}
                          onChange={(e) => setNewItem({...newItem, length: convertNumbersToEnglish(e.target.value)})}
                          onKeyDown={(e) => handleKeyDown(e, 'submit')}
                          className="w-full bg-white p-3.5 rounded-xl outline-none border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-center font-mono font-bold shadow-sm transition-all text-lg"
                          dir="ltr"
                        />
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={handleAddItem}
                          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 text-lg"
                        >
                          زیادکردن
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-12 flex justify-end">
                <div className="bg-slate-900 text-white p-1.5 rounded-2xl shadow-xl flex items-center border border-slate-800 pr-8">
                  <span className="text-slate-300 text-lg font-bold">کۆی گشتی مەتری وەسڵ:</span>
                  <div className="bg-black ml-1.5 mr-6 px-10 py-5 rounded-xl border border-slate-700 shadow-inner">
                    <span className="text-5xl font-black text-blue-400 tracking-wider">
                      {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      <footer className="w-full py-6 text-center text-slate-500 font-medium text-sm tracking-wide bg-white border-t border-slate-200 mt-auto">
        Designed and Developed by <span className="font-bold text-slate-700">Eng. Masrour</span>
      </footer>
    </div>
  );
}