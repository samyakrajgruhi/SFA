import React, { useEffect, useState } from 'react';
import {useLobbies} from '@/hooks/useLobbies';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import loadLobbyData from '@/utils/loadLobbyData';

const LobbyData = () => {
  const currentDate = new Date();
  const [selectedLobby, setSelectedLobby] = useState('All Lobbies');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [lobbyData, setLobbyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const {lobbies: systemLobbies, isLoading: isLoadingLobbies } = useLobbies();
  const lobbies = ['All Lobbies', ...systemLobbies];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

 useEffect(()=>{
  const fetchData = async () => {
    setIsLoading(true);
    try{
      const data = await loadLobbyData(selectedLobby, selectedMonth, selectedYear);
      setLobbyData(data);
    }catch(error){
      console.log("Error loading data:",error);
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
 }, [selectedLobby, selectedMonth, selectedYear]);
  
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
      ...lobbyData.map(row => [
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
    const fileName = `${selectedLobby.replace(' ', '_')}_${months[selectedMonth]}_${selectedYear}_Payments.csv`;
    link.setAttribute('download', fileName);
    
    // Append the link to the body
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter data based on selected lobby and search term
  const filteredData = lobbyData.filter((row) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      row.name?.toLowerCase().includes(searchLower) ||
      row.sfaId?.toLowerCase().includes(searchLower) ||
      row.cmsId?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Lobby Data</h1>
            <p className="text-lg text-text-secondary">View payment records and member contributions by lobby</p>
          </div>

          {/* Lobby Selection and Search */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center w-full lg:w-auto">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
                    <label className="text-lg font-semibold text-text-primary whitespace-nowrap">
                      Select Lobby:
                    </label>
                    <Select value={selectedLobby} onValueChange={setSelectedLobby} disabled={isLoadingLobbies}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder={isLoadingLobbies ? "Loading lobbies..." : "Choose a lobby"} />
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
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
                    <label className="text-lg font-semibold text-text-primary whitespace-nowrap">
                      Month:
                    </label>
                    <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {months.map((month, index) => (
                          <SelectItem key={index} value={index.toString()} className="hover:bg-surface-hover">
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
                    <label className="text-lg font-semibold text-text-primary whitespace-nowrap">
                      Year:
                    </label>
                    <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()} className="hover:bg-surface-hover">
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={downloadCsv}
                  variant="outline" 
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <Input
                  className="pl-10 bg-surface"
                  placeholder="Search by name, SFA ID, or CMS ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Data Table */}
          {isLoading ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-lg text-text-secondary">Loading lobby data...</p>
              </div>
            </Card>
          ) : selectedLobby && (
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
                    {lobbyData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-text-secondary">
                          No records available for {months[selectedMonth]} {selectedYear}
                        </TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-text-secondary">
                          No records found matching your search
                        </TableCell>
                      </TableRow>
                    ) : filteredData.map((row) => (
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
                    <span className="font-semibold">Total Records:</span> {filteredData.length} {searchTerm && `of ${lobbyData.length}`}
                  </div>
                  <div>
                    <span className="font-semibold">Total Amount:</span> ₹{filteredData.reduce((sum, row) => sum + Number(row.amount), 0)}
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