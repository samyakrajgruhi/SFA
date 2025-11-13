interface CollectionMember {
  full_name?: string;
  sfa_id?: string;
  cms_id?: string;
  lobby_id?: string;
  qrCodeUrl?: string;
}

export const exportCollectionMembersToCSV = (members: CollectionMember[]) => {
  // Define CSV headers
  const headers = [
    'Name',
    'SFA ID',
    'CMS ID',
    'Lobby',
    'QR Status',
    'Has QR Code URL'
  ];

  // Convert members data to CSV rows
  const rows = members.map(member => {
    return [
      member.full_name || '',
      member.sfa_id || '',
      member.cms_id || '',
      member.lobby_id || '',
      member.qrCodeUrl ? 'Active' : 'Missing',
      member.qrCodeUrl ? 'Yes' : 'No'
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
  });

  // Combine headers and rows
  const csv = [headers.join(','), ...rows].join('\n');

  // Create and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `SFA_Collection_Members_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};