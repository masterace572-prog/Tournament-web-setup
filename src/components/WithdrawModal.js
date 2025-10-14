// src/components/WithdrawModal.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const WithdrawModal = ({ isOpen, onClose, currentUserData }) => {
    const [amount, setAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const minWithdrawal = 100;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const withdrawAmount = parseFloat(amount);

        if (!amount || !upiId) {
            setError('All fields are required.');
            return;
        }
        if (withdrawAmount < minWithdrawal) {
            setError(`Minimum withdrawal amount is ₹${minWithdrawal}.`);
            return;
        }
        if (withdrawAmount > currentUserData.walletBalance) {
            setError('Withdrawal amount cannot exceed your wallet balance.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await addDoc(collection(db, 'requests'), {
                userID: currentUserData.userID,
                username: currentUserData.username,
                type: "Withdrawal",
                amount: withdrawAmount,
                userUpiId: upiId,
                status: "Pending",
                createdAt: new Date(),
            });

            alert('Withdrawal request submitted successfully! It will be processed within 24-48 hours.');
            onClose();
        } catch (err) {
            console.error("Error submitting withdrawal request:", err);
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
                    <h2 className="text-2xl font-bold text-white mb-2">Withdraw Funds</h2>
                    <p className="text-sm text-gray-400 mb-4">Available to withdraw: <span className="font-bold text-purple-300">₹{currentUserData.walletBalance.toFixed(2)}</span></p>
                    
                    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-xs p-3 rounded-lg mb-4">
                        <strong>Note:</strong> Withdrawals are processed manually within 24-48 hours. Minimum withdrawal is ₹{minWithdrawal}.
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-300">Amount to Withdraw (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder={`e.g., ${minWithdrawal}`}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-300">Your UPI ID</label>
                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="yourname@bank"
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold disabled:bg-gray-500">
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default WithdrawModal;