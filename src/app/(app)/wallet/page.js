// src/app/(app)/wallet/page.js
'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot, query, where, orderBy, doc, limit } from "firebase/firestore";
import { motion } from "framer-motion";
import { FaArrowDown, FaArrowUp, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";

// A Unified History Item component
const HistoryItem = ({ item }) => {
    // Determine the primary date for sorting and display
    const date = (item.timestamp?.toDate() || item.createdAt?.toDate())?.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) || 'N/A';

    let icon, colorClass, title, description, amountText;

    // Check if the item is a request (by checking for a 'status' field)
    if (item.status) {
        // --- THIS IS A REQUEST ---
        title = `${item.type} Request`;
        amountText = `₹${item.amount.toFixed(0)}`;

        switch (item.status) {
            case 'Pending':
                icon = <FaClock />;
                colorClass = 'text-yellow-400';
                description = `Your request is awaiting admin approval.`;
                break;
            case 'Declined':
                icon = <FaTimesCircle />;
                colorClass = 'text-red-400';
                description = item.adminNote ? `Reason: ${item.adminNote}` : 'Declined by admin.';
                break;
            default: // Should not happen with our query, but good to have
                icon = <FaCheckCircle />;
                colorClass = 'text-gray-500';
                description = `Status: ${item.status}`;
                break;
        }
    } else {
        // --- THIS IS A TRANSACTION ---
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
            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
        >
            <div className="flex items-center space-x-4">
                <div className={`p-2 text-xl rounded-full bg-gray-700 ${colorClass}`}>
                    {icon}
                </div>
                <div>
                    <p className="font-semibold text-white capitalize">{title}</p>
                    <p className="text-xs text-gray-400 max-w-xs truncate">{description}</p>
                    <p className="text-xs text-gray-500 mt-1">{date}</p>
                </div>
            </div>
            <p className={`font-bold text-lg whitespace-nowrap ${colorClass}`}>{amountText}</p>
        </motion.div>
    );
};


export default function WalletPage() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    // Listener for user data
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

        let transactionsData = [];
        let requestsData = [];
        let combinedInitialized = false;

        const updateAndSortHistory = () => {
            if (!combinedInitialized) return; // Don't run until both listeners have fired once
            const combinedList = [...transactionsData, ...requestsData];
            combinedList.sort((a, b) => {
                const dateA = a.timestamp?.toDate() || a.createdAt?.toDate();
                const dateB = b.timestamp?.toDate() || b.createdAt?.toDate();
                return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
            });
            setHistory(combinedList);
            setIsLoading(false);
        };

        const transQuery = query(collection(db, "transactions"), where("userID", "==", currentUser.uid));
        const unsubscribeTransactions = onSnapshot(transQuery, (snapshot) => {
            transactionsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            if (!combinedInitialized && requestsData) combinedInitialized = true;
            updateAndSortHistory();
        }, (error) => console.error("Transaction listener error:", error));

        const reqQuery = query(collection(db, "requests"), where("userID", "==", currentUser.uid), where("status", "in", ["Pending", "Declined"]));
        const unsubscribeRequests = onSnapshot(reqQuery, (snapshot) => {
            requestsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            if (!combinedInitialized && transactionsData) combinedInitialized = true;
            updateAndSortHistory();
        }, (error) => console.error("Request listener error:", error));

        return () => {
            unsubscribeTransactions();
            unsubscribeRequests();
        };
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
                    
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">History</h2>
                        {isLoading ? ( <p className="text-center text-gray-400 mt-10">Loading history...</p> ) 
                        : history.length === 0 ? ( <p className="text-center text-gray-400 mt-10 bg-gray-800/50 p-6 rounded-lg">You have no activity yet.</p> ) 
                        : ( <div className="space-y-4">{history.map(item => (<HistoryItem key={item.itemType + item.id} item={item} />))}</div> )}
                    </div>
                </div>
            </div>
        </>
    );
}
