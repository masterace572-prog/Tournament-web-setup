// src/components/EditProfileModal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const EditProfileModal = ({ isOpen, onClose, currentUserData }) => {
    const [username, setUsername] = useState('');
    const [inGameName, setInGameName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // When the modal opens, pre-fill the form with the user's current data
    useEffect(() => {
        if (currentUserData) {
            setUsername(currentUserData.username || '');
            setInGameName(currentUserData.inGameName || '');
        }
    }, [currentUserData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username) {
            setError('Username cannot be empty.');
            return;
        }
        if (username.length < 3) {
            setError('Username must be at least 3 characters long.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const userRef = doc(db, 'users', currentUserData.userID);
            await updateDoc(userRef, {
                username: username,
                inGameName: inGameName,
            });

            alert('Profile updated successfully!');
            onClose(); // Close the modal on success
        } catch (err) {
            console.error("Error updating profile:", err);
            setError('Failed to update profile. The username might already be taken.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gray-800 w-full max-w-lg rounded-lg shadow-xl p-6 relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <FaTimes />
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-4">Edit Your Profile</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-300">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Your public display name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-300">In-Game Name (IGN)</label>
                            <input
                                type="text"
                                value={inGameName}
                                onChange={(e) => setInGameName(e.target.value)}
                                className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Your BGMI / PUBGM name"
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold disabled:bg-gray-500">
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditProfileModal;