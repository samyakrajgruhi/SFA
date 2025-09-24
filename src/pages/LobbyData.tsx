import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button'; // Add this import
import { Download } from 'lucide-react'; // Add this import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const LobbyData = () => {
  const [selectedLobby, setSelectedLobby] = useState('All Lobbies');

  const lobbies = ['All Lobbies', 'ANVT', 'DEE', 'DLI', 'GHH', 'JIND', 'KRJNDD', 'MTC', 'NZM', 'PNP', 'ROK', 'SSB'];

  // Sample data with multiple lobbies - in real app this would come from backend
  const allLobbyData = [
    {
      srNo: 1,
      payDate: '2024-01-15',
      lobby: 'DLI',
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
      lobby: 'NZM',
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
      lobby: 'ANVT',
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
      lobby: 'DEE',
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
      lobby: 'GHH',
      sfaId: 'SFA005',
      name: 'Suresh Yadav',
      cmsId: 'CMS12349',
      receiver: 'Neha Verma',
      amount: 25,
      paymentMode: 'Net Banking',
      remarks: ''
    },
    {
      srNo: 6,
      payDate: '2024-01-13',
      lobby: 'JIND',
      sfaId: 'SFA006',
      name: 'Anjali Sharma',
      cmsId: 'CMS12350',
      receiver: 'Ravi Kumar',
      amount: 100,
      paymentMode: 'UPI',
      remarks: 'Special contribution'
    },
    {
      srNo: 7,
      payDate: '2024-01-12',
      lobby: 'MTC',
      sfaId: 'SFA007',
      name: 'Vikram Singh',
      cmsId: 'CMS12351',
      receiver: 'Neha Verma',
      amount: 35,
      paymentMode: 'Bank Transfer',
      remarks: ''
    },
    {
      srNo: 8,
      payDate: '2024-01-12',
      lobby: 'PNP',
      sfaId: 'SFA008',
      name: 'Meera Gupta',
      cmsId: 'CMS12352',
      receiver: 'Amit Verma',
      amount: 50,
      paymentMode: 'Cash',
      remarks: 'Emergency fund'
    }
  ];
  const downloadCsv = () => {
    // Define the headers for the CSV
    const headers = [
      'Sr. No',
      'Pay Date',
      'Lobby',
      'SFA ID',
      'Name',
      'CMS ID',
      'Receiver',
      'Amount (₹)',
      'Payment Mode',
      'Remarks'
    ];
    
    // Convert the data to CSV format
    const csvContent = [
      headers.join(','), // Header row
      ...sampleData.map(row => [
        row.srNo,
        row.payDate,
        row.lobby,
        row.sfaId,
        `"${row.name}"`, // Wrap in quotes to handle names with commas
        row.cmsId,
        `"${row.receiver}"`, // Wrap in quotes
        row.amount,
        `"${row.paymentMode}"`, // Wrap in quotes
        `"${row.remarks || ''}"` // Wrap in quotes, use empty string if null
      ].join(','))
    ].join('\n');
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedLobby.replace(' ', '_')}_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    
    // Append the link to the body
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter data based on selected lobby
  const sampleData = selectedLobby === 'All Lobbies' 
    ? allLobbyData 
    : allLobbyData.filter(item => item.lobby === selectedLobby);

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
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <label className="text-lg font-semibold text-text-primary whitespace-nowrap">
                  Select Lobby:
                </label>
                <Select value={selectedLobby} onValueChange={setSelectedLobby}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Choose a lobby" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border border-border z-50">
                    {lobbies.map((lobby) => (
                      <SelectItem key={lobby} value={lobby} className="hover:bg-surface-hover">
                        {lobby}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Add Download CSV Button */}
              <Button 
                onClick={downloadCsv}
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </Button>
            </div>
          </Card>

          {/* Data Table */}
          {selectedLobby && (
            <Card className="p-0 overflow-hidden">
              <div className="p-6 bg-surface border-b border-border">
                <h2 className="text-2xl font-bold text-text-primary">
                  {selectedLobby === 'All Lobbies' ? 'All Lobbies' : selectedLobby + ' Lobby'} - Payment Records
                </h2>
                <p className="text-text-secondary mt-2">
                  {selectedLobby === 'All Lobbies' 
                    ? 'Combined payment transactions from all lobbies' 
                    : 'Recent payment transactions and member contributions'}
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

        </div>
      </main>
    </div>
  );
};

export default LobbyData;