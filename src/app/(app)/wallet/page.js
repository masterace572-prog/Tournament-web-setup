// src/app/(app)/wallet/page.js
'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot, query, where, orderBy, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FaArrowDown, FaArrowUp, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";

// Helper component for a single REQUEST status item
const RequestItem = ({ request }) => {
    const date = request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    }) : 'N/A';
    
    let statusIcon, statusColor, statusText;
    switch (request.status) {
        case 'Pending':
            statusIcon = <FaClock className="text-yellow-400" />;
            statusColor = 'border-yellow-500/50';
            statusText = 'text-yellow-400';
            break;
        case 'Approved': // This case will likely not be seen due to filtering
            statusIcon = <FaCheckCircle className="text-green-400" />;
            statusColor = 'border-green-500/50';
            statusText = 'text-green-400';
            break;
        case 'Declined':
            statusIcon = <FaTimesCircle className="text-red-400" />;
            statusColor = 'border-red-500/50';
            statusText = 'text-red-400';
            break;
        default:
            statusIcon = <FaClock />;
            statusColor = 'border-gray-500/50';
            statusText = 'text-gray-400';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 bg-gray-800/50 rounded-lg border ${statusColor}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-white">{request.type} Request</p>
                    <p className="text-lg font-bold text-white">₹{request.amount.toFixed(0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{date}</p>
                </div>
                <div className={`flex items-center space-x-2 text-sm font-bold ${statusText}`}>
                    {statusIcon}
                    <span>{request.status}</span>
                </div>
            </div>
            {request.status === 'Declined' && request.adminNote && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-red-300"><span className="font-bold">Reason:</span> {request.adminNote}</p>
                </div>
            )}
        </motion.div>
    );
};

// Helper component for a single TRANSACTION item
const TransactionItem = ({ transaction }) => {
    const isCredit = transaction.amount >= 0;
    const date = transaction.timestamp?.toDate ? transaction.timestamp.toDate().toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Processing...';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
        >
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${isCredit ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {isCredit ? <FaArrowUp className="text-green-400" /> : <FaArrowDown className="text-red-400" />}
                </div>
                <div>
                    <p className="font-semibold text-white capitalize">{transaction.type}</p>
                    <p className="text-xs text-gray-400">{transaction.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{date}</p>
                </div>
            </div>
            <p className={`font-bold text-lg ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                {isCredit ? `+₹${transaction.amount}` : `-₹${Math.abs(transaction.amount)}`}
            </p>
        </motion.div>
    );
};

export default function WalletPage() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
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

    // Combined listener for transactions and requests
    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);

        const transQuery = query(collection(db, "transactions"), where("userID", "==", currentUser.uid), orderBy("timestamp", "desc"));
        const unsubscribeTransactions = onSnapshot(transQuery, (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const reqQuery = query(collection(db, "requests"), where("userID", "==", currentUser.uid), orderBy("createdAt", "desc"), where("status", "in", ["Pending", "Declined"]));
        const unsubscribeRequests = onSnapshot(reqQuery, (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

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
                        <p className="text-gray-400 mt-2">Manage your balance and view your transaction history.</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        className="my-8 p-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg text-white text-center">
                        <p className="text-sm uppercase tracking-widest text-purple-200">Current Balance</p>
                        <p className="text-5xl font-bold mt-2">₹{userData ? userData.walletBalance.toFixed(2) : '0.00'}</p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <button onClick={() => setIsDepositModalOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">Add Money (Deposit)</button>
                        <button onClick={() => setIsWithdrawModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">Withdraw Funds</button>
                    </div>
                    
                    {requests.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Pending & Recent Requests</h2>
                            <div className="space-y-4">
                                {requests.map(req => (<RequestItem key={req.id} request={req} />))}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Transaction History</h2>
                        {loading ? ( <p className="text-center text-gray-400 mt-10">Loading history...</p> ) 
                        : transactions.length === 0 && requests.length === 0 ? ( <p className="text-center text-gray-400 mt-10 bg-gray-800/50 p-6 rounded-lg">You have no activity yet.</p> ) 
                        : ( <div className="space-y-4">{transactions.map(tx => (<TransactionItem key={tx.id} transaction={tx} />))}</div> )}
                    </div>
                </div>
            </div>
        </>
    );
}
