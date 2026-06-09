import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Tag, Select } from 'antd';
import { PlusOutlined, FileTextOutlined, HourglassOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Search, FolderOpen } from 'lucide-react';
import { SystemUser } from '../types';

interface StoreRequisitionViewProps {
  systemUsers: SystemUser[];
}

export default function StoreRequisitionView({ systemUsers }: StoreRequisitionViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm();

  const [requisitions, setRequisitions] = useState([
    { id: 'sr-1', code: 'SR-12130', date: '2026-06-03', description: "Brush 3/4'", unit: 'PCS', requestedQty: 4, requesterId: '1', status: 'Approved' },
    { id: 'sr-2', code: 'SR-12001', date: '2026-06-03', description: 'Cement PPC (bulk)', unit: 'Quintal', requestedQty: 2500, requesterId: '2', status: 'Approved' },
    { id: 'sr-3', code: 'SR-12300', date: '2026-06-05', description: 'Reinforcement Steel 12mm', unit: 'PCS', requestedQty: 120, requesterId: '1', status: 'Pending Approval' },
    { id: 'sr-4', code: 'SR-12340', date: '2026-06-08', description: 'Bitumen Emulsion MC30', unit: 'Lt.', requestedQty: 800, requesterId: '3', status: 'Draft' }
  ]);

  const handleCreate = (values: any) => {
    setRequisitions(prev => [
      ...prev,
      {
        id: `sr-${Date.now()}`,
        code: values.code || `SR-${Math.floor(12400 + Math.random() * 500)}`,
        date: values.date || new Date().toISOString().split('T')[0],
        description: values.description,
        unit: values.unit,
        requestedQty: values.requestedQty,
        requesterId: values.requesterId || '1',
        status: 'Draft'
      }
    ]);
    setIsOpen(false);
    form.resetFields();
  };

  const filtered = requisitions.filter(r => {
    const q = searchQuery.toLowerCase();
    return r.code.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  const columns = [
    {
      title: 'Store Requisition No',
      dataIndex: 'code',
      key: 'code',
      width: 170,
      render: (code: string) => <span className="font-mono font-bold text-[#722ed1] bg-[#f9f5ff] px-2.5 py-1 rounded border border-[#e8d9ff]">{code}</span>
    },
    {
      title: 'Date Logged',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (d: string) => <span className="text-slate-500 font-sans font-semibold">{d}</span>
    },
    {
      title: 'Material Name / Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => <span className="font-sans font-bold text-slate-800">{desc}</span>
    },
    {
      title: 'Required Quantity',
      key: 'qtyUnit',
      width: 155,
      render: (record: any) => (
        <span className="font-mono font-bold text-slate-700">
          {record.requestedQty.toLocaleString()} {record.unit}
        </span>
      )
    },
    {
      title: 'Logged By',
      dataIndex: 'requesterId',
      key: 'requesterId',
      width: 150,
      render: (reqId: string) => {
        const user = systemUsers.find(u => u.id === reqId);
        return <span className="font-sans font-bold text-slate-600">{user ? user.name : 'Store Coordinator'}</span>;
      }
    },
    {
      title: 'Approval Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center' as const,
      render: (status: string) => {
        const isApproved = status === 'Approved';
        const isPending = status === 'Pending Approval';
        return (
          <Tag color={isApproved ? 'success' : isPending ? 'processing' : 'default'} className="font-sans font-bold rounded">
            {isApproved ? <CheckCircleOutlined /> : <HourglassOutlined />} {status}
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
            <FileTextOutlined style={{ color: '#722ed1', fontSize: '15px' }} />
            Internal Store Requisitions (SR Directory)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Log internal material requisition releases before formulating bids or dispatching purchase actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SR references..."
              className="w-full pl-3 pr-9 py-1.5 text-xs text-slate-800 placeholder-slate-404 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition shadow-3xs"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
              <Search size={13} />
            </span>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.setFieldsValue({
                code: `SR-${Math.floor(12400 + Math.random() * 500)}`,
                date: new Date().toISOString().split('T')[0],
                requestedQty: 50,
                requesterId: '1'
              });
              setIsOpen(true);
            }}
            className="font-semibold flex items-center shadow-xs h-8.5 bg-[#722ed1] border-[#722ed1] hover:bg-purple-800 hover:border-purple-800"
          >
            Create Store Requisition (SR)
          </Button>
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

      <Modal
        open={isOpen}
        title={
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <FolderOpen size={18} className="text-[#722ed1]" />
            <span className="text-[14px] font-bold text-slate-900 font-sans">Create Store Requisition</span>
          </div>
        }
        onCancel={() => setIsOpen(false)}
        footer={null}
        destroyOnClose
        width={420}
        className="font-sans"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          className="pt-4 text-xs font-semibold"
        >
          <div className="grid grid-cols-2 gap-3.5">
            <Form.Item
              name="code"
              label={<span className="text-slate-650 font-bold text-xs">SR Code</span>}
              rules={[{ required: true, message: 'Please input code' }]}
            >
              <Input className="h-8.5 font-mono text-xs" />
            </Form.Item>

            <Form.Item
              name="requesterId"
              label={<span className="text-slate-650 font-bold text-xs">Requesting Officer</span>}
              rules={[{ required: true, message: 'Select user' }]}
            >
              <Select
                className="w-full text-xs"
                style={{ height: '34px' }}
                options={systemUsers.map(u => ({ value: u.id, label: u.name }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={<span className="text-slate-650 font-bold text-xs">Requested Material Details</span>}
            rules={[{ required: true, message: 'Please input details' }]}
          >
            <Input className="h-8.5 text-xs text-slate-800 font-bold" placeholder="e.g. Copper Wire spool" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3.5">
            <Form.Item
              name="unit"
              label={<span className="text-slate-650 font-bold text-xs">Unit Type</span>}
              rules={[{ required: true, message: 'Select unit' }]}
              initialValue="PCS"
            >
              <Select
                className="w-full text-xs"
                style={{ height: '34px' }}
                options={[
                  { value: 'PCS', label: 'Pieces (PCS)' },
                  { value: 'Quintal', label: 'Quintal' },
                  { value: 'Bag', label: 'Bag (Pcs)' },
                  { value: 'M²', label: 'Square Meter (M²)' },
                  { value: 'M³', label: 'Cubic Meter (M³)' },
                  { value: 'Lt.', label: 'Liters (Lt.)' },
                  { value: 'KM', label: 'Kilometers (KM)' }
                ]}
              />
            </Form.Item>

            <Form.Item
              name="requestedQty"
              label={<span className="text-slate-650 font-bold text-xs">Required Qty</span>}
              rules={[{ required: true, message: 'Input quantity' }]}
            >
              <InputNumber className="w-full h-8.5 text-xs font-mono font-bold" min={1} />
            </Form.Item>
          </div>

          <div className="mt-6 flex justify-end gap-2.5">
            <Button onClick={() => setIsOpen(false)} className="rounded font-semibold text-xs border border-slate-205">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-[#722ed1] text-white hover:bg-purple-800 rounded font-semibold text-xs"
            >
              Save Store Requisition
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
}
