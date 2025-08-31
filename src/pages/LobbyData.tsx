import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const LobbyData = () => {
  const [selectedLobby, setSelectedLobby] = useState('');

  const lobbies = ['ANVT', 'DEE', 'DLI', 'GHH', 'JIND', 'KRJNDD', 'MTC', 'NZM', 'PNP', 'ROK', 'SSB'];

  // Sample data - in real app this would come from backend based on selected lobby
  const sampleData = [
    {
      srNo: 1,
      payDate: '2024-01-15',
      lobby: selectedLobby || 'ANVT',
      sfaId: 'SFA001',
      name: 'Rajesh Kumar',
      cmsId: 'CMS12345',
      receiver: 'Priya Sharma',
      amount: 25,
      paymentMode: 'UPI',
      remarks: 'Monthly contribution'
    },
    {
      srNo: 2,
      payDate: '2024-01-15',
      lobby: selectedLobby || 'ANVT',
      sfaId: 'SFA002',
      name: 'Sunita Devi',
      cmsId: 'CMS12346',
      receiver: 'Priya Sharma',
      amount: 60,
      paymentMode: 'Bank Transfer',
      remarks: ''
    },
    {
      srNo: 3,
      payDate: '2024-01-14',
      lobby: selectedLobby || 'ANVT',
      sfaId: 'SFA003',
      name: 'Mohan Singh',
      cmsId: 'CMS12347',
      receiver: 'Amit Verma',
      amount: 25,
      paymentMode: 'Cash',
      remarks: 'Late payment'
    },
    {
      srNo: 4,
      payDate: '2024-01-14',
      lobby: selectedLobby || 'ANVT',
      sfaId: 'SFA004',
      name: 'Kavita Gupta',
      cmsId: 'CMS12348',
      receiver: 'Amit Verma',
      amount: 60,
      paymentMode: 'UPI',
      remarks: 'Premium contribution'
    },
    {
      srNo: 5,
      payDate: '2024-01-13',
      lobby: selectedLobby || 'ANVT',
      sfaId: 'SFA005',
      name: 'Suresh Yadav',
      cmsId: 'CMS12349',
      receiver: 'Neha Verma',
      amount: 25,
      paymentMode: 'Net Banking',
      remarks: ''
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Lobby Data</h1>
            <p className="text-lg text-text-secondary">View payment records and member contributions by lobby</p>
          </div>

          {/* Lobby Selection */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <label className="text-lg font-semibold text-text-primary whitespace-nowrap">
                Select Lobby:
              </label>
              <Select value={selectedLobby} onValueChange={setSelectedLobby}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Choose a lobby" />
                </SelectTrigger>
                <SelectContent>
                  {lobbies.map((lobby) => (
                    <SelectItem key={lobby} value={lobby}>
                      {lobby}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Data Table */}
          {selectedLobby && (
            <Card className="p-0 overflow-hidden">
              <div className="p-6 bg-surface border-b border-border">
                <h2 className="text-2xl font-bold text-text-primary">
                  {selectedLobby} Lobby - Payment Records
                </h2>
                <p className="text-text-secondary mt-2">
                  Recent payment transactions and member contributions
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface">
                      <TableHead className="font-semibold">Sr. No</TableHead>
                      <TableHead className="font-semibold">Pay Date</TableHead>
                      <TableHead className="font-semibold">Lobby</TableHead>
                      <TableHead className="font-semibold">SFA ID</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">CMS ID</TableHead>
                      <TableHead className="font-semibold">Receiver</TableHead>
                      <TableHead className="font-semibold">Amount (₹)</TableHead>
                      <TableHead className="font-semibold">Payment Mode</TableHead>
                      <TableHead className="font-semibold">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleData.map((row) => (
                      <TableRow key={row.srNo} className="hover:bg-surface-hover">
                        <TableCell className="font-medium">{row.srNo}</TableCell>
                        <TableCell>{row.payDate}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-primary-light text-primary rounded-dashboard-sm font-medium">
                            {row.lobby}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-primary">{row.sfaId}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="font-mono text-sm">{row.cmsId}</TableCell>
                        <TableCell>{row.receiver}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-accent">₹{row.amount}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-dashboard-sm text-xs font-medium ${
                            row.paymentMode === 'UPI' ? 'bg-accent-light text-accent' :
                            row.paymentMode === 'Bank Transfer' ? 'bg-primary-light text-primary' :
                            row.paymentMode === 'Cash' ? 'bg-warning-light text-warning' :
                            'bg-surface text-text-secondary'
                          }`}>
                            {row.paymentMode}
                          </span>
                        </TableCell>
                        <TableCell className="text-text-muted">
                          {row.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="p-6 bg-surface border-t border-border">
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-text-secondary">
                  <div>
                    <span className="font-semibold">Total Records:</span> {sampleData.length}
                  </div>
                  <div>
                    <span className="font-semibold">Total Amount:</span> ₹{sampleData.reduce((sum, row) => sum + row.amount, 0)}
                  </div>
                  <div>
                    <span className="font-semibold">Last Updated:</span> {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!selectedLobby && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-surface rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Select a Lobby</h3>
              <p className="text-text-secondary">Choose a lobby from the dropdown above to view payment data</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LobbyData;