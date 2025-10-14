// src/components/DepositModal.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const DepositModal = ({ isOpen, onClose, currentUserData }) => {
    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !transactionId) {
            setError('All fields are required.');
            return;
        }
        if (parseFloat(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            // Create a request document in Firestore
            await addDoc(collection(db, 'requests'), {
                userID: currentUserData.userID,
                username: currentUserData.username,
                type: "Deposit",
                amount: parseFloat(amount),
                transactionID: transactionId,
                status: "Pending",
                createdAt: new Date(),
            });

            alert('Deposit request submitted successfully! Please wait for admin approval.');
            onClose(); // Close the modal on success
        } catch (err) {
            console.error("Error submitting deposit request:", err);
            setError('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="bg-gray-800 w-full max-w-lg rounded-lg shadow-xl p-6 relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <FaTimes />
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-4">Add Money to Wallet</h2>
                    
                    {/* Payment Details */}
                    <div className="bg-gray-700/50 p-4 rounded-lg mb-4 text-sm">
                        <p className="font-semibold text-white">1. Make a payment to this UPI ID:</p>
                        <p className="font-mono text-lg text-purple-300 bg-gray-900 p-2 rounded mt-1 text-center">7707887028@omni</p>
                        <p className="font-semibold text-white mt-3">2. Enter the details below:</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-300">Amount (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g., 500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-300">UPI Transaction ID</label>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g., 2184... or T2024..."
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold disabled:bg-gray-500">
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DepositModal;
