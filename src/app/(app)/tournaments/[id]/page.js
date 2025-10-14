// src/app/(app)/tournaments/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc, runTransaction, collection } from 'firebase/firestore'; // Added 'collection'
import { db } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTrophy, FaCoins, FaUserCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

// --- Helper Component for Info Cards ---
const InfoCard = ({ icon, title, value, color }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className={`text-3xl ${color} mx-auto mb-2`}>{icon}</div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
);

// --- Main Page Component ---
export default function TournamentDetailPage({ params }) {
    const { currentUser } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);

    useEffect(() => {
        if (!params.id || !currentUser) {
            if (!currentUser) setLoading(false);
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) setUserData(docSnap.data());
        });

        const tournamentRef = doc(db, 'tournaments', params.id);
        const unsubscribeTournament = onSnapshot(tournamentRef, (docSnap) => {
            if (docSnap.exists()) {
                setTournament({ id: docSnap.id, ...docSnap.data() });
            } else {
                setError('Tournament not found.');
            }
            setLoading(false);
        });

        const participantRef = doc(db, `tournaments/${params.id}/participants`, currentUser.uid);
        const unsubscribeParticipant = onSnapshot(participantRef, (docSnap) => {
            setIsJoined(docSnap.exists());
        });

        return () => {
            unsubscribeUser();
            unsubscribeTournament();
            unsubscribeParticipant();
        };
    }, [params.id, currentUser]);

    const handleJoin = async () => {
        setError('');
        if (!currentUser || !tournament || !userData) {
            setError("Data is still loading, please wait.");
            return;
        }

        const isFreeEntry = tournament.entryFee === 0;
        const confirmationMessage = isFreeEntry
            ? `Confirm to join "${tournament.title}" for FREE?`
            : `Confirm to join "${tournament.title}" for ₹${tournament.entryFee}? This will be deducted from your wallet.`;

        if (!window.confirm(confirmationMessage)) return;
        
        setJoinLoading(true);

        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', currentUser.uid);
                const tournamentRef = doc(db, 'tournaments', tournament.id);
                const participantRef = doc(db, `tournaments/${tournament.id}/participants`, currentUser.uid);
                
                const userDoc = await transaction.get(userRef);
                const tournamentDoc = await transaction.get(tournamentRef);

                if (!userDoc.exists() || !tournamentDoc.exists()) throw "User or Tournament data not found.";

                const latestUserData = userDoc.data();
                const latestTournamentData = tournamentDoc.data();
                const entryFee = latestTournamentData.entryFee;

                if (latestUserData.walletBalance < entryFee) throw "Insufficient wallet balance.";
                if (latestTournamentData.slotsFilled >= latestTournamentData.slotsTotal) throw "Tournament is full.";
                const participantSnap = await transaction.get(participantRef);
                if (participantSnap.exists()) throw "You have already joined this tournament.";
                if (latestTournamentData.status !== 'Upcoming') throw "This tournament is not open for joining.";

                if (entryFee > 0) {
                    transaction.update(userRef, { walletBalance: latestUserData.walletBalance - entryFee });
                    const transactionLogRef = doc(collection(db, 'transactions'));
                    transaction.set(transactionLogRef, {
                        userID: currentUser.uid, amount: -entryFee, type: "Entry Fee",
                        description: `Joined: ${latestTournamentData.title}`, tournamentID: tournament.id,
                        timestamp: new Date(),
                    });
                }
                
                transaction.update(tournamentRef, { slotsFilled: latestTournamentData.slotsFilled + 1 });
                transaction.set(participantRef, {
                    participantID: currentUser.uid, username: latestUserData.username,
                    inGameName: latestUserData.inGameName || latestUserData.username,
                    joinTime: new Date(), rank: 0, kills: 0, winnings: 0,
                });
            });
        } catch (e) {
            const errorMessage = (typeof e === 'object' && e.message) ? e.message : (typeof e === 'string' ? e : "An unexpected error occurred.");
            setError(errorMessage);
        } finally {
            setJoinLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-400 mt-20">Loading Tournament Details...</div>;
    }

    if (error && !tournament) {
        return <div className="text-center text-red-400 mt-20">{error}</div>;
    }
    
    // Determine button state
    let joinButtonContent;
    if (isJoined) {
        joinButtonContent = <button disabled className="w-full bg-green-600 text-white font-bold py-3 rounded-lg cursor-not-allowed">Already Joined</button>;
    } else if (tournament.status !== 'Upcoming') {
        joinButtonContent = <button disabled className="w-full bg-gray-600 text-white font-bold py-3 rounded-lg cursor-not-allowed">{tournament.status}</button>;
    } else if (tournament.slotsFilled >= tournament.slotsTotal) {
        joinButtonContent = <button disabled className="w-full bg-yellow-600 text-white font-bold py-3 rounded-lg cursor-not-allowed">Tournament Full</button>;
    } else {
        joinButtonContent = <button onClick={handleJoin} disabled={joinLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/20 disabled:bg-gray-500">
            {joinLoading ? "Processing..." : `Join Now for ₹${tournament.entryFee}`}
        </button>;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                 <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold text-white mb-2"
                 >
                    {tournament.title}
                </motion.h1>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center space-x-6 text-gray-400 mb-6"
                >
                    <span className="flex items-center space-x-2"><FaMapMarkerAlt /> <span>{tournament.map}</span></span>
                    <span className="flex items-center space-x-2"><FaUsers /> <span>{tournament.type}</span></span>
                    <span className="flex items-center space-x-2"><FaCalendarAlt /> <span>{tournament.startTime.toDate().toLocaleDateString()}</span></span>
                </motion.div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        {/* Info cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                            <InfoCard icon={<FaCoins/>} title="Entry Fee" value={`₹${tournament.entryFee}`} color="text-purple-400" />
                            <InfoCard icon={<FaTrophy/>} title="Prize Pool" value={`₹${tournament.prizePool}`} color="text-green-400" />
                            <InfoCard icon={<FaUserCheck/>} title="Slots" value={`${tournament.slotsFilled} / ${tournament.slotsTotal}`} color="text-white" />
                        </div>

                        {/* Rules Section */}
                        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                            <h2 className="text-xl font-bold text-white mb-3">Rules & Regulations</h2>
                            <ul className="list-disc list-inside text-gray-300 space-y-2 text-sm">
                                <li>No teaming in solo matches.</li>
                                <li>No hacking, cheating, or use of exploits.</li>
                                <li>Follow fair play guidelines at all times.</li>
                                <li>Results must be submitted with a screenshot for verification.</li>
                                <li>Admin's decision is final.</li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Right Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="bg-gray-800/50 p-6 rounded-lg sticky top-24 border border-gray-700">
                           <h2 className="text-lg font-bold text-white text-center mb-4">Join the Battle</h2>
                           {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
                           {joinButtonContent}
                           <p className="text-xs text-gray-500 text-center mt-3">Your current wallet balance is ₹{userData ? userData.walletBalance.toFixed(2) : '...'}</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}