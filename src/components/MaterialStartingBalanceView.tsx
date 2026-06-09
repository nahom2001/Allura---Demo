import React, { useState } from 'react';
import { Table, Button, InputNumber, Tag, message } from 'antd';
import { AreaChartOutlined, SaveOutlined } from '@ant-design/icons';
import { Search } from 'lucide-react';
import { Material } from '../types';

interface MaterialStartingBalanceViewProps {
  materials: Material[];
  onUpdateMaterial: (updated: Material) => void;
}

export default function MaterialStartingBalanceView({
  materials,
  onUpdateMaterial
}: MaterialStartingBalanceViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Keep local edits in memory
  const [safetyStocks, setSafetyStocks] = useState<Record<string, number>>({});
  const [unitPrices, setUnitPrices] = useState<Record<string, number>>({});

  const handleUpdate = (record: Material) => {
    const nextSafety = safetyStocks[record.id] ?? record.minimumStock ?? 100;
    const nextPrice = unitPrices[record.id] ?? record.unitPrice ?? 10;
    
    onUpdateMaterial({
      ...record,
      minimumStock: nextSafety,
      unitPrice: nextPrice
    });
    message.success(`Threshold updated and saved to ledger for material: ${record.description}`);
  };

  const filtered = materials.filter(m => {
    const q = searchQuery.toLowerCase();
    return m.code.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
  });

  const columns = [
    {
      title: 'Material Code',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => <span className="font-mono font-bold text-slate-800">{code}</span>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <span className="font-sans font-bold text-slate-900">{desc}</span>
    },
    {
      title: 'Starting Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 140,
      align: 'center' as const,
      render: (qty: number, record: Material) => (
        <span className="font-mono font-bold text-slate-700">
          {qty.toLocaleString()} {record.unit}
        </span>
      )
    },
    {
      title: 'Unit Price (ETB)',
      key: 'unitPrice',
      width: 155,
      render: (record: Material) => {
        const val = unitPrices[record.id] ?? record.unitPrice;
        return (
          <InputNumber
            className="w-full h-8.5 font-mono text-xs text-slate-800 font-bold"
            min={0}
            value={val}
            onChange={(val) => {
              if (val !== null) {
                setUnitPrices(prev => ({ ...prev, [record.id]: val }));
              }
            }}
          />
        );
      }
    },
    {
      title: 'Safety Threshold (Min)',
      key: 'minStock',
      width: 175,
      render: (record: Material) => {
        const val = safetyStocks[record.id] ?? record.minimumStock ?? 100;
        return (
          <InputNumber
            className="w-full h-8.5 font-mono text-xs text-slate-800 font-bold"
            min={1}
            value={val}
            onChange={(val) => {
              if (val !== null) {
                setSafetyStocks(prev => ({ ...prev, [record.id]: val }));
              }
            }}
          />
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      align: 'center' as const,
      render: (record: Material) => (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => handleUpdate(record)}
          size="small"
          className="bg-[#033096] border-[#033096] text-white hover:bg-blue-800 text-[11px] font-bold h-8 flex items-center justify-center rounded"
        >
          Save
        </Button>
      )
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs font-sans text-xs">
      <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
        <div className="text-left">
          <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <AreaChartOutlined style={{ color: '#033096', fontSize: '15px' }} />
            Safety stock thresholds & material prices
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure safety levels, ledger initial states, and base prices to activate real-time re-order alerts.
          </p>
        </div>

        {/* Search tool */}
        <div className="relative min-w-[250px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search material code or details..."
            className="w-full pl-3 pr-9 py-1.5 text-xs text-slate-800 placeholder-slate-404 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition shadow-3xs"
          />
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
            <Search size={13} />
          </span>
        </div>
      </div>

      <div className="p-3">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 12 }}
          className="font-medium text-slate-700"
          size="middle"
        />
      </div>

    </div>
  );
}
