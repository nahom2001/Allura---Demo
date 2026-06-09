import React, { useState, useEffect } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  Printer, 
  RotateCcw, 
  Share2, 
  MessageSquare, 
  Eye, 
  Edit3, 
  Check, 
  X,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { PurchaseEvaluation, Supplier, PurchaseRequisition, PurchaseEvaluationItem, SystemUser } from '../types';

interface PurchaseEvaluationViewProps {
  suppliers: Supplier[];
  purchaseRequisitions: PurchaseRequisition[];
  evaluations: PurchaseEvaluation[];
  onSaveEvaluation: (evaluation: PurchaseEvaluation) => void;
  onDeleteEvaluation: (id: string) => void;
  systemUsers?: SystemUser[];
}

export default function PurchaseEvaluationView({
  suppliers,
  purchaseRequisitions,
  evaluations,
  onSaveEvaluation,
  onDeleteEvaluation,
  systemUsers = []
}: PurchaseEvaluationViewProps) {
  
  // App filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Modal registration state
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<PurchaseEvaluation | null>(null);

  // Revision action state
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [revisionRemark, setRevisionRemark] = useState('');

  // Form Fields inside Modal
  const [evaluationCode, setEvaluationCode] = useState('');
  const [evaluationDate, setEvaluationDate] = useState('2026-06-03');
  const [selectedPrId, setSelectedPrId] = useState('');
  const [orderedQty, setOrderedQty] = useState<number>(0);
  const [srCode, setSrCode] = useState('');
  const [comparisons, setComparisons] = useState<Omit<PurchaseEvaluationItem, 'id'>[]>([]);
  const [technicalReviewBy, setTechnicalReviewBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [evaluationRemark, setEvaluationRemark] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string; dataUrl: string } | null>(null);

  // File loading utility to read as data URL
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFile({
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Auto-fill form values based on selected Purchase Requisition
  const activePR = purchaseRequisitions.find(pr => pr.id === selectedPrId);

  useEffect(() => {
    if (activePR) {
      setSrCode(activePR.srCode);
      // Only set ordered quantity to requested quantity initially if it was 0 or a new form
      if (!editingEvaluation) {
        setOrderedQty(activePR.requestedQty);
      }
    } else {
      setSrCode('');
    }
  }, [selectedPrId, activePR]);

  // Handle open registration / evaluation form
  const handleOpenNewForm = () => {
    setEditingEvaluation(null);
    setEvaluationRemark('');
    setUploadedFile(null);
    // Find next sequential code/ID based on highest existing badge No.
    const numericCodes = evaluations.map(b => parseInt(b.code, 10)).filter(n => !isNaN(n));
    const nextCode = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 1539;
    
    setEvaluationCode(String(nextCode));
    setEvaluationDate('2026-06-03');
    setSelectedPrId(purchaseRequisitions[0]?.id || '');
    setOrderedQty(purchaseRequisitions[0]?.requestedQty || 0);
    setSrCode(purchaseRequisitions[0]?.srCode || '');
    setTechnicalReviewBy('');
    setApprovedBy('');
    
    // Seed structure with one initial comparison row using a registered supplier
    const firstSupplierId = suppliers[0]?.id || '';
    setComparisons([
      {
        supplierId: firstSupplierId,
        price: 0,
        taxRate: 15,
        discount: 0,
        status: 'Contender',
        winningReason: undefined,
        remark: ''
      }
    ]);
    setIsRegistrarOpen(true);
  };

  // Handle Edit registration form
  const handleOpenEditForm = (evaluation: PurchaseEvaluation) => {
    setEditingEvaluation(evaluation);
    setEvaluationCode(evaluation.code);
    setEvaluationDate(evaluation.date);
    setSelectedPrId(evaluation.prId);
    setOrderedQty(evaluation.orderedQty);
    setSrCode(evaluation.srCode);
    setTechnicalReviewBy(evaluation.technicalReviewBy || '');
    setApprovedBy(evaluation.approvedBy || '');
    setEvaluationRemark(evaluation.remark || '');
    setUploadedFile(evaluation.attachment || null);
    setComparisons(evaluation.comparisons.map(c => ({
      supplierId: c.supplierId,
      price: c.price,
      taxRate: c.taxRate,
      discount: c.discount,
      status: c.status,
      winningReason: c.winningReason,
      remark: c.remark || ''
    })));
    setIsRegistrarOpen(true);
  };

  // Add another supplier comparison row
  const handleAddComparisonRow = () => {
    // Find a supplier not already in comparison, or default to first
    const usedSupplierIds = comparisons.map(c => c.supplierId);
    const unusedSupplier = suppliers.find(s => !usedSupplierIds.includes(s.id)) || suppliers[0];
    
    setComparisons([
      ...comparisons,
      {
        supplierId: unusedSupplier?.id || '',
        price: 0,
        taxRate: 15,
        discount: 0,
        status: 'Contender',
        winningReason: undefined,
        remark: ''
      }
    ]);
  };

  // Delete comparison row
  const handleDeleteComparisonRow = (index: number) => {
    if (comparisons.length <= 1) {
      alert("At least one supplier must be configured for comparison!");
      return;
    }
    setComparisons(comparisons.filter((_, i) => i !== index));
  };

  // Update a comparison row field
  const handleUpdateComparisonRow = (index: number, field: keyof Omit<PurchaseEvaluationItem, 'id'>, value: string | number) => {
    const updated = [...comparisons];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    // If status is flipped to Contender, remove winningReason
    if (field === 'status' && value === 'Contender') {
      updated[index].winningReason = undefined;
    }
    // If status is flipped to Winner, set a default winningReason
    if (field === 'status' && value === 'Winner') {
      updated[index].winningReason = 'Price';
    }

    setComparisons(updated);
  };

  // Handle form Submission
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrId) {
      alert("Please select a Purchase Requisition (PR) to evaluate.");
      return;
    }

    const pr = purchaseRequisitions.find(p => p.id === selectedPrId);
    if (!pr) return;

    // Check that ordered qty is a positive number
    if (orderedQty <= 0) {
      alert("Ordered quantity must be greater than 0");
      return;
    }

    // Determine the status text based on winners
    const hasWinner = comparisons.some(c => c.status === 'Winner');
    const dynamicStatus = hasWinner ? 'Checked (1)' : 'Pending (1)';

    const evaluationData: PurchaseEvaluation = {
      id: editingEvaluation ? editingEvaluation.id : `evaluation-${Date.now()}`,
      code: evaluationCode,
      date: evaluationDate,
      prId: selectedPrId,
      srCode: srCode,
      description: pr.description,
      unit: pr.unit,
      requestedQty: pr.requestedQty,
      orderedQty: orderedQty,
      status: editingEvaluation ? editingEvaluation.status : dynamicStatus,
      remark: evaluationRemark,
      technicalReviewBy: technicalReviewBy,
      approvedBy: approvedBy,
      createdAt: editingEvaluation ? editingEvaluation.createdAt : new Date().toISOString().split('T')[0],
      attachment: uploadedFile || undefined,
      comparisons: comparisons.map((comp, idx) => ({
        id: editingEvaluation?.comparisons[idx]?.id || `bc-${Date.now()}-${idx}`,
        ...comp
      }))
    };

    onSaveEvaluation(evaluationData);
    setIsRegistrarOpen(false);
  };

  // Filter list rows based on search settings
  const filteredEvaluations = evaluations.filter(evaluation => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      evaluation.code.toLowerCase().includes(q) ||
      evaluation.description.toLowerCase().includes(q) ||
      evaluation.srCode.toLowerCase().includes(q) ||
      evaluation.status.toLowerCase().includes(q);

    const matchesPending = !showOnlyPending || evaluation.status.toLowerCase().includes('pending');

    // Date range matches
    let matchesDates = true;
    if (startDate) {
      matchesDates = matchesDates && evaluation.date >= startDate;
    }
    if (endDate) {
      matchesDates = matchesDates && evaluation.date <= endDate;
    }

    return matchesSearch && matchesPending && matchesDates;
  });

  return (
    <div className="flex flex-col gap-5 w-full text-slate-800" id="purchase-evaluation-container">
      
      {/* HEADER CONTROL BAR - Image 1 matching theme */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between no-print">
        
        {/* Search & Pending toggle checkbox */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
          {/* Start Date to End Date filter */}
          <div className="flex items-center gap-1.5 h-9">
            <DatePicker
              placeholder="Start Date"
              value={startDate ? dayjs(startDate) : null}
              onChange={(date) => setStartDate(date ? date.format('YYYY-MM-DD') : '')}
              className="h-9 text-xs font-semibold w-32 font-sans"
              allowClear
            />
            <span className="text-slate-300 font-medium select-none text-xs">→</span>
            <DatePicker
              placeholder="End Date"
              value={endDate ? dayjs(endDate) : null}
              onChange={(date) => setEndDate(date ? date.format('YYYY-MM-DD') : '')}
              className="h-9 text-xs font-semibold w-32 font-sans"
              allowClear
            />
          </div>

          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="search evaluation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-9 bg-white border border-slate-200 rounded-lg text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition"
              id="search-evaluation-material"
            />
          </div>

          {/* Tickbox "Show only Pending" */}
          <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyPending}
              onChange={(e) => setShowOnlyPending(e.target.checked)}
              className="w-4.5 h-4.5 text-blue-700 border-slate-300 rounded focus:ring-blue-500/20"
            />
            <span>Show only Pending</span>
          </label>
        </div>

        {/* Buttons right align */}
        <div className="flex items-center gap-2">
          
          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="w-9 h-9 border border-slate-200 bg-white text-slate-500 hover:text-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition"
            title="Print Purchase Evaluation Report"
          >
            <Printer size={15} />
          </button>

          {/* Reset filter button */}
          <button
            onClick={() => {
              setSearchQuery('');
              setStartDate('');
              setEndDate('');
              setShowOnlyPending(false);
            }}
            className="w-9 h-9 border border-slate-200 bg-white text-slate-400 hover:text-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition"
            title="Clear Date/Search Filters"
          >
            <RotateCcw size={15} />
          </button>

          {/* Register Purchase Evaluation CTA */}
          <button
            onClick={handleOpenNewForm}
            className="h-9 px-4 bg-[#033096] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-down shadow-blue-900/10"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Register Purchase Evaluation</span>
          </button>
        </div>
      </div>

      {/* PURCHASE EVALUATION TABLE LISTING (Image 1) */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto border-collapse text-xs select-none">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold tracking-wide">
                <th className="p-3.5 w-16">No</th>
                <th className="p-3.5 w-24">Date</th>
                <th className="p-3.5 w-32">PR</th>
                <th className="p-3.5">Item</th>
                <th className="p-3.5 w-24">Share</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 w-32 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-600">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText size={28} className="text-slate-250 animate-pulse" />
                      <p className="font-bold text-slate-500 text-xs">No Purchase Evaluations registered yet</p>
                      <p className="text-[10px] text-slate-400 max-w-sm">
                        Click "+ Register Purchase Evaluation" at the top right to compare suppliers of any registered PR!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((evaluation) => {
                  const prRecord = purchaseRequisitions.find(p => p.id === evaluation.prId);
                  
                  return (
                    <React.Fragment key={evaluation.id}>
                      <tr className="hover:bg-slate-50/50 transition duration-150 align-middle">
                        
                        {/* Evaluation Code / No */}
                        <td className="p-3.5 font-bold text-slate-900">
                          {evaluation.code}
                        </td>
  
                        {/* Date */}
                        <td className="p-3.5 text-slate-500 font-medium">
                          {/* Format date to DD/MM/YYYY */}
                          {evaluation.date.split('-').reverse().join('/')}
                        </td>
  
                        {/* PR Reference with beautiful dashed indicator box */}
                        <td className="p-3.5">
                          <span className="inline-block px-3 py-1 bg-white border border-dashed border-slate-300 rounded text-[11px] font-bold text-slate-700 tracking-wider shadow-3xs font-mono">
                            {prRecord ? prRecord.code : 'PR-GENERAL'}
                          </span>
                        </td>
  
                        {/* Material / Service Item Description */}
                        <td className="p-3.5 max-w-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 leading-normal">{evaluation.description}</span>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                {evaluation.orderedQty} {evaluation.unit} Requested
                              </span>
                              {evaluation.attachment && (
                                <a
                                  href={evaluation.attachment.dataUrl}
                                  download={evaluation.attachment.name}
                                  onClick={(e) => e.stopPropagation()}
                                  title={`Download ${evaluation.attachment.name}`}
                                  className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-[#033096] text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow-3xs hover:bg-[#033096] hover:text-white hover:border-[#033096] transition duration-150 animate-fade"
                                >
                                  <svg className="w-3 h-3 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0l-3.536 3.536m3.536-3.536L21 3m-12.728 12.728l-3.536 3.536m0 0l-3.536 3.536m3.536-3.536L3 21" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.12 10.88a3 3 0 114.24 4.24l-4.24 4.24a5 5 0 11-7.07-7.07l1.41-1.41a1 1 0 111.42 1.41l-1.41 1.42a3 3 5 004.24 4.24l4.24-4.24a1 1 0 000-1.41z"/>
                                  </svg>
                                  <span>Clip attached</span>
                                </a>
                              )}
                            </div>
                            {evaluation.remark && (
                              <div className="mt-2 p-2 text-[10px] text-amber-800 bg-amber-50/60 border border-amber-100 rounded-lg font-medium leading-relaxed">
                                <span className="font-bold uppercase tracking-wider text-[9px] text-amber-600 block mb-0.5">Revision Remarks:</span>
                                <span>{evaluation.remark}</span>
                              </div>
                            )}
                          </div>
                        </td>
  
                        {/* Share button mimicking exact look */}
                        <td className="p-3.5">
                          <button className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 font-bold bg-white hover:bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[11px] cursor-pointer shadow-3xs transition">
                            <Share2 size={11} className="text-slate-400" />
                            <span>Share</span>
                          </button>
                        </td>
  
                        {/* Multi-status labels stack matching perfectly with color indicators */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {evaluation.status.split(' · ').map((statusLabel, index) => {
                              const isPending = statusLabel.toLowerCase().includes('pending');
                              const isChecked = statusLabel.toLowerCase().includes('checked');
                              const isPslChecked = statusLabel.toLowerCase().includes('psl');
                              const isRevision = statusLabel.toLowerCase().includes('revision');
                              
                              let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
                              if (isRevision) {
                                badgeClass = "bg-rose-50 text-rose-600 border-rose-200/60";
                              } else if (isPending) {
                                badgeClass = "bg-amber-50 text-amber-600 border-amber-200/60";
                              } else if (isPslChecked) {
                                badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-200/60";
                              } else if (isChecked) {
                                badgeClass = "bg-blue-50 text-blue-600 border-blue-200/50";
                              }
  
                              return (
                                <span 
                                  key={index} 
                                  className={`px-2 py-0.5 border text-[10px] font-bold rounded-md flex items-center justify-center ${badgeClass}`}
                                >
                                  {statusLabel}
                                </span>
                              );
                            })}
                          </div>
                        </td>
  
                        {/* Actions exactly matched */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                if (revisingId === evaluation.id) {
                                  setRevisingId(null);
                                  setRevisionRemark('');
                                } else {
                                  setRevisingId(evaluation.id);
                                  setRevisionRemark(evaluation.remark || '');
                                }
                              }}
                              className={`p-1.5 rounded-md transition cursor-pointer ${
                                revisingId === evaluation.id
                                  ? 'text-amber-600 bg-amber-50'
                                  : 'text-slate-400 hover:text-amber-600 hover:bg-slate-50'
                              }`}
                              title="Revise / Add Remarks"
                            >
                              <RotateCcw size={13} strokeWidth={2.5} />
                            </button>

                            <button
                              onClick={() => handleOpenEditForm(evaluation)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition cursor-pointer"
                              title="Compare Suppliers / Edit evaluation"
                            >
                              <Edit3 size={13} strokeWidth={2.5} />
                            </button>
                            
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this purchase evaluation?")) {
                                  onDeleteEvaluation(evaluation.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-md transition cursor-pointer"
                              title="Delete Purchase Evaluation"
                            >
                              <Trash2 size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
  
                      </tr>

                      {revisingId === evaluation.id && (
                        <tr className="bg-amber-50/20 border-b border-amber-100/50">
                          <td colSpan={7} className="p-4 bg-amber-55/20 text-left">
                            <div className="flex flex-col gap-2.5 max-w-2xl">
                              <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Specify Revision Remarks / Query notes for Evaluation {evaluation.code}
                              </label>
                              <textarea
                                value={revisionRemark}
                                onChange={(e) => setRevisionRemark(e.target.value)}
                                rows={3}
                                placeholder="Write comments or specifications that need to be revised..."
                                className="w-full p-2.5 border border-amber-250 focus:border-amber-500 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500/20 bg-white transition shadow-3xs text-slate-800"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedEvaluation: PurchaseEvaluation = {
                                      ...evaluation,
                                      remark: revisionRemark,
                                      status: evaluation.status.includes('Revision Required')
                                        ? evaluation.status
                                        : `${evaluation.status} · Revision Required`
                                    };
                                    onSaveEvaluation(updatedEvaluation);
                                    setRevisingId(null);
                                    setRevisionRemark('');
                                  }}
                                  className="px-3.5 h-8 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                                >
                                  <Check size={12} strokeWidth={2.5} />
                                  <span>Save Revision Remark</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRevisingId(null);
                                    setRevisionRemark('');
                                  }}
                                  className="px-3 h-8 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION FORM / EVALUATION DIALOG (Images 2 & 3) */}
      {isRegistrarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-5xl flex flex-col overflow-hidden max-h-[92vh]">
            
            {/* Modal Top Information Ribbon */}
            <div className="bg-[#033096] text-white px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-sm font-bold tracking-tight">
                  {editingEvaluation ? `Compare Suppliers - Evaluation No. ${evaluationCode}` : `New Purchase Evaluation & Supplier Comparison`}
                </span>
              </div>
              <button 
                onClick={() => setIsRegistrarOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body Form Scroll Area */}
            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-6 text-left">
              
              {/* TOP SELECTOR BOARD - MATCHING SCREENSHOTS EXACTLY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Date */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 shadow-3xs"
                    required
                  />
                </div>

                {/* 2. Purchase Requisition Selector */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    <span className="text-red-500 mr-1 font-bold">*</span>PR
                  </label>
                  <select
                    value={selectedPrId}
                    onChange={(e) => setSelectedPrId(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 shadow-3xs cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select active PR</option>
                    {purchaseRequisitions.map(pr => (
                      <option key={pr.id} value={pr.id}>
                        {pr.code} ({pr.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. SR Read-only value fetched */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SR</label>
                  <input
                    type="text"
                    value={srCode}
                    disabled
                    placeholder="SR code auto-fetched"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-3xs select-none cursor-not-allowed"
                  />
                </div>

              </div>

              {/* REQUISITION MATERIAL ROW PREVIEW - IMAGE 2 / 3 */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <table className="w-full text-[11px] text-left table-auto border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold">
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 w-28">Unit</th>
                      <th className="p-3 w-32 text-center">Requested Quantity</th>
                      <th className="p-3 w-36 text-center">Ordered Quantity</th>
                      <th className="p-3 w-32 text-center">Remaining Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {activePR ? (
                      <tr className="align-middle">
                        <td className="p-3 text-center font-bold text-slate-400">1</td>
                        <td className="p-3 font-bold text-slate-800">{activePR.description}</td>
                        <td className="p-3 font-mono text-slate-500">{activePR.unit}</td>
                        <td className="p-3 text-center text-slate-800 font-mono font-bold">{activePR.requestedQty}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={orderedQty}
                            onChange={(e) => setOrderedQty(Math.max(1, parseInt(e.target.value, 10) || 0))}
                            min={1}
                            className="w-24 h-8 px-2.5 text-center bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-500 focus:outline-none rounded text-xs font-bold shadow-3xs"
                            required
                          />
                        </td>
                        <td className="p-3 text-center text-slate-400 font-mono">
                          {orderedQty >= activePR.requestedQty ? '-' : activePR.requestedQty - orderedQty}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold italic">
                          Please select a Purchase Requisition (PR) to view details
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* SUPPLIER EVALUATIONS COMPARISON CANVAS PANEL (Images 2 & 3) */}
              <div className="bg-slate-550 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                
                {/* Header Title inside grey container */}
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200/80 px-2.5 py-1 rounded shadow-3xs uppercase">
                    Supplier Purchase Evaluations Comparison Board
                  </span>
                </div>

                <div className="overflow-x-auto bg-slate-50/40">
                  <table className="w-full text-[11px] text-left table-auto border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3 w-10 text-center">No</th>
                        <th className="p-3 w-44">Supplier</th>
                        <th className="p-3 w-24 text-center">Price</th>
                        <th className="p-3 w-28 text-center">Amount</th>
                        <th className="p-3 w-20 text-center">TAX</th>
                        <th className="p-3 w-28 text-center">Discount %</th>
                        <th className="p-3 w-28 text-center">Status</th>
                        <th className="p-3 w-36 text-center">Winning Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {comparisons.map((item, index) => {
                        // Calculate metrics
                        const calculatedAmount = (orderedQty || 0) * (item.price || 0);
                        const discountAmt = calculatedAmount * (item.discount / 100);
                        const afterDiscount = calculatedAmount - discountAmt;
                        const taxAmt = item.taxRate === 15 ? (afterDiscount * 0.15) : 0;
                        const totalWithTax = afterDiscount + taxAmt;

                        const selectedSupplierObj = suppliers.find(s => s.id === item.supplierId);

                        return (
                          <tr key={index} className="align-middle hover:bg-slate-50 transition-colors">
                            
                            {/* Comparison Row Index No */}
                            <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>

                            {/* Supplier Selector fetched from Registered list */}
                            <td className="p-3">
                              <select
                                value={item.supplierId}
                                onChange={(e) => handleUpdateComparisonRow(index, 'supplierId', e.target.value)}
                                className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-3xs"
                                required
                              >
                                {suppliers.map(sup => (
                                  <option key={sup.id} value={sup.id}>
                                    {sup.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Price input */}
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => handleUpdateComparisonRow(index, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-20 h-8 px-2 text-center bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-500 focus:outline-none rounded text-xs font-bold shadow-3xs"
                                placeholder="0"
                                required
                              />
                            </td>

                            {/* Auto-calculated Amount before VAT (Price * Ordered qty) */}
                            <td className="p-3 text-center font-bold text-slate-700 font-mono">
                              {calculatedAmount > 0 ? (
                                <span>{calculatedAmount.toLocaleString()}</span>
                              ) : '-'}
                            </td>

                            {/* TAX select dropdown */}
                            <td className="p-3 text-center">
                              <select
                                value={item.taxRate}
                                onChange={(e) => handleUpdateComparisonRow(index, 'taxRate', parseInt(e.target.value, 10))}
                                className="h-8 px-1 bg-white border border-slate-200 rounded text-[10px] font-bold outline-none cursor-pointer focus:border-blue-500"
                              >
                                <option value={15}>15%</option>
                                <option value={0}>0%</option>
                              </select>
                            </td>

                            {/* Discount select dropdown */}
                            <td className="p-3 text-center">
                              <select
                                value={item.discount}
                                onChange={(e) => handleUpdateComparisonRow(index, 'discount', parseInt(e.target.value, 10))}
                                className="h-8 px-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold outline-none cursor-pointer focus:border-blue-500"
                              >
                                <option value={0}>0%</option>
                                <option value={2}>2%</option>
                                <option value={5}>5%</option>
                                <option value={10}>10%</option>
                                <option value={15}>15%</option>
                              </select>
                            </td>

                            {/* Status: Winner or Contender */}
                            <td className="p-3 text-center">
                              <select
                                value={item.status}
                                onChange={(e) => handleUpdateComparisonRow(index, 'status', e.target.value as 'Winner' | 'Contender')}
                                className="h-8 px-2 bg-white border border-slate-250 rounded text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-blue-500"
                              >
                                <option value="Contender">Contender</option>
                                <option value="Winner">Winner</option>
                              </select>
                            </td>

                            {/* Winning Reason - VISIBLE ONLY IF Winner is selected (matching screenshots flawlessly) */}
                            <td className="p-3 text-center">
                              {item.status === 'Winner' ? (
                                <select
                                  value={item.winningReason || 'Price'}
                                  onChange={(e) => handleUpdateComparisonRow(index, 'winningReason', e.target.value)}
                                  className="h-8 px-1.5 bg-white border border-emerald-500 text-emerald-700 rounded text-[10px] font-semibold outline-none cursor-pointer"
                                  required
                                >
                                  <option value="Price">Price</option>
                                  <option value="Quality">Quality</option>
                                  <option value="Credit">Credit</option>
                                  <option value="Experience">Experience</option>
                                  <option value="CEO Decision">CEO Decision</option>
                                  <option value="Sole Supplier">Sole Supplier</option>
                                </select>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom of board: "+ Add Supplier" button, File upload, Winning Reason textarea, and summary figures */}
                <div className="p-5 bg-white border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Left Column: Action Button & File Upload */}
                  <div className="md:col-span-3 flex flex-col gap-4">
                    {/* Plus button resembling the screenshot */}
                    <button
                      type="button"
                      onClick={handleAddComparisonRow}
                      className="h-10 px-4 border border-blue-200 hover:border-[#033096] bg-white hover:bg-blue-50/20 text-[#033096] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-98"
                    >
                      <Plus size={13} strokeWidth={2.5} className="text-[#033096]" />
                      <span>Add Supplier Comparison</span>
                    </button>

                    {/* Drag-and-drop / Click File Upload container under button */}
                    <div className="flex-1 flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400/90 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                        File Upload — image/pdf
                        <HelpCircle size={10} className="text-slate-300" title="Upload verification document, invoice, quotation list, or supplier proof" />
                      </span>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const files = e.dataTransfer.files;
                          if (files && files[0]) {
                            handleFileUpload(files[0]);
                          }
                        }}
                        onClick={() => document.getElementById('evaluation-file-picker')?.click()}
                        className="flex-1 min-h-[120px] border-2 border-dashed border-blue-250 hover:border-blue-600 bg-slate-50/50 hover:bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 group shadow-3xs select-none"
                      >
                        <input
                          type="file"
                          id="evaluation-file-picker"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files[0]) {
                              handleFileUpload(files[0]);
                            }
                          }}
                        />
                        {uploadedFile ? (
                          <div className="flex flex-col items-center gap-2.5 relative w-full px-2 py-1">
                            {uploadedFile.type.startsWith('image/') ? (
                              <img
                                src={uploadedFile.dataUrl}
                                alt="Quotation clip"
                                className="w-12 h-12 object-cover rounded-lg border-2 border-slate-200 shadow-2xs hover:scale-105 transition"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="p-2.5 bg-blue-50 text-[#033096] rounded-xl border border-blue-100">
                                <FileText size={24} className="text-[#033096]" />
                              </div>
                            )}
                            <div className="text-center w-full">
                              <span className="text-[11px] font-bold text-slate-750 block truncate max-w-[160px] mx-auto leading-tight">
                                {uploadedFile.name}
                              </span>
                              <span className="text-[9px] text-emerald-750 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider">
                                File Loaded
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedFile(null);
                              }}
                              className="absolute -top-1 -right-1 p-1 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-full border border-rose-200 shadow-3xs cursor-pointer transition"
                            >
                              <X size={11} strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 group-hover:scale-98 transition">
                            <div className="p-2.5 bg-blue-50/50 border border-blue-105 rounded-full text-slate-450 group-hover:text-[#033096] group-hover:bg-blue-50 transition-colors">
                              <svg className="w-5 h-5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                              </svg>
                            </div>
                            <div className="flex flex-col text-center">
                              <span className="font-bold text-slate-600 group-hover:text-[#033096] transition-colors text-[10.5px]">Click or drag files here</span>
                              <span className="text-slate-400 font-semibold text-[9px] uppercase mt-0.5 tracking-wider">PNG, JPG, PDF up to 10MB</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center Column: Winning Reason — Remark Text Area with expanded larger height */}
                  <div className="md:col-span-5 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                      Winning Reason — Remark (Grounds of Decision)
                      <span className="text-red-500 font-bold">*</span>
                    </span>
                    <textarea
                      value={evaluationRemark}
                      onChange={(e) => setEvaluationRemark(e.target.value)}
                      placeholder="Specify the detailed grounds of winner selection, experience edge, price quote advantages, or payment/installment terms..."
                      required
                      className="w-full h-full min-h-[155px] p-4.5 border border-amber-250/70 focus:border-[#033096] rounded-xl text-[12px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#033096]/15 bg-[#fffdf0]/65 focus:bg-white transition hover:border-amber-350 shadow-3xs resize-none leading-relaxed"
                    />
                  </div>

                  {/* Right Column: Calculations Breakdown Panel */}
                  <div className="md:col-span-4 bg-slate-50/50 border border-slate-150/80 rounded-xl p-4 flex flex-col justify-between space-y-3.5 shadow-3xs">
                    {/* Retrieve first winner details if any */}
                    {(() => {
                      const winnerItem = comparisons.find(c => c.status === 'Winner');
                      const usedItem = winnerItem || comparisons[0];
                      if (!usedItem) return null;

                      const calculatedAmount = (orderedQty || 0) * (usedItem.price || 0);
                      const discountAmt = calculatedAmount * (usedItem.discount / 100);
                      const afterDiscount = calculatedAmount - discountAmt;
                      const taxAmt = usedItem.taxRate === 15 ? (afterDiscount * 0.15) : 0;
                      const totalWithTax = afterDiscount + taxAmt;

                      const supObj = suppliers.find(s => s.id === usedItem.supplierId);

                      return (
                        <div className="flex flex-col h-full justify-between">
                          <div className="space-y-1.5 text-xs font-bold text-slate-700">
                            <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold tracking-wider uppercase mb-1.5 border-b border-slate-150 pb-1">
                              <span>Evaluated Model ({winnerItem ? 'Winner' : 'Contender 1'}):</span>
                              <span className="text-[#033096] font-extrabold">{supObj ? supObj.name : 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between items-center font-normal text-slate-500">
                              <span>Amount:</span>
                              <span className="font-mono font-bold text-slate-700">{calculatedAmount.toLocaleString()}</span>
                            </div>
                            {usedItem.discount > 0 && (
                              <div className="flex justify-between items-center font-normal text-slate-500">
                                <span>Discount (-{usedItem.discount}%):</span>
                                <span className="font-mono font-semibold text-emerald-600">-{discountAmt.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center font-normal text-slate-500">
                              <span>TAX ({usedItem.taxRate}%):</span>
                              <span className="font-mono font-bold text-slate-700">{taxAmt.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center border-t border-slate-200/80 pt-2 font-extrabold text-slate-900 mt-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Amount with TAX:</span>
                            <span className="font-mono font-extrabold text-[#033096] text-sm">{totalWithTax.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>

              </div>
              
              {/* Bottom footer bar inside registration modal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                
                {/* Sign-offs / Reviews */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Technical Review By */}
                  <div className="flex flex-col min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Technical Review By</label>
                    <select
                      value={technicalReviewBy}
                      onChange={(e) => setTechnicalReviewBy(e.target.value)}
                      className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 shadow-3xs cursor-pointer"
                    >
                      <option value="">Select reviewer</option>
                      {systemUsers.map(user => (
                        <option key={user.id} value={user.name}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Approved By */}
                  <div className="flex flex-col min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Approved By</label>
                    <select
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 shadow-3xs cursor-pointer"
                    >
                      <option value="">Select approver</option>
                      {systemUsers.map(user => (
                        <option key={user.id} value={user.name}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsRegistrarOpen(false)}
                    className="px-5 h-10 border border-slate-205 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold transition shadow-3xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 h-10 bg-[#033096] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-down shadow-blue-900/10 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
