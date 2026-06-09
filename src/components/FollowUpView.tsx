import React, { useState } from 'react';
import { Table, Steps, Tag, Modal, Button, Radio, Input, message } from 'antd';
import { TruckOutlined, ClockCircleOutlined, SafetyOutlined, MessageOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Search, Calendar, FileText } from 'lucide-react';
import { PurchaseOrder } from '../types';

interface FollowUpViewProps {
  purchaseOrders: PurchaseOrder[];
}

export default function FollowUpView({ purchaseOrders }: FollowUpViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  
  // Local track of status milestones so they are dynamic for users testing
  const [shippingStatuses, setShippingStatuses] = useState<Record<string, { currentStep: number; log: string }>>({
    'po-1': { currentStep: 3, log: 'Material arrived at Port of Djibouti. Moving to gate inspection.' },
    'po-2': { currentStep: 1, log: 'Proforma quote verified. Purchase order dispatched to supplier.' },
    'po-3': { currentStep: 4, log: 'Full delivery successfully dispatched to Addis site store yard.' }
  });

  const handleUpdateStep = (poId: string, step: number) => {
    setShippingStatuses(prev => ({
      ...prev,
      [poId]: {
        currentStep: step,
        log: prev[poId]?.log || 'Log notes initiated.'
      }
    }));
    message.success('Delivery tracking milestone adjusted successfully.');
  };

  const handleUpdateLog = (poId: string, note: string) => {
    setShippingStatuses(prev => ({
      ...prev,
      [poId]: {
        currentStep: prev[poId]?.currentStep ?? 1,
        log: note
      }
    }));
  };

  const filteredPos = purchaseOrders.filter(po => {
    const query = searchQuery.toLowerCase();
    return (
      po.poNumber.toLowerCase().includes(query) ||
      po.supplierName.toLowerCase().includes(query) ||
      po.deliverySite.toLowerCase().includes(query)
    );
  });

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 120,
      render: (num: string) => (
        <span className="font-mono font-bold text-slate-900">
          {num}
        </span>
      )
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (name: string) => <span className="font-sans font-bold text-slate-800">{name}</span>
    },
    {
      title: 'Delivery Site',
      dataIndex: 'deliverySite',
      key: 'deliverySite',
      ellipsis: true,
      render: (site: string) => <span className="font-semibold text-slate-600 text-[11px]">{site}</span>
    },
    {
      title: 'PO Value',
      key: 'val',
      width: 140,
      render: (record: PurchaseOrder) => (
        <span className="font-mono font-bold text-emerald-700">
          {record.netPayableAmount.toLocaleString()} {record.currency || 'ETB'}
        </span>
      )
    },
    {
      title: 'Milestone Tracking',
      key: 'milestone',
      width: 280,
      render: (record: PurchaseOrder) => {
        const status = shippingStatuses[record.id] || { currentStep: 1, log: 'PO Order generated.' };
        const labelMap = ['Draft', 'Sent', 'Customs', 'Transit', 'Fulfilled'];
        const colorMap = ['default', 'processing', 'warning', 'warning', 'success'];
        return (
          <div className="flex flex-col text-left">
            <Tag color={colorMap[status.currentStep] as any} className="font-bold text-[10px] uppercase w-fit rounded">
              {labelMap[status.currentStep]} — {status.currentStep === 4 ? 'At Store Site' : 'En Route'}
            </Tag>
            <p className="text-[10px] text-slate-500 font-mono mt-1 italic max-w-xs truncate" title={status.log}>
              {status.log}
            </p>
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 130,
      align: 'center' as const,
      render: (record: PurchaseOrder) => (
        <Button 
          icon={<TruckOutlined />} 
          size="small" 
          onClick={() => setSelectedPo(record)}
          className="text-[11px] font-bold text-blue-700 border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 rounded-lg"
        >
          Track Order
        </Button>
      )
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs font-sans text-xs">
      
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
        <div className="text-left">
          <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <TruckOutlined style={{ color: '#033096', fontSize: '15px' }} />
            Procurement Follow Up & Shipment Tracking
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Monitor real-time transit status, custom declarations, and warehouse check-in for dispatch goods.
          </p>
        </div>

        {/* Search Input bar */}
        <div className="relative min-w-[250px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO num or supplier..."
            className="w-full pl-3 pr-9 py-1.5 text-xs text-slate-800 placeholder-slate-404 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition shadow-3xs"
          />
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
            <Search size={13} />
          </span>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="p-3">
        <Table
          dataSource={filteredPos}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="font-medium text-slate-700"
          size="middle"
        />
      </div>

      {/* Track PO Shipment Modal */}
      {selectedPo && (() => {
        const tracking = shippingStatuses[selectedPo.id] || { currentStep: 1, log: 'Order dispatch generated.' };
        return (
          <Modal
            open={!!selectedPo}
            title={
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <TruckOutlined className="text-[#033096]" />
                <span className="text-[14px] font-bold text-slate-900 font-sans">
                  Shipment Tracking — PO No. {selectedPo.poNumber}
                </span>
              </div>
            }
            onCancel={() => setSelectedPo(null)}
            footer={[
              <Button key="close" type="default" onClick={() => setSelectedPo(null)} className="rounded font-semibold text-xs border-slate-205">
                Close Tracker
              </Button>
            ]}
            width={580}
            destroyOnClose
            className="font-sans"
          >
            <div className="py-4 space-y-6 text-left text-xs font-sans">
              
              <div className="bg-slate-50/80 p-4 border border-slate-150 rounded-lg grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-slate-400 font-bold block">SUPPLIER</span>
                  <span className="text-slate-800 font-bold text-[12px]">{selectedPo.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">DELIVERY SITE TARGET</span>
                  <span className="text-slate-700 font-bold">{selectedPo.deliverySite}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">DELIVERY DUE</span>
                  <span className="text-slate-650 flex items-center gap-1 font-semibold">
                    <Calendar size={12} className="text-slate-400" />
                    {selectedPo.deliveryDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">PO NET PAYABLE</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {selectedPo.netPayableAmount.toLocaleString()} {selectedPo.currency || 'ETB'}
                  </span>
                </div>
              </div>

              {/* Steps timeline representation */}
              <div className="py-3 px-1 border border-slate-100 rounded-lg bg-white shadow-3xs">
                <Steps
                  current={tracking.currentStep}
                  onChange={(step) => handleUpdateStep(selectedPo.id, step)}
                  size="small"
                  direction="horizontal"
                  items={[
                    { title: <span className="text-[10px] font-bold text-slate-500">Draft</span> },
                    { title: <span className="text-[10px] font-bold text-slate-500">Issued</span> },
                    { title: <span className="text-[10px] font-bold text-slate-500">Customs</span> },
                    { title: <span className="text-[10px] font-bold text-slate-500">Transit</span> },
                    { title: <span className="text-[10px] font-bold text-slate-500">Delivered</span> },
                  ]}
                />
              </div>

              {/* Tracking Log update */}
              <div className="space-y-2">
                <span className="text-slate-650 font-bold flex items-center gap-1.5">
                  <MessageOutlined /> Real-time Tracking Notes / Delivery Log
                </span>
                <Input.TextArea
                  rows={3}
                  value={tracking.log}
                  onChange={(e) => handleUpdateLog(selectedPo.id, e.target.value)}
                  placeholder="Insert transit updates, sea logistics reference numbers, custom gate numbers..."
                  className="rounded text-xs font-semibold leading-relaxed border-slate-205 focus:border-blue-500"
                />
              </div>

            </div>
          </Modal>
        );
      })()}

    </div>
  );
}
