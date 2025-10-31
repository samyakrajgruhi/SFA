import {firestore } from "@/firebase";
import {
    doc,
    runTransaction,
    getDoc,
    setDoc
} from 'firebase/firestore';


export const generateAndReserveSfaId = async (): Promise<string> => {
    const counterRef = doc(firestore, 'counters', 'sfa_id_counter');

    try{
        const newSfaId = await runTransaction(firestore, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);

            if(!counterDoc.exists()){
                throw new Error('SFA ID counter not initialized. Please contact administrator. ');
            }

            const currentCount = counterDoc.data().current;

            const newCount = currentCount + 1;
            const newSfaId = `SFA${newCount.toString().padStart(4, '0')}`;

            transaction.update(counterRef,{
                current: newCount,
                lastUpdated: new Date()
            });

            return newSfaId;
        });

        return newSfaId;
    }catch(error) {
        console.error(' Error generating SFA ID:',error);
        throw new Error('Failed to generate SFA ID. Please try again later.');
    }
};


export const initializeSfaCounter = async (startingNumber: number): Promise<void> => {
    const counterRef = doc(firestore, 'counters', 'sfa_id_counter');

    const existingCounter = await getDoc(counterRef);
    if(existingCounter.exists()){
        throw new Error('Counter already initialized. Current value: '+existingCounter.data().current);
    }

    await setDoc(counterRef,{
        current: startingNumber,
        lastUpdated: new Date(),
        initializedAt: new Date(),
        initializedBy: 'admin'
    });
};

export const getCurrentCounterValue = async (): Promise<number | null> => {
    const counterRef = doc(firestore, 'counters', 'sfa_id_counter');
    const counterDoc = await getDoc(counterRef);

    if(!counterDoc.exists()){
        return null;
    }

    return counterDoc.data().current;
}
