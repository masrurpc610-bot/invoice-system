import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, FileText, 
  Plus, ArrowRight, UserPlus, Store, Trash2,
  Sun, Moon
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

  // دۆخی ڕۆژ و شەو (Dark / Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const sanitizeNumberInput = (str: string) => {
    const converted = str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => {
      return '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString();
    });
    return converted.replace(/[,،]/g, '.');
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

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm('ئایا دڵنیای لە سڕینەوەی ئەم شوێنە؟')) return;

    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      setItems(items.filter(item => item.id !== itemId));
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
    const cleanW = w.replace(/[,،]/g, '.');
    const cleanL = l.replace(/[,،]/g, '.');
    const numW = parseFloat(cleanW) || 0;
    const numL = parseFloat(cleanL) || 0;
    return numW * numL;
  };
  const grandTotal = items.reduce((sum, item) => sum + calculateTotal(item.width, item.length), 0);

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`} dir="rtl">
      
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Store size={22} />
            </div>
            <h1 className="text-xl font-black tracking-tight">سیستەمی وەسڵ</h1>
          </div>

          {/* دوگمەی گۆڕینی دۆخی ڕۆژ و شەو */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
            title="گۆڕینی دۆخی ڕۆژ / شەو"
          >
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-200" />}
            <span className="hidden sm:inline">{isDarkMode ? 'دۆخی ڕۆژ' : 'دۆخی شەو'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-4">
        
        {activePage === 'customers' && (
          <div className="space-y-4">
            <div className={`rounded-2xl shadow-md border p-4 space-y-3 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
              <div>
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>کڕیارەکان</h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>کۆی گشتی: <span className="font-bold text-blue-500">{customers.length}</span> کڕیار</p>
              </div>
              
              <form onSubmit={handleAddCustomer} className="flex gap-2">
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="ناوی کڕیاری نوێ..."
                  className={`px-3.5 py-2.5 border rounded-xl outline-none w-full text-sm font-medium transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'}`}
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold text-sm shadow-md active:scale-95 whitespace-nowrap"
                >
                  <UserPlus size={16} />
                  زیادکردن
                </button>
              </form>
            </div>

            <div className={`rounded-2xl shadow-md border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
              <div className={`p-3.5 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="relative w-full">
                  <input 
                    type="text" 
                    placeholder="گەڕان بەدوای کڕیار..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full py-2.5 px-3 pr-10 border rounded-xl outline-none font-medium text-sm shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'}`}
                  />
                  <Search className="absolute right-3 top-3 text-slate-400" size={16} />
                </div>
              </div>

              <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {filteredCustomers.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-sm font-medium">
                    هیچ کڕیارێک نەدۆزرایەوە
                  </div>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <div key={customer.id} className={`p-3.5 flex items-center justify-between transition-colors gap-2 ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50/40'}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-slate-500 font-bold text-xs">#{index + 1}</span>
                        <h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{customer.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => openCustomerProfile(customer)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${isDarkMode ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'}`}
                        >
                          وەسڵ
                          <ArrowRight size={13} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteCustomer(customer.id, e)}
                          className={`p-2 rounded-xl transition-all shadow-sm ${isDarkMode ? 'bg-red-950/50 text-red-400 hover:bg-red-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                          title="سڕینەوە"
                        >
                          <Trash2 size={15} />
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
                className={`flex items-center gap-1.5 font-bold px-3.5 py-2 rounded-xl border shadow-sm text-xs transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <ArrowRight size={15} />
                گەڕانەوە بۆ کڕیارەکان
              </button>
            </div>

            <div className={`rounded-2xl shadow-lg border p-4 space-y-4 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
              
              <div className={`border-b pb-3 flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <div className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded text-[11px] font-bold mb-1">
                    <FileText size={12} />
                    وەسڵی فەرمی
                  </div>
                  <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedCustomer.name}</h2>
                </div>
                <div className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <div>بەروار: <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{new Date().toLocaleDateString('en-GB')}</span></div>
                  <div>ژمارە: <span className={`font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>#{selectedCustomer.id}</span></div>
                </div>
              </div>

              {/* فرمی زیادکردنی شوێن */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 transition-colors ${isDarkMode ? 'bg-blue-950/20 border-blue-900/40' : 'bg-blue-50/60 border-blue-100'}`}>
                <h3 className="text-xs font-bold text-blue-400">زیادکردنی شوێن</h3>
                <input 
                  ref={nameInputRef}
                  type="text" 
                  placeholder="ناوی شوێن..."
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  onKeyDown={(e) => handleKeyDown(e, widthInputRef)}
                  className={`w-full p-2.5 rounded-xl outline-none border text-right font-medium text-xs shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' : 'bg-white border-blue-200 text-slate-800 focus:border-blue-500'}`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    ref={widthInputRef}
                    type="text" 
                    placeholder="پانی (m)"
                    value={newItem.width}
                    onChange={(e) => setNewItem({...newItem, width: sanitizeNumberInput(e.target.value)})}
                    onKeyDown={(e) => handleKeyDown(e, lengthInputRef)}
                    className={`w-full p-2.5 rounded-xl outline-none border text-center font-mono font-bold text-xs shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' : 'bg-white border-blue-200 text-slate-800 focus:border-blue-500'}`}
                    dir="ltr"
                  />
                  <input 
                    ref={lengthInputRef}
                    type="text" 
                    placeholder="درێژی (m)"
                    value={newItem.length}
                    onChange={(e) => setNewItem({...newItem, length: sanitizeNumberInput(e.target.value)})}
                    onKeyDown={(e) => handleKeyDown(e, 'submit')}
                    className={`w-full p-2.5 rounded-xl outline-none border text-center font-mono font-bold text-xs shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' : 'bg-white border-blue-200 text-slate-800 focus:border-blue-500'}`}
                    dir="ltr"
                  />
                </div>
                <button 
                  onClick={handleAddItem}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus size={16} />
                  زیادکردنی شوێن
                </button>
              </div>

              {/* لیستی شوێنەکان */}
              <div className="space-y-2.5">
                <h3 className={`font-bold text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>شوێنەکان ({items.length})</h3>
                {items.length === 0 ? (
                  <div className={`p-6 text-center text-slate-500 rounded-xl text-xs ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    هیچ شوێنێک نەخراوەتە ناو وەسڵەکە
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div key={item.id} className={`p-3 rounded-xl border flex justify-between items-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500">#{index + 1}</span>
                          <span className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                          {item.width}m × {item.length}m
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left shrink-0">
                          <span className="text-[10px] text-slate-400 block">کۆ</span>
                          <span className="font-black text-blue-400 text-sm font-mono">
                            {calculateTotal(item.width, item.length).toLocaleString()}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className={`p-2 rounded-xl transition-all shadow-sm ${isDarkMode ? 'bg-red-950/50 text-red-400 hover:bg-red-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                          title="سڕینەوەی شوێن"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* کۆی گشتی وەسڵ */}
              <div className="bg-slate-950 text-white p-3.5 rounded-xl shadow-md flex justify-between items-center border border-slate-800">
                <span className="text-slate-400 text-xs font-bold">کۆی گشتی وەسڵ:</span>
                <span className="text-xl font-black text-blue-400 tracking-wider font-mono">
                  {grandTotal.toLocaleString()}
                </span>
              </div>

            </div>
          </div>
        )}

      </main>

      <footer className={`w-full py-3 text-center font-medium text-[11px] border-t mt-auto transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
        Designed & Developed by <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Eng. Masrour</span>
      </footer>
    </div>
  );
}