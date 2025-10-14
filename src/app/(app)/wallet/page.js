// src/app/(app)/wallet/page.js
'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot, query, where, orderBy, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";

// Helper component for a single transaction item
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
    const [loading, setLoading] = useState(true);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    // Real-time listener for user data (wallet balance)
    useEffect(() => {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserData({ userID: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Real-time listener for transaction history
    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);
        const q = query(
            collection(db, "transactions"),
            where("userID", "==", currentUser.uid),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const transactionsData = [];
            querySnapshot.forEach((doc) => {
                transactionsData.push({ id: doc.id, ...doc.data() });
            });
            setTransactions(transactionsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return (
        <>
            {/* The Modals are here, but are only rendered if we have user data and are toggled */}
            {userData && (
                <>
                    <DepositModal
                        isOpen={isDepositModalOpen}
                        onClose={() => setIsDepositModalOpen(false)}
                        currentUserData={userData}
                    />
                    <WithdrawModal
                        isOpen={isWithdrawModalOpen}
                        onClose={() => setIsWithdrawModalOpen(false)}
                        currentUserData={userData}
                    />
                </>
            )}

            <div className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-3xl font-bold text-white">My Wallet</h1>
                        <p className="text-gray-400 mt-2">Manage your balance and view your transaction history.</p>
                    </motion.div>

                    {/* Balance Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="my-8 p-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg text-white text-center"
                    >
                        <p className="text-sm uppercase tracking-widest text-purple-200">Current Balance</p>
                        <p className="text-5xl font-bold mt-2">
                            ₹{userData ? userData.walletBalance.toFixed(2) : '0.00'}
                        </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => setIsDepositModalOpen(true)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            Add Money (Deposit)
                        </button>
                        <button
                            onClick={() => setIsWithdrawModalOpen(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            Withdraw Funds
                        </button>
                    </div>

                    {/* Transaction History */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Transaction History</h2>
                        {loading ? (
                            <p className="text-center text-gray-400 mt-10">Loading transactions...</p>
                        ) : transactions.length === 0 ? (
                            <p className="text-center text-gray-400 mt-10 bg-gray-800/50 p-6 rounded-lg">You have no transactions yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map(tx => (
                                    <TransactionItem key={tx.id} transaction={tx} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}