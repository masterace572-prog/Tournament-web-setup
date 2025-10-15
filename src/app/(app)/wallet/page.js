// src/app/(app)/wallet/page.js
'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot, query, where, orderBy, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FaArrowDown, FaArrowUp, FaClock, FaCheckCircle, FaTimesCircle, FaMoneyBillWave } from "react-icons/fa";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";

// A Unified History Item component that can display both Transactions and Requests
const HistoryItem = ({ item }) => {
    // Determine if it's a request or a transaction
    const isRequest = item.type.includes('Request');
    
    let icon, colorClass, title, description, amountText;
    
    const date = (item.timestamp?.toDate() || item.createdAt?.toDate())?.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) || 'N/A';

    if (isRequest) {
        // --- LOGIC FOR REQUESTS ---
        title = `${item.type}`;
        description = `Status: ${item.status}`;
        amountText = `₹${item.amount.toFixed(0)}`;

        switch (item.status) {
            case 'Pending':
                icon = <FaClock />;
                colorClass = 'text-yellow-400';
                break;
            case 'Declined':
                icon = <FaTimesCircle />;
                colorClass = 'text-red-400';
                // Add the admin's note to the description if it exists
                if (item.adminNote) {
                    description += ` - Reason: ${item.adminNote}`;
                }
                break;
            default: // Should not happen with our query, but a good fallback
                icon = <FaCheckCircle />;
                colorClass = 'text-green-400';
        }

    } else {
        // --- LOGIC FOR TRANSACTIONS ---
        const isCredit = item.amount >= 0;
        title = item.type;
        description = item.description;

        if (isCredit) {
            icon = <FaArrowUp />;
            colorClass = 'text-green-400';
            amountText = `+₹${item.amount.toFixed(0)}`;
        } else {
            icon = <FaArrowDown />;
            colorClass = 'text-red-400';
            amountText = `-₹${Math.abs(item.amount).toFixed(0)}`;
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700`}
        >
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full bg-gray-700 ${colorClass}`}>
                    {icon}
                </div>
                <div>
                    <p className="font-semibold text-white capitalize">{title}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                    <p className="text-xs text-gray-500 mt-1">{date}</p>
                </div>
            </div>
            <p className={`font-bold text-lg ${colorClass}`}>{amountText}</p>
        </motion.div>
    );
};


export default function WalletPage() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [history, setHistory] = useState([]); // A single state for combined history
    const [isLoading, setIsLoading] = useState(true);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    // Listener for user data (unchanged)
    useEffect(() => {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) setUserData({ userID: docSnap.id, ...docSnap.data() });
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Combined listener for all history items
    useEffect(() => {
        if (!currentUser) return;
        setIsLoading(true);

        // Query for transactions
        const transQuery = query(collection(db, "transactions"), where("userID", "==", currentUser.uid));
        
        // Query for pending/declined requests
        const reqQuery = query(collection(db, "requests"), where("userID", "==", currentUser.uid), where("status", "in", ["Pending", "Declined"]));

        const unsubscribeTransactions = onSnapshot(transQuery, (transSnapshot) => {
            const transactionsData = transSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, itemType: 'transaction' }));
            
            // Now, inside the first listener, we set up the second one to combine results
            const unsubscribeRequests = onSnapshot(reqQuery, (reqSnapshot) => {
                const requestsData = reqSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, itemType: 'request' }));

                // Combine both lists
                const combinedList = [...transactionsData, ...requestsData];

                // Sort the combined list by date (newest first)
                combinedList.sort((a, b) => {
                    const dateA = a.timestamp?.toDate() || a.createdAt?.toDate();
                    const dateB = b.timestamp?.toDate() || b.createdAt?.toDate();
                    if (dateA && dateB) {
                        return dateB.getTime() - dateA.getTime();
                    }
                    return 0;
                });

                setHistory(combinedList);
                setIsLoading(false);
            });

            // Return the cleanup function for the inner listener
            return unsubscribeRequests;
        });

        // Return the cleanup function for the outer listener
        return () => unsubscribeTransactions();
    }, [currentUser]);

    return (
        <>
            {userData && (
                <>
                    <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} currentUserData={userData} />
                    <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} currentUserData={userData} />
                </>
            )}
            <div className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header, Balance Card, and Action Buttons are unchanged */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-3xl font-bold text-white">My Wallet</h1>
                        <p className="text-gray-400 mt-2">Manage your balance and view your history.</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        className="my-8 p-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg text-white text-center">
                        <p className="text-sm uppercase tracking-widest text-purple-200">Current Balance</p>
                        <p className="text-5xl font-bold mt-2">₹{userData ? userData.walletBalance.toFixed(2) : '0.00'}</p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <button onClick={() => setIsDepositModalOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">Add Money</button>
                        <button onClick={() => setIsWithdrawModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">Withdraw Funds</button>
                    </div>
                    
                    {/* Unified History Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">History</h2>
                        {isLoading ? ( <p className="text-center text-gray-400 mt-10">Loading history...</p> ) 
                        : history.length === 0 ? ( <p className="text-center text-gray-400 mt-10 bg-gray-800/50 p-6 rounded-lg">You have no activity yet.</p> ) 
                        : ( <div className="space-y-4">{history.map(item => (<HistoryItem key={item.id} item={item} />))}</div> )}
                    </div>
                </div>
            </div>
        </>
    );
}
