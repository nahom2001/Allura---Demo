import React, { useState } from 'react';
import { Card, Grid, Button, Badge, Tag, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Edit3, Trash2, Home } from 'lucide-react';
import { Store } from '../types';

interface LocationViewProps {
  stores: Store[];
  onAddStore: () => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (id: string, name: string) => void;
}

export default function LocationView({
  stores,
  onAddStore,
  onEditStore,
  onDeleteStore
}: LocationViewProps) {
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredStores = stores.filter(store => {
    if (selectedType === 'all') return true;
    return store.type === selectedType;
  });

  const counts = {
    all: stores.length,
    'Main Store': stores.filter(s => s.type === 'Main Store' || s.type === 'Main Central Warehouse').length,
    'Site Store': stores.filter(s => s.type === 'Site Store' || s.type === 'Bole Site Store').length,
    'Warehouse': stores.filter(s => s.type === 'Warehouse').length
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs font-sans text-xs">
      
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
        <div className="text-left">
          <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <Home size={15} className="text-[#033096]" />
            Physical Stores & Project Yards Location Map
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Overview of company warehouses, site stores, storage hubs, and active logistics zones.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddStore}
          className="font-semibold flex items-center shadow-xs h-8.5 bg-[#033096] border-[#033096] hover:bg-blue-800"
        >
          Register Store Location
        </Button>
      </div>

      {/* Type Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2 bg-slate-50/10">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            selectedType === 'all'
              ? 'bg-[#033096] text-white'
              : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'
          }`}
        >
          All Store Types ({counts.all})
        </button>
        <button
          onClick={() => setSelectedType('Main Store')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            selectedType === 'Main Store'
              ? 'bg-[#033096] text-white'
              : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'
          }`}
        >
          Main Warehouses ({counts['Main Store']})
        </button>
        <button
          onClick={() => setSelectedType('Site Store')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            selectedType === 'Site Store'
              ? 'bg-[#033096] text-white'
              : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'
          }`}
        >
          Project Site Stores ({counts['Site Store']})
        </button>
        <button
          onClick={() => setSelectedType('Warehouse')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            selectedType === 'Warehouse'
              ? 'bg-[#033096] text-white'
              : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'
          }`}
        >
          Material Yards ({counts.Warehouse})
        </button>
      </div>

      {/* Grid displays in Card Grid Layout */}
      <div className="p-6 bg-slate-50/20">
        {filteredStores.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 bg-white rounded-xl text-center text-slate-400 font-bold">
            No stores registered matching the selected filter class.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStores.map((store, i) => {
              const displayIdx = String(i + 1).padStart(3, '0');
              const isMain = store.type.toLowerCase().includes('main') || store.type.toLowerCase().includes('warehouse');
              return (
                <div
                  key={store.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs hover:shadow-2xs transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Tag color={isMain ? 'blue' : 'purple'} className="font-bold uppercase tracking-wider text-[9px] rounded">
                        REV - {displayIdx}
                      </Tag>
                      <Tag color="cyan" className="font-bold rounded text-[10px]">
                        {store.type}
                      </Tag>
                    </div>

                    <div className="text-left">
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{store.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Location: Wereda {store.wereda || 'N/A'}, {store.city}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                      REGISTERED: {new Date(store.createdAt || Date.now()).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditStore(store)}
                        className="p-1.5 border border-slate-150 hover:border-blue-400 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                        title="Edit details"
                      >
                        <Edit3 size={11} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => onDeleteStore(store.id, store.name)}
                        className="p-1.5 border border-slate-150 hover:border-red-400 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Deregister"
                      >
                        <Trash2 size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
