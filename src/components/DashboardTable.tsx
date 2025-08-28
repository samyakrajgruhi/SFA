import React from 'react';

interface TableRow {
  id: number;
  lobby: string;
  progress: number;
  amount: number;
}

const DashboardTable = () => {
  const tableData: TableRow[] = [
    { id: 1, lobby: 'Main Lobby A', progress: 87, amount: 45000 },
    { id: 2, lobby: 'Conference Hall B', progress: 92, amount: 62000 },
    { id: 3, lobby: 'Executive Suite C', progress: 76, amount: 38000 },
    { id: 4, lobby: 'Meeting Room D', progress: 95, amount: 71000 },
    { id: 5, lobby: 'Reception Area E', progress: 68, amount: 28000 },
    { id: 6, lobby: 'Lounge F', progress: 83, amount: 52000 },
  ];

  const totalAmount = tableData.reduce((sum, row) => sum + row.amount, 0);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'from-accent to-accent-light';
    if (progress >= 75) return 'from-primary to-primary-light';
    if (progress >= 50) return 'from-warning to-warning-light';
    return 'from-gray-300 to-gray-200';
  };

  const getProgressTextColor = (progress: number) => {
    if (progress >= 90) return 'text-accent';
    if (progress >= 75) return 'text-primary';
    if (progress >= 50) return 'text-warning';
    return 'text-text-muted';
  };

  return (
    <div className="dashboard-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-1">Lobby Performance</h3>
        <p className="text-sm text-text-secondary">Real-time progress tracking</p>
      </div>

      <div className="overflow-hidden rounded-dashboard border border-border">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="text-left">Sr.</th>
              <th className="text-left">Lobby</th>
              <th className="text-left">Progress</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr 
                key={row.id} 
                className="hover:bg-surface-hover transition-colors duration-200"
                style={{ 
                  animation: `fadeIn 0.5s ease-out forwards`,
                  animationDelay: `${0.4 + index * 0.1}s`,
                  opacity: 0
                }}
              >
                <td className="font-medium">{row.id}</td>
                <td>
                  <div className="font-medium text-text-primary">{row.lobby}</div>
                  <div className="text-xs text-text-muted">Active</div>
                </td>
                <td>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getProgressTextColor(row.progress)}`}>
                        {row.progress}%
                      </span>
                    </div>
                    <div className="progress-bar h-2 w-24">
                      <div 
                        className={`progress-fill bg-gradient-to-r ${getProgressColor(row.progress)}`}
                        style={{ 
                          width: `${row.progress}%`,
                          animationDelay: `${0.6 + index * 0.1}s`
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="text-right font-medium">{formatAmount(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Amount */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-text-secondary">Total Amount</span>
          <div className="text-right">
            <div className="text-xl font-bold text-text-primary counter">
              {formatAmount(totalAmount)}
            </div>
            <div className="text-xs text-text-muted">Across all lobbies</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTable;