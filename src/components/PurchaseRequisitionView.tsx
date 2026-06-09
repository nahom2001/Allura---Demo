import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tooltip, Tag } from 'antd';
import { PlusOutlined, FileSearchOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Search, Hash, Layers, Calendar } from 'lucide-react';
import { PurchaseRequisition, SystemUser } from '../types';

interface PurchaseRequisitionViewProps {
  purchaseRequisitions: PurchaseRequisition[];
  onAddRequisition: (req: PurchaseRequisition) => void;
  systemUsers: SystemUser[];
}

export default function PurchaseRequisitionView({
  purchaseRequisitions,
  onAddRequisition,
  systemUsers
}: PurchaseRequisitionViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  const handleCreate = (values: any) => {
    const newPr: PurchaseRequisition = {
      id: `pr-${Date.now()}`,
      code: values.code || `PR-${Math.floor(1000 + Math.random() * 9000)}`,
      date: values.date || new Date().toISOString().split('T')[0],
      srCode: values.srCode || `SR-${Math.floor(11000 + Math.random() * 1000)}`,
      description: values.description,
      unit: values.unit,
      requestedQty: values.requestedQty
    };
    onAddRequisition(newPr);
    setIsOpen(false);
    form.resetFields();
  };

  const filteredPrs = purchaseRequisitions.filter(pr => {
    const normalizedQuery = searchQuery.toLowerCase();
    return (
      pr.code.toLowerCase().includes(normalizedQuery) ||
      pr.description.toLowerCase().includes(normalizedQuery) ||
      pr.srCode.toLowerCase().includes(normalizedQuery) ||
      pr.unit.toLowerCase().includes(normalizedQuery)
    );
  });

  const columns = [
    {
      title: 'PR-No',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50/80 px-2 py-1 rounded border border-blue-100">
          {code}
        </span>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (date: string) => (
        <span className="text-slate-650 flex items-center gap-1.5 font-sans font-medium">
          <Calendar size={13} className="text-slate-400" />
          {date}
        </span>
      )
    },
    {
      title: 'SR Reference',
      dataIndex: 'srCode',
      key: 'srCode',
      width: 140,
      render: (srCode: string) => (
        <span className="font-mono text-slate-500 font-semibold">{srCode || 'SR-EXTERNAL'}</span>
      )
    },
    {
      title: 'Material / Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => <span className="font-sans font-bold text-slate-800">{desc}</span>
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
      render: (unit: string) => (
        <span className="font-mono text-[11px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded border border-slate-200/50">
          {unit}
        </span>
      )
    },
    {
      title: 'Requested Qty',
      dataIndex: 'requestedQty',
      key: 'requestedQty',
      width: 130,
      align: 'center' as const,
      render: (qty: number) => (
        <span className="font-mono text-slate-900 font-bold text-center block">
          {qty.toLocaleString()}
        </span>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 145,
      align: 'center' as const,
      render: (record: PurchaseRequisition) => {
        // Simple logic for status demo
        const isPoCreated = record.code === 'PR-2460';
        return isPoCreated ? (
          <Tag color="success" className="font-semibold flex items-center gap-1 w-fit rounded">
            <CheckCircleOutlined /> Ordered
          </Tag>
        ) : (
          <Tag color="processing" className="font-semibold flex items-center gap-1 w-fit rounded">
            <ClockCircleOutlined /> Reconciled
          </Tag>
        );
      }
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs font-sans text-xs">
      
      {/* Header Controls */}
      <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
        
        <div className="text-left">
          <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <FileSearchOutlined style={{ color: '#033096', fontSize: '15px' }} />
            Purchase Requisitions (PR Ledger)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Compare material requests registered by construction coordinators and project sites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search tool */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PR ref, material name, or unit..."
              className="w-full pl-3 pr-9 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition shadow-3xs"
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
                code: `PR-${Math.floor(2500 + Math.random() * 7000)}`,
                srCode: `SR-${Math.floor(12100 + Math.random() * 800)}`,
                date: new Date().toISOString().split('T')[0],
                requestedQty: 100
              });
              setIsOpen(true);
            }}
            className="font-semibold flex items-center shadow-xs h-8.5 bg-[#033096] border-[#033096] hover:bg-blue-800"
          >
            Register PR
          </Button>
        </div>

      </div>

      {/* PR Table Grid */}
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

      {/* Reg PR Modal */}
      <Modal
        open={isOpen}
        title={
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
            <Layers size={18} className="text-[#033096]" />
            <span className="text-[14px] font-bold text-slate-900 font-sans">Register Purchase Requisition</span>
          </div>
        }
        onCancel={() => setIsOpen(false)}
        footer={null}
        destroyOnClose
        className="font-sans"
        width={480}
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
              label={<span className="text-slate-650 font-bold text-xs flex items-center gap-1"><Hash size={11} /> PR Code</span>}
              rules={[{ required: true, message: 'Please enter a PR Code' }]}
            >
              <Input className="h-8.5 font-mono text-xs" />
            </Form.Item>

            <Form.Item
              name="srCode"
              label={<span className="text-slate-650 font-bold text-xs flex items-center gap-1"><Hash size={11} /> Requisition Ref (SR)</span>}
              rules={[{ required: true, message: 'Please specify SR code' }]}
            >
              <Input className="h-8.5 font-mono text-xs" placeholder="SR-12130" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={<span className="text-slate-650 font-bold text-xs">Material Description</span>}
            rules={[{ required: true, message: 'Please input material description' }]}
          >
            <Input className="h-8.5 text-xs text-slate-800 font-bold" placeholder="e.g. Gypsum 25 KG for Chak" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3.5">
            <Form.Item
              name="unit"
              label={<span className="text-slate-650 font-bold text-xs">Unit (UOM)</span>}
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
              label={<span className="text-slate-650 font-bold text-xs">Requested Quantity</span>}
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
              className="bg-[#033096] text-white hover:bg-blue-800 rounded font-semibold text-xs"
            >
              Save Requisition
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
}
