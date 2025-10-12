import React, {useState, useEffect} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import Navbar from '@/components/Navbar';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LobbiesManagement = () => {
    const { user, isAuthenticated, isLoading} = useAuth();
    const {toast} = useToast();
    const navigate = useNavigate();
    const [lobbies, setLobbies] = useState<string[]>(['ANVT','DEE','DLI','GHH','JIND','KRJNDD', 'MTC', 'NZM', 'PNP', 'ROK', 'SSB']);
    const [newLobby, setNewLobby] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingLobbies, setIsLoadingLobbies] = useState(true);
    const isAdmin = user?.isAdmin;

    useEffect(() => {
        const fetchLobbies = async () =>{
            try{
                setIsLoadingLobbies(true);
                const configDoc = await getDoc(doc(firestore,'config','lobbies'));
                if(configDoc.exists()){
                    setLobbies(configDoc.data().lobbies || ['ANVT', 'DEE', 'DLI', 'GHH', 'JIND', 'KRJNDD', 'MTC', 'NZM', 'PNP', 'ROK', 'SSB'] )
                }
            }catch(error) {
                console.error("Error fetching lobbies :",error);
            }finally{
                setIsLoadingLobbies(false);
            }
        };

        if(isAuthenticated && isAdmin) {
            fetchLobbies();
        }
    }, [isAuthenticated, isAdmin]);

    const handleAddLobby = () => {
        const lobbyCode = newLobby.trim().toUpperCase();
        if(!lobbyCode){
            toast({
                title: 'Invalid Lobby',
                description: 'Please enter a valid lobby code',
                variant: 'destructive'
            });
            return;
        }

        if(lobbies.includes(lobbyCOde)){
            toast({
                title: 'Duplicate Lobby',
                description: 'This lobby code already exists',
                variant: 'destructive'
            });
            return;
        }

        setLobbies([...lobbies, lobbyCode].sort());
        setNewLobby('');
    };

    const handleRemoveLobby = (lobby: string) => {
        setLobbies(lobbies.filter(l => l !== lobby));
    };

    const handleSave = async () => {
        if (lobbies.length === 0) {
        toast({
            title: 'Error',
            description: 'At least one lobby is required',
            variant: 'destructive'
        });
        return;
        }

        try {
        setIsSaving(true);
        await setDoc(doc(firestore, 'config', 'lobbies'), {
            lobbies,
            updatedAt: new Date().toISOString(),
            updatedBy: user?.uid
        });

        toast({
            title: 'Success',
            description: 'Lobbies updated successfully'
        });
        } catch (error) {
        console.error('Error saving lobbies:', error);
        toast({
            title: 'Error',
            description: 'Failed to save lobbies',
            variant: 'destructive'
        });
        } finally {
        setIsSaving(false);
        }
    };

    if (isLoading || isLoadingLobbies) {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-20">
            <div className="max-w-4xl mx-auto px-6 py-12">
            <Button 
                variant="ghost" 
                className="mb-6"
                onClick={() => navigate('/admin')}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Menu
            </Button>

            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                <Building className="w-16 h-16 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-text-primary mb-4">Lobby Management</h1>
                <p className="text-lg text-text-secondary">Manage available lobby codes for the system</p>
            </div>

            <Card className="p-6 mb-6">
                <CardHeader>
                <CardTitle>Add New Lobby</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="flex gap-4">
                    <Input
                    type="text"
                    placeholder="Enter lobby code (e.g., ANVT)"
                    value={newLobby}
                    onChange={(e) => setNewLobby(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLobby()}
                    className="flex-1"
                    />
                    <Button onClick={handleAddLobby}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                    </Button>
                </div>
                </CardContent>
            </Card>

            <Card className="p-6 mb-6">
                <CardHeader>
                <CardTitle>Current Lobbies</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {lobbies.map((lobby) => (
                    <div 
                        key={lobby}
                        className="flex items-center justify-between p-4 bg-surface rounded-dashboard border border-border"
                    >
                        <span className="text-lg font-bold text-primary">{lobby}</span>
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLobby(lobby)}
                        className="text-destructive hover:text-destructive"
                        >
                        <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                    ))}
                </div>
                {lobbies.length === 0 && (
                    <p className="text-center text-text-secondary py-8">
                    No lobbies configured. Add one above.
                    </p>
                )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="min-w-32"
                >
                {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
            </div>
        </main>
        </div>
    );
};

export default LobbiesManagement;