import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';

export const useLobbies = () => {
  const [lobbies, setLobbies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        setIsLoading(true);
        const configDoc = await getDoc(doc(firestore, 'config', 'lobbies'));
        
        if (configDoc.exists()) {
          const data = configDoc.data();
          setLobbies(data.lobbies || ['ANVT', 'DEE', 'DLI', 'GHH', 'JIND', 'KRJNDD', 'MTC', 'NZM', 'PNP', 'ROK', 'SSB']);
        } else {
          // Default lobbies 
          setLobbies(['ANVT', 'DEE', 'DLI', 'GHH', 'JIND', 'KRJNDD', 'MTC', 'NZM', 'PNP', 'ROK', 'SSB']);
        }
      } catch (err) {
        console.error('Error fetching lobbies:', err);
        setError('Failed to load lobbies');
        // in case of error use default
        setLobbies(['ANVT', 'DEE', 'DLI', 'GHH', 'JIND', 'KRJNDD', 'MTC', 'NZM', 'PNP', 'ROK', 'SSB']);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLobbies();
  }, []);

  return { lobbies, isLoading, error };
};