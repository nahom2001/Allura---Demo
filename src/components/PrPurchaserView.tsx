import React, { useState } from 'react';
import { Table, Select, Button, message, Tag, Tooltip } from 'antd';
import { UserOutlined, MailOutlined, SafetyCertificateOutlined, CheckCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { Search, UserCheck, Inbox } from 'lucide-react';
import { PurchaseRequisition, SystemUser } from '../types';

interface PrPurchaserViewProps {
  purchaseRequisitions: PurchaseRequisition[];
  systemUsers: SystemUser[];
}

export default function PrPurchaserView({ purchaseRequisitions, systemUsers }: PrPurchaserViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local ledger of assignments so values stay dynamic during testing
  const [assignments, setAssignments] = useState<Record<string, string>>({
    'pr-1': '1', // Nahom T.
    'pr-2': '2', // Endalkachew Amogne
    'pr-3': '3', // Yonatan BT PLC
  });

  const handleAssign = (prId: string, userId: string) => {
    setAssignments(prev => ({
      ...prev,
      [prId]: userId
    }));
    const user = systemUsers.find(u => u.id === userId);
    message.success(`Assigned ${user ? user.name : 'Procurement coordinator'} to this requisition.`);
  };

  const filteredPrs = purchaseRequisitions.filter(pr => {
    const query = searchQuery.toLowerCase();
    return (
      pr.code.toLowerCase().includes(query) ||
      pr.description.toLowerCase().includes(query) ||
      pr.srCode.toLowerCase().includes(query)
    );
  });

  const columns = [
    {
      title: 'PR-Number',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (code: string) => (
        <span className="font-mono font-bold text-[#033096]">
          {code}
        </span>
      )
    },
    {
      title: 'Requested Material',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string, record: PurchaseRequisition) => (
        <div className="flex flex-col text-left">
          <span className="font-sans font-bold text-slate-850">{desc}</span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Linked Requisition: {record.srCode}</span>
        </div>
      )
    },
    {
      title: 'Qty / Unit',
      key: 'qtyUnit',
      width: 140,
      render: (record: PurchaseRequisition) => (
        <span className="font-mono font-bold text-slate-700">
          {record.requestedQty.toLocaleString()} {record.unit}
        </span>
      )
    },
    {
      title: 'Current Assignee (Buyer)',
      key: 'assignee',
      width: 250,
      render: (record: PurchaseRequisition) => {
        const assignedId = assignments[record.id] || '';
        return (
          <div className="flex items-center gap-2">
            <Select
              value={assignedId || undefined}
              onChange={(val) => handleAssign(record.id, val)}
              placeholder="Unassigned"
              className="w-full text-xs font-semibold h-8.5"
              dropdownClassName="text-xs font-semibold text-slate-650"
              allowClear
              options={systemUsers.map(u => ({
                value: u.id,
                label: `${u.name} — ${u.role}`
              }))}
            />
          </div>
        );
      }
    },
    {
      title: 'Procurement State',
      key: 'workload',
      width: 160,
      align: 'center' as const,
      render: (record: PurchaseRequisition) => {
        const assignedId = assignments[record.id];
        if (!assignedId) {
          return (
            <Tag color="warning" className="font-bold uppercase tracking-wider text-[10px] rounded px-2">
              Awaiting Agent
            </Tag>
          );
        }
        return (
          <Tag color="success" className="font-bold uppercase tracking-wider text-[10px] rounded px-2">
            Active Bid Setup
          </Tag>
        );
      }
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs font-sans text-xs">
      
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
        <div className="text-left">
          <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <UserSwitchOutlined style={{ color: '#033096', fontSize: '15px' }} />
            Assign PR Purchaser Coordinators
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Designate Procurement officers and assigned buyers to follow up on material bids.
          </p>
        </div>

        {/* Search tool */}
        <div className="relative min-w-[250px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by PR or material name..."
            className="w-full pl-3 pr-9 py-1.5 text-xs text-slate-800 placeholder-slate-404 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition shadow-3xs"
          />
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
            <Search size={13} />
          </span>
        </div>
      </div>

      {/* Grid List */}
      <div className="p-3">
        <Table
          dataSource={filteredPrs}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="font-medium text-slate-700"
          size="middle"
        />
      </div>

    </div>
  );
}
