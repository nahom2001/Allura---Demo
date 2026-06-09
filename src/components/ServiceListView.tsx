import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Tag } from 'antd';
import { PlusOutlined, ToolOutlined, DollarOutlined } from '@ant-design/icons';
import { Search, Construction } from 'lucide-react';

export default function ServiceListView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm();
  
  const [services, setServices] = useState([
    { id: '1', name: 'Coil Rewinding Service', category: 'Machinery Maintenance', averageCost: 4500, provider: 'Bole Motor Rewinders Plc', code: 'SRV-001' },
    { id: '2', name: 'Subcontract Trench Excavation', category: 'Civil Works', averageCost: 125000, provider: 'Excel Earth Movers SC', code: 'SRV-002' },
    { id: '3', name: 'Tower Crane Assembly & Calibration', category: 'Heavy Equipment Logistics', averageCost: 35000, provider: 'Yotek Equipment Assembly', code: 'SRV-004' }
  ]);

  const handleCreate = (values: any) => {
    setServices(prev => [
      ...prev,
      {
        id: String(Date.now()),
        code: `SRV-00${prev.length + 1}`,
        name: values.name,
        category: values.category,
        averageCost: values.averageCost,
        provider: values.provider
      }
    ]);
    setIsOpen(false);
    form.resetFields();
  };

  const filtered = services.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q);
  });

  const columns = [
    {
      title: 'Service Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (code: string) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">{code}</span>
    },
    {
      title: 'Service Name / Description',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-sans font-bold text-slate-800">{name}</span>
    },
    {
      title: 'Industry Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="cyan" className="font-sans font-semibold rounded">{cat}</Tag>
    },
    {
      title: 'Preferred Provider Contract',
      dataIndex: 'provider',
      key: 'provider',
      render: (p: string) => <span className="font-sans font-medium text-slate-600">{p}</span>
    },
    {
      title: 'Est Rate (ETB)',
      dataIndex: 'averageCost',
      key: 'averageCost',
      width: 160,
      align: 'right' as const,
      render: (cost: number) => <span className="font-mono font-bold text-slate-850 px-2 py-0.5">{cost.toLocaleString()}</span>
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs font-sans text-xs">
      <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
        <div className="text-left">
          <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <ToolOutlined style={{ color: '#033096', fontSize: '15px' }} />
            Construction & Machine Services Directory
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Log external service providers, machine calibrations, motor rewinding, and crane assembly rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter services..."
              className="w-full pl-3 pr-9 py-1.5 text-xs text-slate-800 placeholder-slate-404 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition shadow-3xs"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
              <Search size={13} />
            </span>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsOpen(true)}
            className="font-semibold flex items-center shadow-xs h-8.5 bg-[#033096] border-[#033096] hover:bg-blue-800"
          >
            Add Service Listing
          </Button>
        </div>
      </div>

      <div className="p-3">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          className="font-medium text-slate-700"
          size="middle"
        />
      </div>

      <Modal
        open={isOpen}
        title={
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Construction size={18} className="text-[#033096]" />
            <span className="text-[14px] font-bold text-slate-900 font-sans">Add Service Listing</span>
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
          <Form.Item
            name="name"
            label={<span className="text-slate-650 font-bold text-xs">Service Description</span>}
            rules={[{ required: true, message: 'Please input service description' }]}
          >
            <Input className="h-8.5 text-xs text-slate-800 font-bold" placeholder="e.g. Concrete Pumping Service" />
          </Form.Item>

          <Form.Item
            name="category"
            label={<span className="text-slate-650 font-bold text-xs">Category Class</span>}
            rules={[{ required: true, message: 'Specify class' }]}
            initialValue="Machinery Rental"
          >
            <Input className="h-8.5 text-xs" />
          </Form.Item>

          <Form.Item
            name="provider"
            label={<span className="text-slate-650 font-bold text-xs">Preferred Nominated Provider</span>}
            rules={[{ required: true, message: 'Please identify nominated supplier' }]}
          >
            <Input className="h-8.5 text-xs" placeholder="Company Name Plc" />
          </Form.Item>

          <Form.Item
            name="averageCost"
            label={<span className="text-slate-650 font-bold text-xs">Estimated Cost Rate (ETB)</span>}
            rules={[{ required: true, message: 'Input estimated cost' }]}
          >
            <InputNumber className="w-full h-8.5 text-xs font-mono font-bold" min={0} />
          </Form.Item>

          <div className="mt-6 flex justify-end gap-2.5">
            <Button onClick={() => setIsOpen(false)} className="rounded font-semibold text-xs border border-slate-205">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-[#033096] text-white hover:bg-blue-800 rounded font-semibold text-xs"
            >
              Add Service
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
}
